#!/usr/bin/env python3
"""Official NBA PDF injury report: source-verified pregame observation.

Source: https://official.nba.com/nba-injury-report-2026-27-season/
The NBA posts timestamped PDFs repeatedly during the day. This is NOT the
certified active list, not a lineup confirmation, and not player tracking.
An unlisted player is NOT assumed healthy or available. The latest published
report must predate our forecast; source page or PDF failure leaves ESPN
unchanged and is explicitly exposed as a source failure.

Word geometry is used rather than ambiguous plain-text PDF reading.
No names/teams are guessed from PDF fragments or retrospective box scores.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import html.parser
import io
import json
import re
import unicodedata
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path
from zoneinfo import ZoneInfo

PAGE = "https://official.nba.com/nba-injury-report-2026-27-season/"
HOST = "ak-static.cms.nba.com"
PDF_RE = re.compile(r"Injury-Report_(\d{4}-\d{2}-\d{2})_(\d{2})_(\d{2})(AM|PM)\.pdf$", re.I)
STATUSES = {"out": "OUT", "doubtful": "DOUBTFUL", "questionable": "QUESTIONABLE",
            "probable": "PROBABLE", "available": "AVAILABLE"}
ET = ZoneInfo("America/New_York")
TEAMS = {
    "atlanta hawks":"ATL","boston celtics":"BOS","brooklyn nets":"BKN",
    "charlotte hornets":"CHA","chicago bulls":"CHI","cleveland cavaliers":"CLE",
    "dallas mavericks":"DAL","denver nuggets":"DEN","detroit pistons":"DET",
    "golden state warriors":"GSW","houston rockets":"HOU","indiana pacers":"IND",
    "la clippers":"LAC","los angeles clippers":"LAC","los angeles lakers":"LAL",
    "memphis grizzlies":"MEM","miami heat":"MIA","milwaukee bucks":"MIL",
    "minnesota timberwolves":"MIN","new orleans pelicans":"NOP",
    "new york knicks":"NYK","oklahoma city thunder":"OKC","orlando magic":"ORL",
    "philadelphia 76ers":"PHI","phoenix suns":"PHX","portland trail blazers":"POR",
    "sacramento kings":"SAC","san antonio spurs":"SAS","toronto raptors":"TOR",
    "utah jazz":"UTA","washington wizards":"WAS",
}
SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "v"}


def norm(text: str) -> str:
    v = unicodedata.normalize("NFKD", str(text or "")).encode("ascii", "ignore").decode().casefold()
    v = re.sub(r"[^a-z0-9, ]+", " ", v)
    if "," in v:
        chunks = v.split(",", 1)
        v = chunks[1] + " " + chunks[0]
    return " ".join(p for p in v.split() if p not in SUFFIXES)


def name_aliases(text):
    canonical = norm(text)
    return {canonical}


class _Links(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            for k, v in attrs:
                if k == "href" and v:
                    self.links.append(v)


def report_links(html_text, now: dt.datetime):
    if now.tzinfo is None:
        raise ValueError("NBA_OFFICIAL_REPORT_TIMESTAMP_NAIVE")
    links = _Links()
    links.feed(html_text)
    valid = []
    seen = set()
    for href in links.links:
        url = urllib.parse.urljoin(PAGE, href)
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != "https" or parsed.hostname != HOST:
            continue
        if not parsed.path.startswith("/referee/injury/"):
            continue
        match = PDF_RE.search(parsed.path)
        if not match:
            continue
        date, h, m, ampm = match.groups()
        try:
            hour = int(h) % 12 + (12 if ampm.upper() == "PM" else 0)
            et = dt.datetime.fromisoformat(date).replace(hour=hour, minute=int(m), tzinfo=ET)
        except ValueError:
            continue
        stamp = et.astimezone(dt.timezone.utc)
        if stamp > now.astimezone(dt.timezone.utc) + dt.timedelta(minutes=2):
            continue
        if url not in seen:
            valid.append((stamp, url))
            seen.add(url)
    return sorted(valid, key=lambda x: (x[0], x[1]), reverse=True)


def _url_bytes(url, max_size=15_000_000):
    with urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent":"NBAV5IndependentPregameSource/1.0",
                                             "Accept":"text/html,application/pdf"}), timeout=22
    ) as resp:
        data = resp.read(max_size + 1)
    if not data or len(data) > max_size:
        raise ValueError("NBA_OFFICIAL_RESPONSE_SIZE_INVALID")
    return data


def _group_rows(words):
    rows = []
    for w in sorted(words, key=lambda x:(float(x["top"]),float(x["x0"]))):
        top=float(w["top"])
        if not rows or abs(top-rows[-1][0])>2.8:
            rows.append((top,[w]))
        else:
            rows[-1][1].append(w)
    return [sorted(wordlist, key=lambda w:float(w["x0"])) for _,wordlist in rows]


def parse_page_rows(rows, page_width: float, state):
    """Parse the actual PDF's anchored columns, carrying team across pages.

    The NBA layout is: date, time, matchup, team, player, status, reason.
    Repeated or missing dates/time are normal, but incomplete player/status
    pairs cannot be interpreted as a report.
    """
    reports = []
    for words in rows:
        columns = [[],[],[],[],[],[],[]]
        for w in words:
            x=float(w["x0"]) / float(page_width)
            idx = 0 if x<.14 else 1 if x<.225 else 2 if x<.307 else 3 if x<.498 else 4 if x<.688 else 5 if x<.790 else 6
            columns[idx].append(str(w["text"]))
        c=[" ".join(t).strip() for t in columns]
        matchup = re.search(r"\b[A-Z]{2,3}@[A-Z]{2,3}\b", c[2])
        if matchup:
            state["matchup"] = matchup.group(0)
            state["team"] = None
        possible_team = TEAMS.get(norm(c[3]))
        if possible_team:
            state["team"] = possible_team
        status = STATUSES.get(c[5].casefold())
        if not status or not c[4] or not state.get("team") or not state.get("matchup"):
            continue
        # Require a recognizable Last, First name in the NBA player column.
        if "," not in c[4] or len(c[4])>110:
            state["malformed"] += 1
            continue
        reports.append({
            "matchup":state["matchup"], "team_abbr":state["team"],
            "player":c[4], "normalized_player":norm(c[4]),
            "status":status, "reason":c[6][:240],
        })
    return reports


def extract_report(pdf_bytes):
    if not pdf_bytes.startswith(b"%PDF-"):
        raise ValueError("NBA_OFFICIAL_REPORT_NOT_PDF")
    import pdfplumber
    state={"matchup":None,"team":None,"malformed":0}
    data = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            words=page.extract_words(x_tolerance=1.5,y_tolerance=3)
            data.extend(parse_page_rows(_group_rows(words),float(page.width),state))
    if len(data)<5:
        raise ValueError("NBA_OFFICIAL_REPORT_TOO_FEW_PARSEABLE_ROWS")
    seen={}
    for row in data:
        key=(row["matchup"],row["team_abbr"],row["normalized_player"])
        if key in seen and seen[key]["status"]!=row["status"]:
            raise ValueError("NBA_OFFICIAL_REPORT_CONFLICTING_DUPLICATE")
        seen[key]=row
    return list(seen.values()),state["malformed"]


def fetch_snapshot(now=None, page_html=None, pdf_bytes=None):
    now=now or dt.datetime.now(dt.timezone.utc)
    if now.tzinfo is None:
        raise ValueError("NBA_OFFICIAL_REPORT_NO_TIMEZONE")
    raw_page=page_html if page_html is not None else _url_bytes(PAGE,2_000_000).decode("utf-8")
    links=report_links(raw_page, now)
    if not links:
        raise ValueError("NBA_OFFICIAL_NO_PREGAME_PDF_AVAILABLE")
    published_at,url=links[0]
    if now-published_at>dt.timedelta(hours=36):
        raise ValueError("NBA_OFFICIAL_PDF_TOO_OLD")
    raw_pdf=pdf_bytes if pdf_bytes is not None else _url_bytes(url)
    entries,malformed=extract_report(raw_pdf)
    return {
        "schema":"NBA_OFFICIAL_INJURY_REPORT_SNAPSHOT_V1",
        "source_url":PAGE, "report_url":url,
        "published_at_utc":published_at.isoformat(),
        "captured_at_utc":now.astimezone(dt.timezone.utc).isoformat(),
        "source_sha256":hashlib.sha256(raw_pdf).hexdigest(),
        "reports":entries, "rows":len(entries), "unparsed_name_rows":malformed,
        "absence_from_report_does_not_mean_healthy":True,
        "game_active_roster_certified":False,
        "source_kind":"NBA_OFFICIAL_PDF_PREGAME_STATUS",
    }


def abbr(team):
    normalized=norm(team)
    if normalized.upper() in TEAMS.values():
        return normalized.upper()
    return TEAMS.get(normalized)


def for_forecasts(snapshot, v3, now):
    """Only exact game, named player and team matches can affect availability."""
    captured=dt.datetime.fromisoformat(snapshot["captured_at_utc"])
    pub=dt.datetime.fromisoformat(snapshot["published_at_utc"])
    if snapshot["schema"]!="NBA_OFFICIAL_INJURY_REPORT_SNAPSHOT_V1" or \
       not snapshot.get("absence_from_report_does_not_mean_healthy") or \
       snapshot.get("game_active_roster_certified") is not False or \
       captured>now or pub>captured or now-pub>dt.timedelta(hours=36):
        raise ValueError("NBA_OFFICIAL_REPORT_NOT_VALID_FOR_FORECAST")
    lookup={}
    for r in snapshot["reports"]:
        key=(r["matchup"],r["team_abbr"],r["normalized_player"])
        if key in lookup and lookup[key]["status"]!=r["status"]:
            raise ValueError("NBA_OFFICIAL_DUPLICATE_STATUS")
        lookup[key]=r
    matched={}
    for g in v3.get("games",[]):
        away,home=abbr(g["away"]),abbr(g["home"])
        if not away or not home:
            continue
        matchup=f"{away}@{home}"
        roster={}
        for row in g.get("rows",[]):
            side=away if str(row["team_id"])==str(g["away_id"]) else home if str(row["team_id"])==str(g["home_id"]) else None
            if not side:continue
            key=(matchup,side,norm(row["player"]))
            roster.setdefault(key,set()).add(str(row["player_id"]))
        items=[]
        for key,pids in roster.items():
            entry=lookup.get(key)
            if not entry or len(pids)!=1:
                continue
            rec=dict(entry)
            rec.update({"player_id":next(iter(pids)),
                        "team_id":g["away_id"] if key[1]==away else g["home_id"],
                        "published_at_utc":snapshot["published_at_utc"],
                        "report_url":snapshot["report_url"],
                        "source":"official_nba_injury_report"})
            items.append(rec)
        matched[str(g["game_id"])]=items
    return matched


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--out",required=True)
    ap.add_argument("--v3",default="")
    ap.add_argument("--matches-out",default="")
    args=ap.parse_args()
    snapshot=fetch_snapshot()
    Path(args.out).parent.mkdir(parents=True,exist_ok=True)
    Path(args.out).write_text(json.dumps(snapshot,indent=2)+"\n")
    if args.v3:
        v3=json.loads(Path(args.v3).read_text())
        found=for_forecasts(snapshot,v3,dt.datetime.now(dt.timezone.utc))
        if args.matches_out:
            Path(args.matches_out).write_text(json.dumps(found,indent=2)+"\n")
        print("NBA_OFFICIAL_REPORT_MATCHES",sum(len(x) for x in found.values()))
    print("NBA_OFFICIAL_REPORT_CAPTURED",snapshot["report_url"],
          "reports",snapshot["rows"],"malformed",snapshot["unparsed_name_rows"])


if __name__=="__main__":
    main()

"""First-class acquisition of published hoopR NBA player tracking aggregates.

Source is the versioned CC BY 4.0 sportsdataverse-data NBA Stats LeagueDash
release, NOT a cloud scrape of stats.nba.com. Capture season-complete data
only, match on exact normalized player name + matching ESPN team (no invented
IDs), and write a private V5 external-source snapshot. Refuse hindsight
backfills: capture time is the publication time when no earlier evidence is
provable. This adapter does not change model rates until a paired trial earns it.

Requires pandas and pyarrow. Do not redistribute raw source tables.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import io
import json
import math
import re
import unicodedata
import urllib.request
from pathlib import Path

ESPN_ABBR = {
    "1":"ATL","2":"BOS","3":"NOP","4":"CHI","5":"CLE",
    "6":"DAL","7":"DEN","8":"DET","9":"GSW","10":"HOU",
    "11":"IND","12":"LAC","13":"LAL","14":"MIA","15":"MIL",
    "16":"MIN","17":"BKN","18":"NYK","19":"ORL","20":"PHI",
    "21":"PHX","22":"POR","23":"SAC","24":"SAS","25":"OKC",
    "26":"UTA","27":"WAS","28":"TOR","29":"MEM","30":"CHA"}
PROVIDER="SPORTSDATAVERSE_NBA_STATS_LEAGUEDASH"
SCHEMA="NBA_PLAYER_TRACKING_AGGREGATES_V1"
DOC_URL="https://hoopr.sportsdataverse.org/reference/load_nba_stats_leaguedash.html"
LICENSE="https://github.com/sportsdataverse/hoopR-nba-stats-data/blob/main/LICENSE.md"
BASE="https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_leaguedash"
# Maps published NBA Stats release columns, not ESPN inferred plays.
FAMILIES = {
    "player_tracking_drives":{
        "drives_per_game":("drives",)},
    "player_tracking_passing":{
        "passes_made_per_game":("passes_made",),
        "potential_assists_per_game":("potential_ast","potential_assists")},
    "player_tracking_possessions":{
        "touches_per_game":("touches",),
        "time_of_possession_seconds_per_game":("time_of_poss",)},
    "player_tracking_rebounding":{
        "rebound_chances_per_game":("reb_chances",),
        "contested_rebounds_per_game":("reb_contest","contested_reb")},
    "player_tracking_pullupshot":{
        "pullup_attempts_per_game":("pull_up_fga","pullup_fga")},
}
# published NBA Stats league dash numbers are either PerGame or Totals.
PER_GAME={"pergame","per game","per_game"}
TOTAL={"totals","total"}


def canonical_name(name):
    s=unicodedata.normalize("NFKD",str(name or ""))
    s="".join(c for c in s if not unicodedata.combining(c))
    s=re.sub(r"[^a-z0-9]+"," ",s.casefold()).strip()
    return " ".join(s.split())


def as_utc(text):
    x=dt.datetime.fromisoformat(str(text).replace("Z","+00:00"))
    if x.tzinfo is None:
        raise ValueError("NBA_V5_HOOPR_TIMEZONE_REQUIRED")
    return x.astimezone(dt.timezone.utc)


def completed_start_year(captured):
    """Last season fully complete by June 30, never current in-progress one."""
    x=as_utc(captured)
    return x.year-1 if (x.month,x.day)>=(7,1) else x.year-2


def roster_map(v3):
    """Only exact source roster + team IDs, no trades or guessed identities."""
    mapping={}
    ambiguous=set()
    for game in v3.get("games",[]):
        for r in game.get("rows",[]):
            tid=str(r.get("team_id"))
            abbr=ESPN_ABBR.get(tid)
            pid=str(r.get("player_id") or "")
            name=canonical_name(r.get("player"))
            if not abbr or not pid.isdigit() or not name:
                continue
            key=(name,abbr)
            pair=(tid,pid)
            if key in mapping and mapping[key]!=pair:
                ambiguous.add(key)
            else:
                mapping[key]=pair
    for key in ambiguous:
        mapping.pop(key,None)
    return mapping,ambiguous


def _rows(df):
    """Polars/pandas exports may preserve uppercase raw NBA field names."""
    for d in df.to_dict(orient="records"):
        yield {str(k).strip().lower():v for k,v in d.items()}


def _finite(v):
    try:
        if v is None:
            return None
        y=float(v)
        return y if math.isfinite(y) and y>=0 else None
    except (TypeError,ValueError):
        return None


def normalize_tables(tables, roster, captured, season_start):
    """Build an immutable dated tracking snapshot from actual release rows.

    Detect duplicate names and teams *within* a family, reject extra/untrusted
    player-team matches, and never impute an unavailable tracking field.
    """
    seen={}
    combined={}
    evidence=[]
    for family, columns in FAMILIES.items():
        if family not in tables:
            continue
        df=tables[family]
        if not {"player_name","team_abbreviation","gp"}.issubset(set(map(str.lower,df.columns))):
            raise ValueError("NBA_V5_HOOPR_MISSING_PLAYER_JOIN_FIELDS:"+family)
        family_seen=set()
        rows=0
        matched=0
        for row in _rows(df):
            name=canonical_name(row.get("player_name"))
            abbr=str(row.get("team_abbreviation") or "").upper().strip()
            key=(name,abbr)
            # TOT and franchise mismatch are never reassigned.
            if key not in roster:
                continue
            # Reject preseason, playoffs, or other leagues. Only the
            # completed NBA regular season is an eligible player prior.
            season_type=str(row.get("season_type") or "Regular Season").lower().replace(" ","")
            if season_type not in ("regularseason","2"):
                continue
            league_id=str(row.get("league_id") or "00").strip()
            if league_id not in ("00","0","0.0"):
                continue
            if key in family_seen:
                raise ValueError("NBA_V5_HOOPR_AMBIGUOUS_PLAYER_TEAM:"+str(key))
            family_seen.add(key)
            pp=row.get("per_mode")
            mode=str(pp or "Totals").lower().replace(" ","")
            if mode not in {"pergame","totals","total"}:
                continue
            n=_finite(row.get("gp"))
            if n is None or not 1<=n<=82 or int(n)!=n:
                continue
            sample=int(n)
            features={}
            for field, aliases in columns.items():
                val=next((_finite(row[a]) for a in aliases if a in row and _finite(row[a]) is not None),None)
                if val is None:
                    continue
                val = val if mode=="pergame" else val/sample
                # source has per-game tracking; don't call a seconds value
                # minutes, percentages or shots by another unit.
                if field=="time_of_possession_seconds_per_game":
                    # NBA source time_of_poss is minutes per game, convert.
                    val*=60.0
                if val>10000:
                    continue
                features[field]=round(val,5)
            if not features:
                continue
            pair=roster[key]
            result=combined.setdefault(pair,{"team_id":pair[0],"player_id":pair[1],
                                              "sample_games":sample,"features":{}})
            result["sample_games"]=min(result["sample_games"],sample)
            result["features"].update(features)
            matched+=1
            rows+=1
        evidence.append({"family":family,"matched_profiles":matched,
                         "matched_rows_with_fields":rows,
                         "present_columns":sorted(str(c) for c in df.columns if str(c).lower() in {a for aliases in columns.values() for a in aliases})})
    if not combined:
        raise ValueError("NBA_V5_HOOPR_NO_EXACT_CURRENT_ROSTER_TRACKING")
    # Don't claim the observed season ended the day this data was fetched.
    observation_end=dt.datetime(season_start+1,6,30,23,59,tzinfo=dt.timezone.utc)
    now=as_utc(captured)
    if observation_end>=now:
        raise ValueError("NBA_V5_HOOPR_SEASON_NOT_COMPLETE")
    # Conservative as-of: without asset-specific historical capture proof,
    # rows are first considered available at *this* capture time.
    stamp=now.isoformat()
    return {
        "provider":PROVIDER,
        "dataset_schema":SCHEMA,
        "source_documentation_url":DOC_URL,
        "license_or_authorization_reference":LICENSE,
        "observation_end_utc":observation_end.isoformat(),
        "published_at_utc":stamp,
        "captured_at_utc":stamp,
        "player_rows":sorted(combined.values(),key=lambda r:(r["team_id"],r["player_id"])),
    },{"source":PROVIDER,"season_start":season_start,"season_end":season_start+1,
       "as_of_utc":stamp,"audit_by_family":evidence,
       "matched_current_players":len(combined),
       "sample_source":"completed season published NBA Stats aggregate",
       "raw_source_never_publicly_redistributed":True,
       "model_effect":"NOT_PROMOTED"}


def download_family(family, season_start, *, timeout=35):
    """Fetch official public, versioned release (not stats.nba.com)."""
    if family not in FAMILIES:
        raise ValueError("NBA_V5_HOOPR_UNKNOWN_FAMILY")
    url=f"{BASE}/{family}_{season_start+1}.parquet"
    request=urllib.request.Request(url,headers={"User-Agent":"NBA-V5-HoopR-Source/1.0"})
    with urllib.request.urlopen(request,timeout=timeout) as response:
        data=response.read(25_000_001)
    if len(data)>25_000_000:
        raise ValueError("NBA_V5_HOOPR_ASSET_TOO_LARGE")
    import pandas as pd
    return pd.read_parquet(io.BytesIO(data)),{"url":url,"sha256":hashlib.sha256(data).hexdigest(),"bytes":len(data)}


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--v3",required=True,help="Current ESPN forecast roster snapshot")
    p.add_argument("--out",required=True,help="Private normalized tracking profile file")
    p.add_argument("--receipt",default="",help="Optional source quality audit path")
    p.add_argument("--as-of",default="",help="UTC capture instant; default now")
    p.add_argument("--season-start",type=int,default=None,help="Optional last completed season; no future backfill")
    args=p.parse_args()
    captured=as_utc(args.as_of) if args.as_of else dt.datetime.now(dt.timezone.utc)
    last=completed_start_year(captured)
    year=last if args.season_start is None else args.season_start
    if year>last or year<2013:
        raise ValueError("NBA_V5_HOOPR_SEASON_NOT_FINISHED_OR_BEFORE_TRACKING")
    v3=json.loads(Path(args.v3).read_text())
    roster,ambiguous=roster_map(v3)
    if not roster:
        raise ValueError("NBA_V5_HOOPR_NO_PREGAME_ROSTER")
    data={}
    assets=[]
    for family in FAMILIES:
        try:
            df,asset=download_family(family,year)
            data[family]=df
            assets.append({"family":family,**asset})
        except Exception as exc:
            # Missing families are explicit in coverage; no fake values.
            assets.append({"family":family,"unavailable":type(exc).__name__})
    result,audit=normalize_tables(data,roster,captured.isoformat(),year)
    audit.update({"assets":assets,"ambiguous_roster_mappings":len(ambiguous)})
    dest=Path(args.out)
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(result,separators=(",",":")))
    if args.receipt:
        Path(args.receipt).write_text(json.dumps(audit,indent=2))
    print("HOOPR_NBA_TRACKING_REAL_SOURCE",json.dumps(audit),flush=True)

if __name__=="__main__":
    main()

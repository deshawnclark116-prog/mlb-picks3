#!/usr/bin/env python3
"""Capture independently dated ESPN NBA injuries before scheduled tipoff.

This is an ESPN-reported *source observation*, NOT the official NBA injury
report, official active/dressed certification or proof of a game's starting
lineup. Empty league-wide feed NEVER implies all players are healthy.
It is intentionally upstream of the research model and has no sportsbook IO.
"""
from __future__ import annotations
import argparse,datetime as dt,hashlib,json,urllib.request
from pathlib import Path
from nba.nba_2026_roster_source import NBA_IDS
from nba.nba_v1_team_model import UTC,datetime_utc

SCHEMA="NBA_2026_27_ESPN_REPORTED_INJURY_OBSERVATION_V1"
URL="https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries"
STATUS={
    "OUT":"OUT",
    "DOUBTFUL":"DOUBTFUL",
    "QUESTIONABLE":"QUESTIONABLE",
    "PROBABLE":"PROBABLE",
    "DAY-TO-DAY":"DAY_TO_DAY",
    "DAY TO DAY":"DAY_TO_DAY",
    "DTD":"DAY_TO_DAY",
}

def snapshot(now=None,fetcher=None):
    if fetcher is None:
        def fetcher():
            req=urllib.request.Request(URL,headers={
                "Accept":"application/json",
                "User-Agent":"PropEdgeNBAInjurySourceOnly/1.0"})
            with urllib.request.urlopen(req,timeout=25) as res:return res.read()
    raw=fetcher()
    captured=now or dt.datetime.now(UTC)
    if captured.tzinfo is None:raise ValueError("NBA_INJURY_SOURCE_TIMESTAMP_NAIVE")
    captured=captured.astimezone(UTC)
    if not isinstance(raw,bytes) or not 10<=len(raw)<=3_000_000:
        raise ValueError("NBA_INJURY_RESPONSE_NOT_VERIFIABLE_BYTES")
    doc=json.loads(raw)
    if not isinstance(doc,dict) or not isinstance(doc.get("injuries"),list):
        raise ValueError("NBA_ESPN_INJURY_FEED_MISSING_EXPECTED_COLLECTION")
    observed=[];errors=[];seen=set()
    for i,x in enumerate(doc["injuries"]):
        if not isinstance(x,dict):
            errors.append({"index":i,"reason":"NOT_AN_INJURY_OBJECT"});continue
        team=str((x.get("team") or {}).get("id") or "")
        player=str((x.get("athlete") or {}).get("id") or "")
        status=str(x.get("status") or "").upper().strip()
        event_time=x.get("date")
        if team not in NBA_IDS or not player.isdigit():
            errors.append({"index":i,"reason":"UNVERIFIABLE_TEAM_OR_PLAYER_ID"});continue
        try:
            if event_time and datetime_utc(event_time)>captured:
                errors.append({"index":i,"reason":"FUTURE_INJURY_SOURCE_ENTRY"});continue
        except (TypeError,ValueError):
            errors.append({"index":i,"reason":"UNVERIFIABLE_INJURY_ENTRY_TIME"});continue
        norm=STATUS.get(status,"UNKNOWN_NOT_A_GAME_ACTIVE_DESIGNATION")
        key=(team,player)
        if key in seen:
            # Cannot silently promote a player if ESPN conflicts with itself.
            raise ValueError("NBA_INJURY_DUPLICATE_TEAM_PLAYER_ENTRY")
        seen.add(key)
        observed.append({
            "team_id":team,"player_id":player,
            "player":str((x.get("athlete") or {}).get("displayName") or ""),
            "source_reported_status":norm,
            "original_status_label":status,
            "source_entry_date_utc":event_time,
            "reporting_source":"ESPN_INJURIES_NOT_OFFICIAL_NBA_ACTIVE_ROSTER",
            "game_specific_status_certified":False,
            "official_active_or_inactive_certified":False,
            "detail":str(x.get("shortComment") or "")[:200]})
    return {
        "schema":SCHEMA,"source_url":URL,
        "captured_at_utc":captured.isoformat(),
        "source_sha256":hashlib.sha256(raw).hexdigest(),
        "raw_entry_count":len(doc["injuries"]),
        "verified_team_player_entries":len(observed),
        "quarantined_entries":errors,
        "source_status":"ESPN_REPORTED_NOT_OFFICIAL_NBA_INJURY_CERTIFICATION",
        "absence_from_report_does_not_mean_active":True,
        "roster_active_status_certified":False,
        "official_bets":0,"injuries":observed}

def validate(saved,asof):
    if (saved.get("schema")!=SCHEMA or saved.get("source_url")!=URL or
        saved.get("source_status")!="ESPN_REPORTED_NOT_OFFICIAL_NBA_INJURY_CERTIFICATION" or
        saved.get("absence_from_report_does_not_mean_active") is not True or
        saved.get("roster_active_status_certified") is not False or
        saved.get("official_bets")!=0 or
        not isinstance(saved.get("injuries"),list) or
        not isinstance(saved.get("source_sha256"),str) or
        len(saved["source_sha256"])!=64):
        raise ValueError("NBA_FORGED_ESPN_INJURY_STATUS")
    capture=datetime_utc(saved["captured_at_utc"])
    if capture>asof or asof-capture>dt.timedelta(hours=3):
        raise ValueError("NBA_INJURY_DATA_FUTURE_OR_TOO_OLD")
    seen=set()
    for x in saved["injuries"]:
        key=(x["team_id"],x["player_id"])
        if (key in seen or x["team_id"] not in NBA_IDS or not x["player_id"].isdigit() or
            x["source_reported_status"] not in set(STATUS.values())|
               {"UNKNOWN_NOT_A_GAME_ACTIVE_DESIGNATION"} or
            x["game_specific_status_certified"] is not False or
            x["official_active_or_inactive_certified"] is not False):
            raise ValueError("NBA_UNTRUSTWORTHY_INJURY_ENTRY")
        if x.get("source_entry_date_utc") and datetime_utc(
                x["source_entry_date_utc"])>capture:
            raise ValueError("NBA_POST_CAPTURE_INJURY_LOOKAHEAD")
        seen.add(key)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--out",type=Path,required=True)
    a=p.parse_args()
    if a.out.exists():raise ValueError("NBA_INJURY_ORIGINAL_EVIDENCE_EXISTS")
    doc=snapshot()
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(doc,sort_keys=True,indent=2)+"\n")
    print("NBA_ESPN_INJURY_EVIDENCE",json.dumps({
        "captured_at_utc":doc["captured_at_utc"],
        "source_entries":doc["raw_entry_count"],
        "verified_entries":doc["verified_team_player_entries"],
        "quarantined":len(doc["quarantined_entries"]),
        "official_bets":0},sort_keys=True))

if __name__=="__main__":main()

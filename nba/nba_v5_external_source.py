"""Strict NBA V5 authorized tracking and play-type *input* contract.

No automatic scraping or fabricated touches/defensive matchups. An approved
provider must deliver a timestamped player/team aggregate through a local
JSON file or explicit API adapter. This module validates provenance, as-of
time, identity, coverage, units and numeric bounds before the predictor can
even consider its observations. This is ingestion plumbing, not a calibrated
new model and does not alter any existing V5 projected rate.

The source file itself is never copied to a public forecast or public repo.
Only non-redistributable metadata and counts may enter published research
receipts; source terms must be verified separately.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import math
from pathlib import Path

DATASETS={
    "NBA_PLAYER_TRACKING_AGGREGATES_V1":{
        "touches_per_game","drives_per_game","passes_made_per_game",
        "time_of_possession_seconds_per_game","potential_assists_per_game",
        "rebound_chances_per_game","contested_rebounds_per_game",
        "screen_assists_per_game","contested_shots_per_game",
        "closest_defender_distance_ft","catch_shoot_attempts_per_game",
        "pullup_attempts_per_game","shot_clock_seconds_mean",
        "speed_mph_mean","distance_miles_per_game"},
    "NBA_PLAYER_PLAY_TYPES_V1":{
        "isolation_possessions_per_game","pr_ballhandler_possessions_per_game",
        "pr_rollman_possessions_per_game","postup_possessions_per_game",
        "spotup_possessions_per_game","handoff_possessions_per_game",
        "cut_possessions_per_game","offscreen_possessions_per_game",
        "transition_possessions_per_game","offreb_possessions_per_game",
        "isolation_points_per_possession","pr_ballhandler_points_per_possession",
        "pr_rollman_points_per_possession","postup_points_per_possession",
        "spotup_points_per_possession","handoff_points_per_possession",
        "cut_points_per_possession","offscreen_points_per_possession",
        "transition_points_per_possession"
    }
}
PROVIDER_REQUIRED={"provider","dataset_schema","source_documentation_url",
                   "license_or_authorization_reference","published_at_utc",
                   "captured_at_utc","observation_end_utc","player_rows"}
MAX_LOOKBACK=dt.timedelta(days=400)


def utc(raw):
    x=dt.datetime.fromisoformat(str(raw).replace("Z","+00:00"))
    if x.tzinfo is None:
        raise ValueError("NBA_V5_EXTERNAL_NAIVE_TIMESTAMP")
    return x.astimezone(dt.timezone.utc)


def validate_source(data, as_of, allowed_rosters, *, raw_sha256=""):
    """Consume licensed aggregates for exact present-game player/team IDs.

    allowed_rosters: {(team_id, player_id)} from the PRETIP source roster.
    A historic record about a traded player's former team will not silently
    transfer to the new club; mapping requires a provider-specific adapter.
    """
    now=utc(as_of.isoformat() if isinstance(as_of,dt.datetime) else as_of)
    if not isinstance(data,dict) or not PROVIDER_REQUIRED.issubset(data):
        raise ValueError("NBA_V5_EXTERNAL_MISSING_SOURCE_PROVENANCE")
    schema=data["dataset_schema"]
    if schema not in DATASETS:
        raise ValueError("NBA_V5_EXTERNAL_UNRECOGNIZED_DATASET")
    if not data["provider"] or not data["license_or_authorization_reference"]:
        raise ValueError("NBA_V5_EXTERNAL_AUTHORIZATION_REQUIRED")
    if not str(data["source_documentation_url"]).startswith("https://"):
        raise ValueError("NBA_V5_EXTERNAL_SOURCE_URL_REQUIRED")
    captured,published,end=(utc(data[k]) for k in ("captured_at_utc","published_at_utc","observation_end_utc"))
    if not (now>=captured>=published>=end and end>now-MAX_LOOKBACK):
        raise ValueError("NBA_V5_EXTERNAL_FUTURE_OR_STALE_DATA")
    rows=data["player_rows"]
    if not isinstance(rows,list) or not rows:
        raise ValueError("NBA_V5_EXTERNAL_NO_PLAYER_SAMPLES")
    seen=set()
    accepted={}
    unknown_ids=0
    invalid_records=0
    field_coverage={k:0 for k in DATASETS[schema]}
    for r in rows:
        if not isinstance(r,dict):
            invalid_records+=1
            continue
        pid,tid=str(r.get("player_id") or ""),str(r.get("team_id") or "")
        key=(tid,pid)
        if not tid.isdigit() or not pid.isdigit():
            invalid_records+=1
            continue
        if key in seen:
            raise ValueError("NBA_V5_EXTERNAL_DUPLICATE_PLAYER_TEAM")
        seen.add(key)
        if key not in allowed_rosters:
            unknown_ids+=1
            continue
        sample=r.get("sample_games")
        if not isinstance(sample,int) or isinstance(sample,bool) or not 1<=sample<=82:
            invalid_records+=1
            continue
        try:
            feats=r["features"]
            if not isinstance(feats,dict) or not feats or not set(feats).issubset(DATASETS[schema]):
                raise ValueError("UNKNOWN_TRACKING_FIELD")
            for name,value in feats.items():
                v=float(value)
                if not math.isfinite(v) or v<0 or v>10000:
                    raise ValueError("INVALID_TRACKING_VALUE")
                if name.endswith("points_per_possession") and v>4:
                    raise ValueError("INVALID_PPP")
                if name=="closest_defender_distance_ft" and v>50:
                    raise ValueError("INVALID_DISTANCE")
                if name=="shot_clock_seconds_mean" and v>24:
                    raise ValueError("INVALID_CLOCK")
        except (ValueError,TypeError,KeyError):
            invalid_records+=1
            continue
        for field in feats:
            field_coverage[field]+=1
        accepted[key]={"sample_games":sample,"features":{k:float(v) for k,v in feats.items()}}
    return accepted,{
        "schema":"NBA_V5_EXTERNAL_SOURCE_QUALITY_V1",
        "provider":data["provider"],"dataset_schema":schema,
        "published_at_utc":published.isoformat(),
        "captured_at_utc":captured.isoformat(),
        "observation_end_utc":end.isoformat(),
        "local_snapshot_sha256":raw_sha256,
        "valid_matched_player_profiles":len(accepted),
        "unknown_current_roster_mappings":unknown_ids,
        "invalid_player_records":invalid_records,
        "field_coverage_counts":{k:v for k,v in field_coverage.items() if v},
        "raw_features_not_redistributed":True,
        "model_feature_promotion_allowed":False,
        "scope":"AUTHORIZED_HISTORICAL_AGGREGATE_ONLY"}


def read_source(path, as_of, rosters):
    raw=Path(path).read_bytes()
    if len(raw)>25_000_000:
        raise ValueError("NBA_V5_EXTERNAL_FILE_TOO_LARGE")
    return validate_source(json.loads(raw),as_of,rosters,
                           raw_sha256=hashlib.sha256(raw).hexdigest())

"""Strict as-of pregame starters, inactives and announced minutes evidence.

No sportsbook input, inferred confirmed lineup, web scraping or invented tracking.
A source collector must supply a legitimate, timestamped, provider-authorized
export. Projected lineups are diagnostic only, not hard roster instructions.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import math
from pathlib import Path

SCHEMA = "NBA_V5_PREGAME_LINEUP_V1"
MAX_AGE = dt.timedelta(minutes=90)
SOURCES = frozenset(("OFFICIAL_TEAM_RELEASE", "AUTHORIZED_LINEUP_PROVIDER", "NBA_OFFICIAL_LIVE_BOXSCORE", "NBA_TODAYS_LINEUPS_AUTHORIZED_SNAPSHOT", "NBA_OFFICIAL_DAILY_LINEUPS"))


def _utc(x):
    if not isinstance(x, str):
        raise ValueError("pregame evidence UTC timestamp missing")
    try:
        value = dt.datetime.fromisoformat(x.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("pregame evidence UTC timestamp malformed") from exc
    if value.tzinfo is None:
        raise ValueError("pregame evidence must carry timezone")
    return value.astimezone(dt.timezone.utc)


def _ids(items, roster, label):
    if not isinstance(items, list):
        raise ValueError(label + " must be a list")
    got = []
    for x in items:
        if not isinstance(x, (int, str)) or not str(x).strip():
            raise ValueError(label + " has invalid player ID")
        pid = str(x)
        if pid not in roster:
            raise ValueError(label + " has player not in verified forecast roster: " + pid)
        if pid in got:
            raise ValueError(label + " contains duplicate player")
        got.append(pid)
    return got


def load(path, now, slate):
    """Validate an immutable as-of source file against this exact V3 slate.

    No source may backfill old forecasts, attach to the wrong game, introduce
    unknown roster members, or mark an unconfirmed lineup as authoritative.
    """
    raw = Path(path).read_bytes()
    if len(raw) > 2_000_000:
        raise ValueError("pregame source exceeds strict size limit")
    data = json.loads(raw)
    if data.get("schema") != SCHEMA or data.get("provider") not in SOURCES:
        raise ValueError("unknown pregame evidence schema or provider")
    if not isinstance(data.get("source_url"), str) or not data["source_url"].startswith("https://"):
        raise ValueError("pregame source HTTPS URL required")
    now = _utc(now.isoformat()) if isinstance(now, dt.datetime) else _utc(now)
    published, captured = _utc(data.get("published_at_utc")), _utc(data.get("captured_at_utc"))
    if not published <= captured <= now or now - captured > MAX_AGE:
        raise ValueError("stale, future or out-of-order pregame source")
    entries = data.get("games")
    if not isinstance(entries, list) or len(entries) > 20:
        raise ValueError("invalid pregame game list")
    games = {str(g["game_id"]): g for g in slate}
    found = {}
    for rec in entries:
        gid = str(rec.get("game_id"))
        g = games.get(gid)
        if g is None:
            raise ValueError("pregame evidence references unknown game " + gid)
        tip = _utc(g["tipoff_utc"])
        if _utc(rec.get("tipoff_utc")) != tip or not now < tip:
            raise ValueError("pregame evidence after tip or wrong tipoff")
        if not isinstance(rec.get("teams"), list):
            raise ValueError("missing pregame teams")
        for team in rec["teams"]:
            tid = str(team.get("team_id"))
            if tid not in {str(g["home_id"]), str(g["away_id"])}:
                raise ValueError("team does not belong to game")
            key = (gid, tid)
            if key in found:
                raise ValueError("duplicate team in pregame evidence")
            roster = {str(row["player_id"]): row for row in g["rows"]
                      if str(row.get("team_id")) == tid}
            if not roster:
                raise ValueError("pregame team has no known roster")
            state = team.get("lineup_state")
            if state not in ("CONFIRMED", "PROJECTED", "NOT_POSTED"):
                raise ValueError("unknown pregame lineup state")
            starters = _ids(team.get("starters", []), roster, "starters")
            inactive = _ids(team.get("inactive", []), roster, "inactive")
            if set(starters) & set(inactive):
                raise ValueError("starter also listed inactive")
            if state == "CONFIRMED" and len(starters) != 5:
                raise ValueError("confirmed lineup requires exactly five starters")
            if state != "CONFIRMED" and inactive:
                raise ValueError("uncertified source cannot issue hard roster instructions")
            for pid in starters:
                # A verified *official* pretip starting five is stronger
                # than a stale ESPN OUT observation. The V5 forecast still
                # rejects any contradiction with a fresh NBA injury PDF.
                if (state == "CONFIRMED" and roster[pid].get("reported_status") == "OUT"
                    and data["provider"] not in ("NBA_OFFICIAL_LIVE_BOXSCORE", "NBA_OFFICIAL_DAILY_LINEUPS")):
                    raise ValueError("confirmed starter conflicts with OUT report")
            limits = {}
            for item in team.get("minute_limits", []):
                if not isinstance(item, dict):
                    raise ValueError("minutes restriction must be an object")
                pid = str(item.get("player_id"))
                try:
                    max_min = float(item.get("announced_max_minutes"))
                except (ValueError, TypeError):
                    raise ValueError("minutes restriction must be explicit and numeric")
                if (pid not in roster or pid in inactive or pid in limits or
                    not math.isfinite(max_min) or not 5 <= max_min <= 48):
                    raise ValueError("invalid/conflicting minutes restriction")
                if not str(item.get("announcement_source_url", "")).startswith("https://"):
                    raise ValueError("minutes restriction needs independent source URL")
                limits[pid] = max_min
            found[key] = {"lineup_state": state, "starters": starters,
                          "inactive": inactive, "minute_limits": limits,
                          "published_at_utc": published.isoformat(),
                          "captured_at_utc": captured.isoformat(),
                          "source_provider": data["provider"],
                          "source_url": data["source_url"]}
    audit = {"schema": SCHEMA, "sha256": hashlib.sha256(raw).hexdigest(),
             "source_provider": data["provider"], "published_at_utc": published.isoformat(),
             "captured_at_utc": captured.isoformat(), "teams_recorded": len(found),
             "confirmed_teams": sum(x["lineup_state"] == "CONFIRMED" for x in found.values()),
             "projected_teams": sum(x["lineup_state"] == "PROJECTED" for x in found.values()),
             "model_effect": "CONFIRMED_ONLY_PROJECTED_DIAGNOSTIC"}
    return found, audit



def load_many(paths, now, slate):
    """Use every independently valid pretip source, selecting by *team*.

    Selecting one provider for an entire slate loses verified lineups that
    another provider captured for different games. Each source is validated
    against the same as-of roster and clock before any data is combined.
    Conflicting confirmed fives are excluded for that team, not guessed.
    """
    if not isinstance(paths, (list, tuple)) or len(paths) > 6:
        raise ValueError("pregame sources must be a bounded list")
    priority = {
        "NBA_OFFICIAL_DAILY_LINEUPS": 0,
        "NBA_TODAYS_LINEUPS_AUTHORIZED_SNAPSHOT": 1,
        "NBA_OFFICIAL_LIVE_BOXSCORE": 2,
        "OFFICIAL_TEAM_RELEASE": 3,
        "AUTHORIZED_LINEUP_PROVIDER": 4,
    }
    candidates = {}
    valid_sources = []
    rejected_sources = []
    for path in paths:
        try:
            records, audit = load(path, now, slate)
        except (OSError, ValueError, TypeError, KeyError, AttributeError) as exc:
            # Invalid/stale sources can never erase a separately verified five.
            rejected_sources.append(type(exc).__name__)
            continue
        valid_sources.append({"provider": audit["source_provider"],
                              "teams_recorded": audit["teams_recorded"],
                              "confirmed_teams": audit["confirmed_teams"]})
        for key, record in records.items():
            candidates.setdefault(key, []).append(record)

    selected = {}
    conflicts = []
    for key, entries in sorted(candidates.items()):
        confirmed = [record for record in entries
                     if record["lineup_state"] == "CONFIRMED"]
        if len({frozenset(record["starters"]) for record in confirmed}) > 1:
            # Neither provider has authority to override a contradictory
            # explicitly confirmed five without newer source verification.
            conflicts.append({"game_id": key[0], "team_id": key[1],
                              "reason": "CONFLICTING_CONFIRMED_STARTING_FIVES"})
            continue
        viable = confirmed if confirmed else entries
        selected[key] = min(
            viable,
            key=lambda record: (
                -len(record["minute_limits"]),
                priority.get(record["source_provider"], 99),
                -_utc(record["captured_at_utc"]).timestamp(),
            ),
        )

    timestamps = [record["captured_at_utc"] for record in selected.values()]
    audit = {
        "schema": SCHEMA,
        "source_status": ("VALIDATED_TEAMWISE_MERGE" if valid_sources
                          else "ALL_SOURCES_REJECTED" if paths else "NOT_CONNECTED"),
        "source_provider": "MULTIPLE_VALIDATED_ORIGINAL_PROVIDERS",
        "valid_sources": valid_sources,
        "rejected_source_count": len(rejected_sources),
        "rejected_source_error_types": rejected_sources,
        "confirmed_teams": sum(record["lineup_state"] == "CONFIRMED"
                               for record in selected.values()),
        "teams_recorded": len(selected),
        "confirmed_conflicts_rejected": conflicts,
        "captured_at_utc": max(timestamps) if timestamps else None,
        "model_effect": "ONLY_VALIDATED_UNCONFLICTED_CONFIRMATIONS",
    }
    return selected, audit


def apply_confirmed(team, record):
    """Attach certified starters/inactive/minute inputs to the V5 TeamInput.

    minutes_cap is the existing model's soft rotation-weight adjustment, NOT
    a guaranteed on-court hard cap. Do not promise exact restricted minutes.
    """
    if record is None or (record["lineup_state"] != "CONFIRMED" and not record["minute_limits"]):
        return {"applied": False, "reason": "NO_CERTIFIED_CHANGE"}
    import numpy as np
    ids = list(map(str, team.ids))
    confirmed = record["lineup_state"] == "CONFIRMED"
    if confirmed and not set(record["starters"]).issubset(ids):
        raise ValueError("confirmed starters absent from simulator roster")
    # ESPN/V3 may have ALREADY excluded a certified inactive from its
    # sim roster. This is legitimate; do not recreate or simulate them.
    if len(set(ids) - set(record["inactive"])) < 5:
        raise ValueError("fewer than five non-inactive roster players")
    starter = np.array([pid in record["starters"] for pid in ids], bool)
    if confirmed and int(starter.sum()) != 5:
        raise ValueError("incomplete certified starters")
    p = np.array(team.p_play, dtype=float).copy()
    if confirmed:
        p[starter] = 0.999
        p[[pid in record["inactive"] for pid in ids]] = 0.0
    caps = (np.array(team.minutes_cap, float).copy() if team.minutes_cap is not None
            else np.full(len(ids), 48.0))
    for i, pid in enumerate(ids):
        if pid in record["minute_limits"]:
            caps[i] = min(caps[i], record["minute_limits"][pid])
    if confirmed:
        team.starter = starter
        team.p_play = p
    if record["minute_limits"]:
        team.minutes_cap = caps
    return {"applied": True, "confirmed_starters": len(record["starters"]) if confirmed else 0,
            "explicit_inactive": len(record["inactive"]),
            "announced_minute_limits": len(record["minute_limits"]),
            "limits_are_soft_rotation_weights": bool(record["minute_limits"])}

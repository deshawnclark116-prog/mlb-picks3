"""As-of NBA V5 rotation coverage audit; no changes to model probabilities.

The simulator conserves 240 minutes *among its input players*. This audit
asks how much of each team's recently observed rotation was represented
in that input. A missing established player may legitimately be OUT;
therefore coverage is a warning, not proof the player should play tonight.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import date


def _date(value):
    return value if isinstance(value, date) else date.fromisoformat(str(value)[:10])


def past_team_rotation(rp, team_id, asof_date, lookback=3):
    """Past-only actual team minute allocation, no target-game box score.

    rp.v4.team_rosters includes dated historical membership; rp.hist includes
    historical actual minutes. The team/date join prevents counting minutes
    from games after a player changed teams.
    """
    if not 1 <= lookback <= 15:
        raise ValueError("rotation lookback outside supported range")
    cutoff = _date(asof_date)
    entries = [( _date(day), list(players))
               for day, players in rp.v4.team_rosters.get(str(team_id), [])
               if _date(day) < cutoff]
    entries.sort(key=lambda x: x[0])
    entries = entries[-lookback:]
    total = defaultdict(float)
    for day, roster in entries:
        for pid in set(map(str, roster)):
            histories = [h for h in rp.hist.get(pid, [])
                         if _date(h["date"]) == day]
            if len(histories) != 1:
                continue
            minutes = float(histories[0].get("min", 0))
            if 0 < minutes <= 53:  # 48 regulation; occasional overtime
                total[pid] += minutes
    return {pid:round(v,3) for pid,v in total.items()}, len(entries)


def audit_team(rp, team, game, asof_date):
    """Report how many earlier minutes each staged roster can represent."""
    tid=str(team.team_id)
    raw,recent_n=past_team_rotation(rp,tid,asof_date)
    input_ids={str(p["id"]) for p in game.get("players",[])
               if str(p.get("team"))==tid}
    simulated={str(pid) for pid in team.ids}
    total=sum(raw.values())
    represented=sum(v for pid,v in raw.items() if pid in simulated)
    not_in_fixture=sum(v for pid,v in raw.items() if pid not in input_ids)
    lost_in_model=sum(v for pid,v in raw.items() if pid in input_ids and pid not in simulated)
    omit_fixture=[{"player_id":pid,"prior_minutes":m}
                  for pid,m in raw.items() if pid not in input_ids]
    omit_model=[{"player_id":pid,"prior_minutes":m}
                for pid,m in raw.items() if pid in input_ids and pid not in simulated]
    return {
        "status":"PAST_ONLY_COVERAGE_DIAGNOSTIC_NO_HARD_GATE",
        "source":"prior team game rosters and minutes strictly before forecast date",
        "asof_date":str(_date(asof_date)),
        "team_id":tid,
        "past_games_observed":recent_n,
        "past_minutes_total":round(total,2),
        "represented_fraction":round(represented/total,4) if total else None,
        "excluded_prior_minutes_fraction":round((not_in_fixture+lost_in_model)/total,4) if total else None,
        "missing_from_fixture_prior_minutes":round(not_in_fixture,2),
        "missing_from_model_prior_minutes":round(lost_in_model,2),
        "missing_from_fixture":sorted(omit_fixture,key=lambda x:-x["prior_minutes"]),
        "missing_from_model":sorted(omit_model,key=lambda x:-x["prior_minutes"]),
        "candidate_roster_count":len(input_ids),
        "simulator_roster_count":len(simulated),
        "warning":(
            "INSUFFICIENT_PAST_ROTATION_DATA" if recent_n < 2 or total < 200 else
            "MATERIAL_PRIOR_ROTATION_UNREPRESENTED" if (not_in_fixture+lost_in_model)/total>=0.25 else
            "NORMAL_RECENT_ROSTER_COVERAGE"
        ),
        "interpretation":"Missing prior minutes may be from legitimately unavailable players. "
                         "Do not add them tonight or rewrite their projections without verified pretip availability."
    }

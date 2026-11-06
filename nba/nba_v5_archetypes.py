"""NBA V5 observable player-opportunity archetypes, not licensed tracking data.

A role label describes historical *box-score opportunity* (minutes, FGA,
3PA, AST, rebounds), not basketball IQ, defensive scheme, shooting talent,
height, or a Synergy play type. Source rows must be dated strictly before
the prediction. These labels are DIAGNOSTIC ONLY until a paired ablation
proves useful predictive changes; they never alter the current V5 champion.

Missing games and rookies are kept as insufficient evidence rather than
silently imputed. This is also a stable basis for opportunity-stratified
whole-forecast grading after the final result is available.
"""
from __future__ import annotations
import datetime as dt
import math
from typing import Any

MIN_GAMES = 5
WINDOW = 18
MAX_GAMES = 50


def _date(v: Any) -> dt.date:
    return v.date() if isinstance(v, dt.datetime) else v if isinstance(v, dt.date) else dt.date.fromisoformat(str(v)[:10])


def player_archetype(history: list[dict], as_of: dt.date | str) -> dict:
    day=_date(as_of)
    rows=sorted((r for r in history if r.get("date") is not None
                 and _date(r["date"])<day
                 and float(r.get("min") or 0)>1),key=lambda r:_date(r["date"]))[-WINDOW:]
    prior_minutes=sum(float(r["min"]) for r in rows)
    base={"version":"nba-v5-box-opportunity-archetype-v1",
          "as_of_date":day.isoformat(),"games":len(rows),
          "minutes_observed":round(prior_minutes,1),
          "role_class":"INSUFFICIENT_HISTORY",
          "role_confidence":"LOW",
          "source":"PAST_GAME_BOX_OPPORTUNITIES_ONLY",
          "not_tracked_play_type":True,
          "model_effect":"SHADOW_ONLY"}
    if len(rows)<MIN_GAMES or prior_minutes<55:
        return base
    n=prior_minutes
    def rate(key):
        return 36*sum(float(r.get(key) or 0) for r in rows)/n
    fga,three,ast,reb,fta,tov=(rate("fga"),rate("tpa"),rate("ast"),
                               rate("reb"),rate("fta"),rate("tov"))
    share=three/max(fga,1e-6)
    mins=n/len(rows)
    metrics={"fga_per36":round(fga,2),"three_attempts_per36":round(three,2),
             "three_attempt_share":round(share,3),"assists_per36":round(ast,2),
             "rebounds_per36":round(reb,2),"fta_per36":round(fta,2),
             "turnovers_per36":round(tov,2),"recent_minutes_per_game":round(mins,1)}
    if fga>=16 and ast>=5:
        role="HIGH_USAGE_CREATOR"
    elif fga>=14 and ast<5:
        role="VOLUME_SCORER"
    elif ast>=6 and fga<16:
        role="PRIMARY_FACILITATOR"
    elif reb>=10 and share<.30:
        role="INTERIOR_REBOUNDER"
    elif share>=.55 and three>=5:
        role="PERIMETER_SPACER"
    elif fga>=9 and fta>=5 and share<.33:
        role="RIM_PRESSURE_SCORER"
    elif reb>=7 and ast>=3:
        role="CONNECTOR_REBOUNDER"
    else:
        role="BALANCED_OR_LOW_USAGE"
    base.update({"role_class":role,"opportunity_features":metrics,
                 "role_confidence":"MEDIUM" if len(rows)<12 else "HIGH"})
    return base

"""Pure pretip player-participation research challenger; no future result access.

The same function is used by the next-game LIVE frozen challenger field and
the postgame research scorer. No odds, sportsbook availability, or hidden
target-game outcome is consulted. Not a confirmed roster certification.
"""
from __future__ import annotations

LOOKBACK=6
HALF_LIFE_GAMES=2.0
PRIOR_P=.96
PRIOR_GAME_EQUIVALENTS=3.0


def estimate_unlisted(incumbent, team_history, player_id, target_game_day):
    if not 0 <= float(incumbent) <= 1:
        raise ValueError("NBA_V5_PPLAY_INCUMBENT_OUTSIDE_PROBABILITY_RANGE")
    before=[x for x in team_history if x[0]<target_game_day][-LOOKBACK:]
    if len(before)<3:
        return float(incumbent), "INSUFFICIENT_PRIOR_TEAM_GAMES"
    first=next((i for i,(_,_,members) in enumerate(before)
                if str(player_id) in members),None)
    if first is None:
        return float(incumbent), "NO_CURRENT_TEAM_PRIOR_APPEARANCE"
    recent=before[first:]
    n=len(recent)
    weights=[.5**((n-1-i)/HALF_LIFE_GAMES) for i in range(n)]
    played=sum(w for w,item in zip(weights,recent)
               if str(player_id) in item[2])
    p=(PRIOR_GAME_EQUIVALENTS*PRIOR_P+played)/(PRIOR_GAME_EQUIVALENTS+sum(weights))
    return round(max(.05,min(.99,p)),6), "RECENCY_SHRUNK_SAME_TEAM_PRIOR_APPEARANCES"

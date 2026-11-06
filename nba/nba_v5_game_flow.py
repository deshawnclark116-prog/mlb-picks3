"""NBA V5 game-flow research: before-date possession pressure by 2-minute stretch.

ESPN final PBP supplies FGA, turnovers, offensive rebounds and free throw
attempts. These are only proxies for possession changes, not possession
timestamps or verified shot-clock observations. Sum *both teams* to avoid
mislabeled ESPN event team IDs corrupting a learned tempo distribution.

Learn one 24-stretch pattern with a strong uniform prior, bounded relative
pressure and exact normalization. No event on or after a forecast date enters
the distribution. Does NOT add possessions to the game; only redistributes
them across existing two-minute segments. OFF unless paired challenger passes.
"""
from __future__ import annotations

import numpy as np

SEGMENTS=24
SHRINK_GAME_EQUIV=40.0
LIMIT=.20


def game_cadence(pb):
    if not isinstance(pb,dict) or not pb.get("events"):
        return None
    tally=np.zeros(SEGMENTS,float)
    shot_events=0
    for e in pb["events"]:
        try:
            period,left,kind=e[0],float(e[1]),e[2]
            if not isinstance(period,int) or not 1<=period<=4 or not 0<=left<=720:
                continue
            seg=(period-1)*6+min(5,int((720-left)/120))
            if kind in ("S2","S3"):
                tally[seg]+=1
                shot_events+=1
            elif kind=="TO":
                tally[seg]+=1
            elif kind=="OR":
                tally[seg]-=1
            elif kind=="FT":
                tally[seg]+=.44
        except (ValueError,TypeError,IndexError):
            continue
    if shot_events<75:
        return None
    # A quarter can have a long negative sequence when a PBP feed is
    # malformed or multiple team rebounds are recorded. Exclude the game.
    if float(tally.min()) < -2.0 or float(tally.sum())<120.0:
        return None
    tally=np.maximum(tally,0)
    return tally/(float(tally.sum()))


class GameFlowState:
    def __init__(self):
        self.games=0
        self.rejected=0
        self.sum_share=np.zeros(SEGMENTS,float)

    def add_game(self,pb):
        x=game_cadence(pb)
        if x is None:
            self.rejected+=1
            return False
        self.games+=1
        self.sum_share+=x
        return True

    def pattern(self):
        if self.games<30:
            return np.ones(SEGMENTS,float)
        # 40 game-equivalents of uniform prior. This shrinks away noise
        # in low-volume 2-minute segments and avoids overfitting timing.
        mu=(self.sum_share+SHRINK_GAME_EQUIV/SEGMENTS)/(self.games+SHRINK_GAME_EQUIV)
        raw=mu*SEGMENTS
        dev=raw-1.0
        high=float(dev.max())
        low=float(dev.min())
        t=1.0
        if high>0:t=min(t,LIMIT/high)
        if low<0:t=min(t,LIMIT/(-low))
        # convex shrinkage toward 1 both preserves exact 24-segment mean
        # and guarantees EACH component stays within the safety bounds.
        return 1.0+t*dev

    def audit(self):
        pattern=self.pattern()
        return {"source":"PREVIOUS_DATED_ESPN_FINAL_PBP",
                "games_with_valid_possession_proxies":self.games,
                "rejected_game_traces":self.rejected,
                "period_weight_sum":round(float(pattern.sum()),5),
                "end_of_quarter_stretches": {
                    "Q1":round(float(pattern[5]),4),
                    "Q2":round(float(pattern[11]),4),
                    "Q3":round(float(pattern[17]),4),
                    "Q4":round(float(pattern[23]),4)},
                "pattern":[round(float(v),5) for v in pattern],
                "not_verified_shot_clock":True,
                "model_effect":"SHADOW_ONLY"}

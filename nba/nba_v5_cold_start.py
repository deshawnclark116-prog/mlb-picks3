"""NBA V5 low-history rotation: learned common stints, not invented rookie role.

Build starter/bench time-of-game occupancy priors from games completed
BEFORE each prediction. A player with one to four real prior NBA box lines
can receive a heavily shrunk profile instead of disappearing from the V5
simulation. With zero observed NBA games, do not create a skill projection:
current roster membership is not evidence of individual NBA playing ability.

This remains a SHADOW candidate until forward evaluation against the V5
champion shows the original player projections actually improve.
"""
from __future__ import annotations

from collections import defaultdict
import numpy as np

SEG=24
MIN_ROLE_SAMPLES=20
MAX_TARGET_MIN=38.0


def bucket(minutes):
    return "HIGH" if minutes>=28 else "MEDIUM" if minutes>=18 else "LOW"


class LowHistoryRotations:
    def __init__(self):
        self.shapes=defaultdict(lambda:np.zeros(SEG,float))
        self.counts=defaultdict(int)
        self.accepted=0
        self.rejected=0

    def add_finished_game(self, game, presence):
        for p in game["players"]:
            pid=str(p.get("id"))
            if pid not in presence:
                continue
            minutes=float(p.get("min") or 0)
            if minutes<5:
                continue
            vec=np.asarray(presence[pid],float)
            if vec.shape!=(SEG,) or not np.isfinite(vec).all() or vec.min() < 0 or vec.sum()<=0:
                self.rejected+=1
                continue
            normalized=vec/vec.sum()
            key=(bool(p["start"]),bucket(minutes))
            self.shapes[key]+=normalized
            self.counts[key]+=1
            self.accepted+=1

    def prior(self, starting, target_minutes):
        target=float(target_minutes)
        if not np.isfinite(target) or target<=0 or target>MAX_TARGET_MIN:
            raise ValueError("NBA_V5_BAD_COLD_START_MINUTES")
        key=(bool(starting),bucket(target))
        n=self.counts[key]
        if n:
            observed=self.shapes[key]/n
        else:
            observed=np.full(SEG,1/SEG,float)
        # Prior shape is intentionally broad. Even when many historical
        # starters exist, five game equivalents of all-hour continuity
        # prevent missing first/last segments becoming impossible.
        weight=n/(n+20.0) if n>=MIN_ROLE_SAMPLES else 0.0
        distribution=weight*observed+(1-weight)*np.full(SEG,1/SEG,float)
        if not np.isclose(distribution.sum(),1.0):
            raise ValueError("NBA_V5_NON_NORMALIZED_COLD_START_SHAPE")
        # In the V5 simulator a two-minute stretch's court participation
        # represents 2.0 expected player minutes at share 1.0.
        share=distribution*target/2
        if share.max()>1:
            # Project onto [0,1] while conserving available target minutes
            # for plausible target<=38, using a fixed waterfilling loop.
            for _ in range(20):
                over=share>1
                if not over.any():break
                extra=float((share[over]-1).sum())
                share[over]=1
                free=~over
                if not free.any():break
                share[free]+=extra*(distribution[free]/max(distribution[free].sum(),1e-9))
        share=np.clip(share,0,1)
        return share,{"source":"LEARNED_PREVIOUS_FINISHED_TEAM_ROTATION",
                      "role_group":("STARTER" if starting else "BENCH")+"_"+bucket(target),
                      "group_player_game_samples":n,
                      "fallback_uniform":n<MIN_ROLE_SAMPLES,
                      "target_minutes":round(target,2),
                      "expected_minutes_from_shape":round(float(2*share.sum()),2),
                      "shadow_only":True}

    def audit(self):
        return {"accepted_player_game_rotations":self.accepted,
                "invalid_rotations":self.rejected,
                "group_player_game_samples":{str(k):n for k,n in self.counts.items()},
                "model_effect":"SHADOW_ONLY_NOT_PROMOTED"}

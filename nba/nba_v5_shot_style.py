"""NBA V5: source-grounded shot execution, NOT inferred Synergy play type.

ESPN play-by-play records shot descriptions (dunk, layup, floater, pull-up,
step-back, jump, etc.) and coordinates. Use these to model *how a shot is
executed at its already simulated zone*, not to claim that a possession was an
isolation, screen, pass, cut, or pick-and-roll.

Learned distributions are strictly historical: Replay.add calls add_game
after the prediction date, never before. Shrink player-by-zone style rates to
league-by-zone rates, with a minimum sample size and limited multipliers.
Neutralize the mean effect within each shot zone so this does not pretend
to create new shot attempts or add a second source of baseline shooting talent.

The feature is SHADOW ONLY until a paired V5 model trial with a later untouched
forward period shows improved numerical and probability calibration.
"""
from __future__ import annotations

from collections import defaultdict
import numpy as np

from nba.nba_v5_context import zone_of

STYLE_FAMILIES = ("rim_finish", "created_jumper", "floater_hook",
                  "driving_running", "other_jumper")
N_STYLE = len(STYLE_FAMILIES)
ZONES = 5
MIN_SHOTS = 30
PLAYER_PRIOR_ATTEMPTS = 36.0
LEAGUE_PRIOR_ATTEMPTS = 60.0
MAX_STYLE_MULT = 1.18


def family(label):
    t=(label or "other").lower().replace("-", "").replace(" ", "")
    if t in ("dunk","layup","tip","putback","alley"):
        return 0
    if t in ("pullup","stepback","fadeaway","turnaround"):
        return 1
    if t in ("floater","hook"):
        return 2
    if t in ("driving","running"):
        return 3
    return 4


class ShotStyleState:
    def __init__(self):
        self.player = defaultdict(lambda: np.zeros((ZONES,N_STYLE,2),float))
        self.league = np.zeros((ZONES,N_STYLE,2),float)
        self.games = 0
        self.eligible_events = 0
        self.zone_events = 0
        self.raw_families = np.zeros(N_STYLE,int)

    def add_game(self,pbp):
        if not pbp:
            return
        self.games += 1
        for ev in pbp.get("events",[]):
            try:
                period, left, kind, tid, pid, assister, points, x, y, label = ev[:10]
                if period not in (1,2,3,4) or kind not in ("S2","S3") or not pid:
                    continue
                self.eligible_events+=1
                z=zone_of(x,y,3 if kind=="S3" else 2)
                if z is None:
                    continue
                k=family(label)
                made=1.0 if int(points)>0 else 0.0
                self.player[str(pid)][z,k,0]+=1
                self.player[str(pid)][z,k,1]+=made
                self.league[z,k,0]+=1
                self.league[z,k,1]+=made
                self.raw_families[k]+=1
                self.zone_events+=1
            except (ValueError,TypeError,IndexError):
                continue

    def profile(self,player_id,league):
        """Return (Nzone x Nstyle probabilities, neutralized multipliers, audit).

        Insufficient player shot-coordinate history gives a neutral profile.
        A valid style model never invents a player-specific zero-game breakout.
        """
        source=self.player.get(str(player_id))
        neutral_prob=np.full((ZONES,N_STYLE),1/N_STYLE,float)
        neutral_mult=np.ones((ZONES,N_STYLE),float)
        if source is None or float(source[:,:,0].sum())<MIN_SHOTS:
            return neutral_prob,neutral_mult,{"valid":False,"shots":0 if source is None else int(source[:,:,0].sum())}
        probs=np.zeros((ZONES,N_STYLE),float)
        multipliers=np.ones((ZONES,N_STYLE),float)
        for z in range(ZONES):
            zone_total=float(self.league[z,:,0].sum())
            if zone_total < 60:
                probs[z]=neutral_prob[z]
                continue
            base_zone=float(league.p3 if z>=3 else league.p2)
            league_count=self.league[z,:,0]
            league_made=self.league[z,:,1]
            # League style frequency itself is smoothed; no 0-probability
            # families from a finite league sample.
            league_mix=(league_count+1.0)/(zone_total+N_STYLE)
            cnt=source[z,:,0]
            makes=source[z,:,1]
            own_n=float(cnt.sum())
            probs[z]=(cnt+PLAYER_PRIOR_ATTEMPTS*league_mix)/(own_n+PLAYER_PRIOR_ATTEMPTS)
            probs[z]/=probs[z].sum()
            if own_n < 10:
                continue
            # Player success is shrunk strongly toward observed league style
            # success, which itself is shrunk to overall zone shooting.
            league_accuracy=(league_made+LEAGUE_PRIOR_ATTEMPTS*base_zone)/(league_count+LEAGUE_PRIOR_ATTEMPTS)
            player_accuracy=(makes+PLAYER_PRIOR_ATTEMPTS*league_accuracy)/(cnt+PLAYER_PRIOR_ATTEMPTS)
            zone_accuracy=max(float(np.dot(probs[z],player_accuracy)),0.04)
            raw=np.clip(player_accuracy/zone_accuracy,1/MAX_STYLE_MULT,MAX_STYLE_MULT)
            # Enforce E[style multiplier | chosen shot zone] = 1 to stop
            # double-counting the existing V5 player-zone shooting model.
            centered=raw/max(float(np.dot(probs[z],raw)),1e-9)
            delta=centered-1.0
            t=1.0
            high=float(delta.max())
            low=float(delta.min())
            if high>0:
                t=min(t,(MAX_STYLE_MULT-1.0)/high)
            if low<0:
                t=min(t,(1.0-1.0/MAX_STYLE_MULT)/(-low))
            multipliers[z]=1.0+t*delta
        return probs,multipliers,{"valid":True,"shots":int(source[:,:,0].sum()),
                                  "zones_with_10plus_shots":int(np.sum(source[:,:,0].sum(axis=1)>=10))}

    def audit(self):
        return {"games":self.games,"raw_shot_events":self.eligible_events,
                "shot_events_with_coordinates":self.zone_events,
                "coordinate_coverage":round(self.zone_events/max(1,self.eligible_events),4),
                "players_with_observed_styles":len(self.player),
                "style_family_events":dict(zip(STYLE_FAMILIES,map(int,self.raw_families)))}

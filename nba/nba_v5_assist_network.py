"""Observed passer-to-scorer assist networks from previously completed NBA PBP.

This is NOT tracking data for all passes or potential assists. Only explicit
named assists on made baskets in a strictly reconstructed five-on-five game
are counted. All other passes and scoring attempts remain unobserved.

History is accumulated after a completed game, never before its forecast.
Paired champion-versus-shadow trial is required; this feature is OFF by default.
"""
from __future__ import annotations
from collections import Counter
import math
import numpy as np

CO_MINIMUM = 90.0
PASSER_MIN_ASSISTS = 12
RECEIVER_MIN_ASSISTED_MAKES = 8
SHRINK_ASSISTS = 12.0
MAX_LOG_MULTIPLIER = 0.26
STRENGTH = 0.65


class AssistNetworkState:
    def __init__(self):
        self.team_pairs = Counter()              # (team, passer, receiver)
        self.passer_counts = Counter()            # (team, passer)
        self.receiver_counts = Counter()          # (team, receiver)
        self.team_counts = Counter()              # team -> confirmed assists
        self.accepted_games = 0
        self.named_makes = 0
        self.assisted_makes = 0
        self.rejected_ambiguous = 0

    def add_valid_game(self, pb):
        """Only accept after strict independent PBP reconstruction passed.

        Reconstruct on-court identity again and never trust ESPN's event-team
        label on its own: previously observed errors may name the opposite
        team for a missed shot. No off-court or ambiguous actor is accepted.
        """
        teams=(str(pb["home"]),str(pb["away"]))
        on={t:list(map(str,pb["starters"][t])) for t in teams}
        if any(len(x)!=5 or len(set(x))!=5 for x in on.values()):
            raise ValueError("NBA_V5_ASSIST_NETWORK_UNVERIFIED_COURT")
        accepted=[]
        for event in pb["events"]:
            per,left,kind,tid,a,b,pts=event[:7]
            if int(per)>4:
                break
            a,b=str(a or ""),str(b or "")
            if kind=="SUB":
                tid=str(tid)
                if tid not in on or b not in on[tid] or a in on[tid]:
                    raise ValueError("NBA_V5_ASSIST_NETWORK_BAD_SUBSTITUTION")
                on[tid][on[tid].index(b)]=a
            elif kind in ("S2","S3") and int(pts)>0 and a:
                self.named_makes+=1
                if not b:
                    continue
                matches=[t for t in teams if a in on[t] and b in on[t] and a!=b]
                if len(matches)!=1:
                    self.rejected_ambiguous+=1
                    raise ValueError("NBA_V5_ASSIST_NETWORK_AMBIGUOUS_PAIR")
                accepted.append((matches[0],b,a))
        # Atomic update: if any error occurs, no partial game enters state.
        for tid,passer,receiver in accepted:
            self.team_pairs[(tid,passer,receiver)]+=1
            self.passer_counts[(tid,passer)]+=1
            self.receiver_counts[(tid,receiver)]+=1
            self.team_counts[tid]+=1
        self.accepted_games+=1
        self.assisted_makes+=len(accepted)
        return len(accepted)

    def for_roster(self, tid, ids, lineup_state):
        """Return bounded log multipliers (passer, scorer) for the same team.

        Baseline expected pair assists uses independently reconstructed
        co-court minutes × passer assists per on-court minute × the receiver's
        historical share of teammate assisted makes. Shrink to no effect and
        require meaningful real exposures; observational, not causal.
        """
        tid=str(tid)
        out=np.zeros((len(ids),len(ids)),dtype=float)
        eligible=0
        for i,pid in enumerate(ids):
            own=lineup_state.players.get((tid,str(pid)))
            if own is None or own[0]<=0 or self.passer_counts[(tid,str(pid))]<PASSER_MIN_ASSISTS:
                continue
            per_min=self.passer_counts[(tid,str(pid))]/own[0]
            for j,receiver in enumerate(ids):
                if i==j or self.receiver_counts[(tid,str(receiver))]<RECEIVER_MIN_ASSISTED_MAKES:
                    continue
                pair=lineup_state.pairs.get((tid,str(pid),str(receiver)))
                if pair is None or pair[0]<CO_MINIMUM:
                    continue
                team_total=self.team_counts[tid]
                if team_total<1:
                    continue
                receiver_share=self.receiver_counts[(tid,str(receiver))]/team_total
                expected=pair[0]*per_min*receiver_share
                if expected<1.0:
                    continue
                actual=self.team_pairs[(tid,str(pid),str(receiver))]
                # Finite pseudo-assist prior; means 0 observed isn't treated
                # as incontrovertible antipathy between the two players.
                raw=math.log((actual+SHRINK_ASSISTS)/(expected+SHRINK_ASSISTS))
                out[i,j]=float(np.clip(raw*STRENGTH,-MAX_LOG_MULTIPLIER,MAX_LOG_MULTIPLIER))
                eligible+=1
        return out,{"eligible_directed_assist_pairs":eligible,
                    "valid_historical_games":self.accepted_games,
                    "named_assisted_makes":self.assisted_makes,
                    "team_assists_observed":self.team_counts[tid],
                    "source":"VERIFIED_ON_COURT_NAMED_ASSISTS_ONLY",
                    "not_potential_assists":True,"observational_not_causal":True}

    def audit(self):
        return {"valid_historical_games":self.accepted_games,
                "named_makes":self.named_makes,
                "named_assisted_makes":self.assisted_makes,
                "unique_directed_pairs":len(self.team_pairs),
                "teams":len(self.team_counts),
                "ambiguity_rejections":self.rejected_ambiguous}

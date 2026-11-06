"""Verified free PBP missed-shot-zone -> named rebounder model.

This is rebound *result attribution* from named ESPN play-by-play events,
not SportVU rebound chances, positioning, contested status or box-outs.
A rebound is paired with a missed shot only when the on-court teams and
event times make that link unambiguous, and only from a strictly valid
five-man replay. Absent or ambiguous observations are excluded.

Train only after each game completes and compare a shadow model against the
unchanged V5 champion at original numeric projection thresholds.
"""
from __future__ import annotations

import math
from collections import Counter
import numpy as np
from nba.nba_v5_context import zone_of

SECONDS_PER_QUARTER=720.0
MAX_REBOUND_WAIT=10.0
MIN_PLAYER_REBOUNDS=15
MIN_TEAM_ZONE_REBOUNDS=25
PRIOR_REBOUNDS=15.0
LOG_LIMIT=0.23
STRENGTH=0.65
SIDES=("oreb","dreb")
ZONES=5


def seconds(period,left):
    return (int(period)-1)*SECONDS_PER_QUARTER+(SECONDS_PER_QUARTER-float(left))


class ReboundZoneState:
    def __init__(self):
        self.count=Counter()       # (team, player, offensive/defensive, miss_zone)
        self.player=Counter()      # (team, player, side)
        self.team_zone=Counter()   # (team, side, zone)
        self.team_total=Counter()  # (team, side)
        self.valid_games=0
        self.missed_shots_with_zone=0
        self.linked_named_rebounds=0
        self.mismatched_events=0

    def add_valid_game(self,pb):
        """Call only after independent fail-closed replay_game passed."""
        teams=(str(pb["home"]),str(pb["away"]))
        on={t:list(map(str,pb["starters"][t])) for t in teams}
        if any(len(ids)!=5 or len(set(ids))!=5 for ids in on.values()):
            raise ValueError("NBA_V5_REBOUND_ZONES_UNVERIFIED_COURT")
        pending=None
        hits=[]
        shot_count=0
        mismatched=0
        for event in pb["events"]:
            period,left,kind,team,a,b,pts=event[:7]
            if not 1<=int(period)<=4:
                continue
            when=seconds(period,left)
            a,b=str(a or ""),str(b or "")
            if kind=="SUB":
                team=str(team)
                if team not in on or b not in on[team] or a in on[team]:
                    raise ValueError("NBA_V5_REBOUND_ZONES_BAD_SUBSTITUTION")
                on[team][on[team].index(b)]=a
            elif kind in ("S2","S3"):
                pending=None
                if int(pts)>0 or not a:
                    continue
                zone=zone_of(event[7] if len(event)>7 else None,
                             event[8] if len(event)>8 else None,
                             3 if kind=="S3" else 2)
                matches=[t for t in teams if a in on[t]]
                if zone is None or len(matches)!=1:
                    continue
                shot_count+=1
                pending=(matches[0],zone,when,int(period))
            elif kind in ("OR","DR"):
                if pending is None:
                    continue
                shot_team,zone,shot_when,shot_period=pending
                pending=None
                delta=when-shot_when
                if not a or int(period)!=shot_period or not 0<=delta<=MAX_REBOUND_WAIT:
                    mismatched+=1
                    continue
                teams_of_rebounder=[t for t in teams if a in on[t]]
                expected=shot_team if kind=="OR" else (teams[1] if shot_team==teams[0] else teams[0])
                if len(teams_of_rebounder)!=1 or teams_of_rebounder[0]!=expected:
                    mismatched+=1
                    continue
                hits.append((expected,a,"oreb" if kind=="OR" else "dreb",zone))
            elif kind in ("FT","TO"):
                # A free-throw/turnover interrupts the prior field-goal miss.
                pending=None
        # Atomic on any event mismatch in court reconstruction; ambiguous
        # rebound links are counted as exclusions, not fabricated rebounds.
        for team,pid,side,zone in hits:
            self.count[(team,pid,side,zone)]+=1
            self.player[(team,pid,side)]+=1
            self.team_zone[(team,side,zone)]+=1
            self.team_total[(team,side)]+=1
        self.valid_games+=1
        self.missed_shots_with_zone+=shot_count
        self.linked_named_rebounds+=len(hits)
        self.mismatched_events+=mismatched
        return len(hits)

    def for_roster(self,tid,ids):
        """Bounded location-conditional rebounder weights for actual teammates."""
        tid=str(tid)
        result={side:np.zeros((len(ids),ZONES)) for side in SIDES}
        coverage=0
        for side in SIDES:
            total=self.team_total[(tid,side)]
            if total<100:
                continue
            for i,pid in enumerate(ids):
                player_n=self.player[(tid,str(pid),side)]
                if player_n<MIN_PLAYER_REBOUNDS:
                    continue
                for z in range(ZONES):
                    team_n=self.team_zone[(tid,side,z)]
                    if team_n<MIN_TEAM_ZONE_REBOUNDS:
                        continue
                    base=team_n/total
                    own=self.count[(tid,str(pid),side,z)]
                    shrunk=(own+PRIOR_REBOUNDS*base)/(player_n+PRIOR_REBOUNDS)
                    raw=math.log(max(shrunk,1e-6)/max(base,1e-6))
                    result[side][i,z]=float(np.clip(raw*STRENGTH,-LOG_LIMIT,LOG_LIMIT))
                    coverage+=1
        return result,{"covered_player_zone_sides":coverage,
                       "games_from_verified_pbp":self.valid_games,
                       "linked_named_rebounds":self.linked_named_rebounds,
                       "observed_miss_rebound_only":True,
                       "not_tracked_rebound_chances_or_positioning":True}

    def audit(self):
        return {"valid_lineup_games":self.valid_games,
                "missed_shots_with_known_zone":self.missed_shots_with_zone,
                "linked_named_rebounds":self.linked_named_rebounds,
                "excluded_ambiguous_or_delayed_rebounds":self.mismatched_events,
                "covered_teams":len({tid for tid,_, in self.team_total}),
                "source":"PAST_ESPN_MISSED_SHOT_COORDS_PLUS_NAMED_REBOUND"}

"""NBA V5 free-PBP opponent-style-conditioned coaching rotation research.

Each historical opponent's 3PA/FGA tendency is estimated ONLY using its
completed games strictly before the *historical matchup*. The responding
team's individual two-minute playing-time patterns come from validated ESPN
substitution traces. This is a testable opponent-profile / coaching
association, not true team defensive scheme, switching, or a lineup leak.

Nothing affects the champion until paired historical and untouched forward
evaluation passes. No sportsbook or licensed data.
"""
from __future__ import annotations

from collections import defaultdict
import datetime as dt
import numpy as np

SEGMENTS=24
MIN_OPP_PRIOR_GAMES=8
OPP_WINDOW=15
HIGH_THREES_SHARE=0.40  # one fixed, predeclared era-specific grouping
MIN_STYLE_GAMES=5
MIN_ALL_GAMES=16
PSEUDO_GAMES=10.0
CAP=0.14


def opponent_three_share(prior_team_games, as_of):
    """Prior opponent FGA/3PA mix; never read the target game's outcome."""
    cutoff=as_of if isinstance(as_of,dt.date) else dt.date.fromisoformat(str(as_of)[:10])
    games=[g for g in prior_team_games if
           (g["date"] if isinstance(g["date"],dt.date) else dt.date.fromisoformat(str(g["date"])[:10])) < cutoff][-OPP_WINDOW:]
    if len(games)<MIN_OPP_PRIOR_GAMES:
        return None
    attempts=sum(float(g["own"]["fga"]) for g in games)
    threes=sum(float(g["own"]["tpa"]) for g in games)
    if attempts<500 or not 0<=threes<=attempts:
        return None
    return float(threes/attempts)


class OpponentRotationState:
    def __init__(self):
        self.records=defaultdict(list)  # (team, player) -> completed-game (opponent style, 24-segment pres)
        self.valid_matchups=0
        self.total_player_game_patterns=0
        self.unavailable_opponent_profile=0

    def add_finished_game(self, game, presence, opponent_rates):
        """Only after the game was scored (Replay.add), and only strict PBP."""
        if not opponent_rates:
            self.unavailable_opponent_profile+=1
            return
        teams=(str(game["home"]["id"]),str(game["away"]["id"]))
        found=0
        for p in game["players"]:
            tid=str(p["team"])
            if tid not in teams:
                continue
            opp=teams[1] if tid==teams[0] else teams[0]
            value=opponent_rates.get(opp)
            if value is None or not .15<=value<=.75:
                continue
            vec=presence.get(str(p["id"]))
            if vec is None:
                continue
            v=np.asarray(vec,float)/120.0
            if v.shape!=(SEGMENTS,) or not np.isfinite(v).all() or (v<0).any() or (v>1.001).any() or v.sum()<0.3:
                continue
            self.records[(tid,str(p["id"]))].append((value,v))
            found+=1
        if found:
            self.valid_matchups+=1
            self.total_player_game_patterns+=found

    def for_roster(self, tid, ids, opponent_share, baseline):
        """Return matchup-adjusted relative 24-segment court shares (N,24).

        Opponent group training requires at least five *actual earlier*
        games in that group and sixteen earlier games overall per player.
        The group effect is shrunk to the player's all-opponent mean,
        bounded to 14%, and then applies to the existing base projection.
        """
        base=np.asarray(baseline,float)
        if base.shape!=(len(ids),SEGMENTS):
            raise ValueError("NBA_V5_MATCHUP_BAD_BASELINE_ROTATION")
        diag={"supported_players":0,"matched_prior_player_games":0,
              "opponent_three_share":opponent_share,
              "group":"HIGH" if opponent_share is not None and opponent_share>=HIGH_THREES_SHARE else "LOW" if opponent_share is not None else "UNKNOWN",
              "source":"PAST_ESPN_SUBSTITUTIONS_AND_OPPONENT_PREVIOUS_BOXES",
              "scheme_and_player_assignments_unknown":True,"observational_only":True}
        if opponent_share is None:
            return None,diag
        target=bool(opponent_share>=HIGH_THREES_SHARE)
        adjusted=base.copy()
        for i,pid in enumerate(ids):
            data=self.records.get((str(tid),str(pid)),[])
            if len(data)<MIN_ALL_GAMES:
                continue
            selected=[vec for val,vec in data if (val>=HIGH_THREES_SHARE)==target]
            if len(selected)<MIN_STYLE_GAMES or len(selected)==len(data):
                continue
            all_mean=np.mean([vec for _,vec in data],axis=0)
            sel_mean=np.mean(selected,axis=0)
            shrink=len(selected)/(len(selected)+PSEUDO_GAMES)
            ratio=(shrink*sel_mean+(1-shrink)*all_mean+0.02)/(all_mean+0.02)
            ratio=np.clip(ratio,1-CAP,1+CAP)
            adjusted[i]=np.clip(base[i]*ratio,0,1)
            diag["supported_players"]+=1
            diag["matched_prior_player_games"]+=len(selected)
        return (adjusted if diag["supported_players"] else None),diag

    def audit(self):
        return {"historical_matchups_with_usable_opponent_profile":self.valid_matchups,
                "observed_player_rotations_with_opponent_profile":self.total_player_game_patterns,
                "games_without_opponent_profile":self.unavailable_opponent_profile,
                "stored_player_team_histories":len(self.records),
                "style_threshold":HIGH_THREES_SHARE,
                "source":"FREE_VERIFIED_ESPN_PREVIOUS_BOXSCORES_AND_PBP_SUBSTITUTIONS"}

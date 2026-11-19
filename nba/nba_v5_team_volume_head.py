"""Frozen supervised NBA team possession-opportunity head (research only).

The live empirical projection independently resamples each player's prior box.
This structural alternative learns, from older completed team games, the NEXT
team game's shot/assist/rebound opportunity rate given BOTH offense history and
the opponent's defense history. It then conservatively bounds normalization
of the SAME simulated player boxes to those independent team opportunities.
No post-tip teammate lineup, player-stat forecasts or sportsbook inputs.
"""
from __future__ import annotations
import collections
import datetime as dt
from dataclasses import dataclass

import numpy as np

STATS = ("fga", "tpa", "fta", "ast", "reb")
WINDOWS = (5, 20)
RIDGE = 60.0
MIN_TRAIN_EXAMPLES = 450
MAX_TEAM_RATE_DEVIATION = 0.30
MAX_PLAYER_NORMALIZATION = 0.15


def _day(g):
    return dt.date.fromisoformat(g["date"][:10])


def _totals(g, side):
    ps = [p for p in g["players"] if p["side"] == side]
    return {k: float(sum(float(p[k]) for p in ps)) for k in STATS}


def completed_game_team_records(g):
    from nba.nba_v4_backtest import team_totals
    day = _day(g)
    a, b = (_totals(g,side) for side in ("home","away"))
    pa, pb = (float(team_totals(g,side)["poss"]) for side in ("home","away"))
    return (
        (str(g["home"]["id"]), {"date": day,"own": a,"opp": b,
                                "poss": pa,"opp_poss": pb}),
        (str(g["away"]["id"]), {"date": day,"own": b,"opp": a,
                                "poss": pb,"opp_poss": pa}),
    )


def _rate(hist, key, window, section, league):
    pool = hist[-window:]
    posskey = "poss" if section == "own" else "opp_poss"
    pseudo = 400. if window == 5 else 900.
    exp = sum(max(float(r[posskey]),1.) for r in pool)
    count = sum(float(r[section][key]) for r in pool)
    return (count + pseudo * league) / (exp + pseudo)


def _features(own_hist, opponent_hist, key, league):
    if len(own_hist) < 3 or len(opponent_hist) < 3:
        return None
    a5, a20 = [_rate(own_hist, key, w, "own", league) for w in WINDOWS]
    d5, d20 = [_rate(opponent_hist, key, w, "opp", league) for w in WINDOWS]
    relative = [a5/league-1., a20/league-1.,
                d5/league-1., d20/league-1.]
    return np.asarray([1.]+[float(np.clip(x,-1.,1.)) for x in relative],float)


@dataclass
class TeamVolumeHead:
    league_rate: dict
    coefficients: dict
    examples: dict
    training_cutoff: dt.date

    @classmethod
    def fit_completed(cls, games, cutoff):
        if isinstance(cutoff,str):
            cutoff=dt.date.fromisoformat(cutoff)
        before=sorted((g for g in games if _day(g)<cutoff),
                      key=lambda g:(_day(g),str(g["game_id"])))
        if not before:
            raise ValueError("NBA_TEAM_VOLUME_NO_TRAINING_GAMES")
        sums=collections.Counter()
        possessions=0.
        for g in before:
            for _,r in completed_game_team_records(g):
                possessions+=r["poss"]
                for k in STATS:
                    sums[k]+=r["own"][k]
        league={k:max(1e-6,sums[k]/max(possessions,1.)) for k in STATS}
        hist=collections.defaultdict(list)
        feat={k:[] for k in STATS}
        truth={k:[] for k in STATS}
        days=collections.defaultdict(list)
        for g in before:days[_day(g)].append(g)
        for day in sorted(days):
            # All examples are generated before any boxes from this date
            # can enter a future example's explanatory variables.
            for g in days[day]:
                hteam=str(g["home"]["id"]); ateam=str(g["away"]["id"])
                for tid,opp,rec in ((hteam,ateam,completed_game_team_records(g)[0][1]),
                                    (ateam,hteam,completed_game_team_records(g)[1][1])):
                    for k in STATS:
                        x=_features(hist[tid],hist[opp],k,league[k])
                        if x is None:continue
                        feat[k].append(x)
                        truth[k].append(rec["own"][k] / max(rec["poss"],1.) / league[k])
            for g in days[day]:
                for tid,rec in completed_game_team_records(g):
                    hist[tid].append(rec)
        coefs={}
        for k in STATS:
            if len(feat[k])<MIN_TRAIN_EXAMPLES:
                raise ValueError("NBA_TEAM_VOLUME_INSUFFICIENT_PRIOR_TEAM_EXAMPLES")
            X=np.vstack(feat[k]);y=np.asarray(truth[k],float)
            pen=np.diag([0.]+[RIDGE]*(X.shape[1]-1))
            beta=np.linalg.solve(X.T@X+pen,X.T@y)
            if not np.all(np.isfinite(beta)):
                raise ValueError("NBA_TEAM_VOLUME_COEFFICIENT_NOT_FINITE")
            coefs[k]=beta
        return cls(league,coefs,{k:len(feat[k]) for k in STATS},cutoff)

    def expected_team_counts(self, own_history, opponent_history, expected_possessions):
        if expected_possessions is None or expected_possessions<=0:
            return {}
        out={}
        for k in STATS:
            x=_features(own_history,opponent_history,k,self.league_rate[k])
            if x is None:continue
            predicted=float(x@self.coefficients[k])*self.league_rate[k]
            rate=float(np.clip(predicted,
                self.league_rate[k]*(1.-MAX_TEAM_RATE_DEVIATION),
                self.league_rate[k]*(1.+MAX_TEAM_RATE_DEVIATION)))
            out[k]=rate*expected_possessions
        return out


def team_correction_factors(expected, sampled, mean_roster_minutes):
    """Full team conservation only when >=95% of rotation minutes are modeled.

    Unlisted/unknown athletes are NEVER treated as zero-shot players; missing
    roster coverage attenuates the correction rather than awarding their
    attempts to the modeled athletes.
    """
    if not expected or mean_roster_minutes<=0:
        return {}
    coverage=float(np.clip((mean_roster_minutes/240.-.75)/.20,0.,1.))
    base={}
    for k in ("fga","fta","ast","reb"):
        current=float(np.asarray(sampled[k]).sum(axis=1).mean())
        if k not in expected or current<1e-6:
            base[k]=1.
            continue
        raw=float(expected[k])/current
        base[k]=1.+coverage*(float(np.clip(raw,1-MAX_PLAYER_NORMALIZATION,
                                         1+MAX_PLAYER_NORMALIZATION))-1.)
    # Prior expected 3PA volume changes three-pointer count without
    # pretending we know a player's shooting luck.
    if "tpa" in expected and "fga" in expected:
        baseline_tpa=sampled.get("_expected_previous_team_tpa")
        if baseline_tpa is not None and baseline_tpa>1e-6:
            raw=expected["tpa"]/baseline_tpa
            base["tpm"]=1.+coverage*(float(np.clip(raw,.85,1.15))-1.)
        else:
            base["tpm"]=base.get("fga",1.)
    else:
        base["tpm"]=base.get("fga",1.)
    base["fgm"]=base["fga"]
    base["ftm"]=base["fta"]
    base["pts"]=0.72*base["fga"]+0.20*base["fta"]+0.08*base["tpm"]
    return base

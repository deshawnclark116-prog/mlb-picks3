"""NBA independent player-game empirical forecasting kernel.

A structural alternative to V5's possession-by-possession generator:
predict individual *game totals* from dated, completed player boxes,
within independent current-game minutes and shared pace scenarios.
Every stat for a player is resampled from the SAME past game, preserving
the observed player-level PTS/3PM/AST/REB relationships. No V3/V4
statistical projections enter this model.

This challenger intentionally does not claim full possession conservation:
V5's event simulator remains a separate baseline. The paired forward
test determines whether game-level empirical prediction is stronger.
"""
from __future__ import annotations

import datetime as dt
import numpy as np

MARKETS = {
    "pts": "pts", "reb": "reb", "ast": "ast", "tpm": "tpm",
    "stl": "stl", "blk": "blk", "tov": "tov",
}
OTHER = ("fga", "fgm", "fta", "ftm")
MAX_MINUTES = 44.0
TEAM_MINUTES = 240.0


def _recent_minute_prior(history, expects_start):
    h = history[-20:]
    def m(n):
        return float(np.mean([float(x["min"]) for x in h[-n:]]))
    projected = 0.50 * m(3) + 0.32 * m(8) + 0.18 * m(20)
    started = np.mean([bool(x["start"]) for x in h[-5:]])
    projected += 2.0 * (float(expects_start) - float(started))
    observed = np.asarray([x["min"] for x in h[-10:]], float)
    deviation = float(np.clip(observed.std(ddof=1) if len(observed) > 1 else 6., 2.5, 10.))
    return float(np.clip(projected, 3., 40.)), deviation


def _sample_index(rng, history, starter, n_worlds):
    h = history[-24:]
    n = len(h)
    weights = np.array([0.5 ** ((n - 1 - i) / 9.) for i in range(n)], float)
    # Coach's earlier start/bench choices provide the pregame role prior.
    # A mismatching historical role is possible but less representative.
    role = np.asarray([bool(x["start"]) for x in h])
    weights *= np.where(role == bool(starter), 1.4, 0.7)
    weights /= weights.sum()
    return h, rng.choice(n, size=n_worlds, p=weights)


def _round_samples(value, rng):
    # Stochastic rounding retains the correct expected conditional total,
    # instead of always flooring boosted/reduced old box-score counts.
    return np.floor(np.maximum(0., value) + rng.random(len(value)))


def simulate_empirical_game(home, away, history, date, *, worlds, seed,
                            expected_pace=None, historic_league_pace=None,
                            three_attempts_model=False):
    """Return V5-compatible game arrays from DIRECT pregame player-box priors.

    All forecasts are conditional on dates < target date, never on an
    outcome from today's match. Team minutes can be BELOW 240 when roster
    evidence is insufficient, rather than granting unknown minutes to
    incorrectly modeled high-usage teammates.
    """
    if worlds < 1:
        raise ValueError("WORLD_COUNT_MUST_BE_POSITIVE")
    if not isinstance(date, dt.date):
        raise ValueError("MATCHUP_DATE_REQUIRED")
    rng = np.random.default_rng(int(seed) + 981123)
    teams = (home, away)
    # Game speed is COMMON across the opponents; never infer that a single
    # player has a separate game-level possession total.
    if expected_pace and historic_league_pace and historic_league_pace > 0:
        prior_speed = float(np.clip(expected_pace / historic_league_pace, .84, 1.16))
    else:
        prior_speed = 1.0
    speed = np.clip(rng.lognormal(-.5 * .055 ** 2, .055, worlds) * prior_speed, .76, 1.30)
    outputs = []
    avail = []
    for team_index, team in enumerate(teams):
        n = len(team.ids)
        mins = np.zeros((worlds, n))
        if (getattr(team, "avail_corr", None) is not None and
                np.any((np.asarray(team.p_play) > 0.) & (np.asarray(team.p_play) < 1.))):
            from nba.nba_v5_availability import copula_availability
            playable = copula_availability(rng, np.asarray(team.p_play),
                                          team.avail_corr, worlds)
        else:
            playable = rng.random((worlds, n)) < np.asarray(team.p_play)[None, :]
        histories = []
        for j, pid in enumerate(team.ids):
            h = [p for p in history[pid] if p["date"] < date and p["min"] > 0][-24:]
            histories.append(h)
            if not h:
                playable[:, j] = False
                continue
            expected, sd = _recent_minute_prior(h, team.starter[j])
            if len(h) < 3:
                # Still reserve genuine one/two-game teammates' minutes:
                # lack of a deep NBA sample must not award their playing
                # time to star scorers. Their low-confidence stats are not
                # eligible for featured ranking.
                expected = (len(h) * expected + 5. * 15.) / (len(h) + 5.)
                sd = max(sd, 10.)
            if getattr(team, "return_mult", None) is not None:
                expected *= float(team.return_mult[j])
            if bool(team.starter[j]) and getattr(team, "start_mult", 1.) != 1.:
                expected *= float(team.start_mult)
            vals = np.clip(rng.normal(expected, sd, worlds), 0., MAX_MINUTES)
            if getattr(team, "minutes_cap", None) is not None:
                vals = np.minimum(vals, float(team.minutes_cap[j]))
            mins[:, j] = vals
        mins *= playable
        # Do not allocate more than a regulation team's 240 minutes.
        # Unknown player minutes remain unallocated; this avoids V5's
        # former habit of overcrediting an incomplete known roster.
        factor = np.minimum(1., TEAM_MINUTES / np.maximum(1., mins.sum(axis=1)))
        mins *= factor[:, None]
        stats = {key: np.zeros((worlds, n), float)
                 for key in (*MARKETS.keys(), *OTHER)}
        for j, pid in enumerate(team.ids):
            h = histories[j]
            if not h:
                continue
            pool, draws = _sample_index(rng, h, team.starter[j], worlds)
            past_min = np.asarray([float(p["min"]) for p in pool])[draws]
            multiplier = np.clip(mins[:, j] / np.maximum(past_min, 1.0) * speed, 0., 3.)
            for key in stats:
                prior = np.asarray([float(p[key]) for p in pool])[draws]
                stats[key][:, j] = _round_samples(prior * multiplier, rng)
            # Keep the player-level made-three subset physically valid.
            stats["fgm"][:, j] = np.maximum(stats["fgm"][:, j], stats["tpm"][:, j])
            stats["fga"][:, j] = np.maximum(stats["fga"][:, j], stats["fgm"][:, j])
            stats["pts"][:, j] = np.maximum(stats["pts"][:, j], 3. * stats["tpm"][:, j])
            if three_attempts_model:
                # Shadow-only alternative, not a new production switch. Predict
                # opportunities (3PA) from the SAME past sampled player game,
                # then independently model accuracy with a shrunk 3P skill.
                # The original main RNG is untouched by this branch, so other
                # players' game histories retain their comparable random draws.
                if any("tpa" not in p for p in pool):
                    raise ValueError("NBA_EMPIRICAL_3PA_RESEARCH_REQUIRES_REAL_3PA_HISTORY")
                rr = np.random.default_rng(int(seed)+991721+104729*team_index+13007*j)
                old_tpa = np.asarray([float(p["tpa"]) for p in pool])[draws]
                attempts = np.floor(np.maximum(0., old_tpa*multiplier)
                                    +rr.random(worlds)).astype(int)
                attempts = np.minimum(attempts,stats["fga"][:,j].astype(int))
                total_tpa=sum(float(p["tpa"]) for p in pool)
                total_tpm=sum(float(p["tpm"]) for p in pool)
                # Precommitted no-lookahead priors, NOT fit to evaluation games.
                ability=np.clip((total_tpm+50.0*.36)/(total_tpa+50.0),.01,.99)
                accuracy=rr.beta(ability*30.,(1.-ability)*30.,worlds)
                revised=rr.binomial(attempts,accuracy).astype(float)
                stats["tpm"][:,j]=revised
                stats["fgm"][:,j]=np.maximum(stats["fgm"][:,j],revised)
                stats["fga"][:,j]=np.maximum(stats["fga"][:,j],stats["fgm"][:,j])
                stats["pts"][:,j]=np.maximum(stats["pts"][:,j],3.*revised)
        stats["min"] = mins
        outputs.append(stats)
        avail.append(playable)
    score = np.column_stack((outputs[0]["pts"].sum(axis=1),
                             outputs[1]["pts"].sum(axis=1)))
    # The empirical head forecasts game totals, not exact substitution
    # sequences; do not manufacture first/last five observations.
    # These fields retain the V5 return shape without fictitious starter
    # certainty. Published p_start/p_close are explicitly nullable.
    return {"home": outputs[0], "away": outputs[1],
            "score": score, "avail": avail,
            "first5": (None, None),
            "close5": (None, None),
            "close_mask": np.zeros(worlds, bool),
            "empirical_head": True,
            "independent_of_v3_v4_forecasts": True,
            "world_kind": ("RESEARCH_THREE_ATTEMPTS_SHRUNK_ACCURACY"
                           if three_attempts_model else "JOINT_PLAYER_GAME_HISTORY_WITH_SHARED_PACE"),
            "minutes_capped_at_240_per_team": True}

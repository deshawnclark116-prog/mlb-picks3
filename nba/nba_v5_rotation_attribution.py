"""Locate NBA V5's real minutes and shot errors, split by *pretip* roster coverage.

Reads ONLY frozen original last-before-tip archives and the separately graded
completed game, never substitutes final-game information in a forecast.
Coverage strata use dated prior-team rotation data frozen at prediction time.
Game-level omitted minutes from completed boxes are report context, not a
model input. Both high/low coverage cohorts retain every eligible player.
"""
from __future__ import annotations

import argparse
import datetime as dt
import gzip
import json
import math
from collections import defaultdict
from pathlib import Path
from zoneinfo import ZoneInfo

CORE=("points","rebounds","assists","three_pointers_made")
ARMS=("v4_only","v5_only","blend")
ET=ZoneInfo("America/New_York")


def bucket(coverage):
    if coverage is None:
        return "UNOBSERVED_PRIOR_COVERAGE"
    if not math.isfinite(float(coverage)) or not 0 <= float(coverage) <= 1:
        raise ValueError("NBA_V5_INVALID_PRETIP_COVERAGE_FRACTION")
    if coverage < .75:
        return "LOW_UNDER_75PCT"
    if coverage < .90:
        return "PARTIAL_75_TO_90PCT"
    return "HIGH_AT_LEAST_90PCT"



def _timestamp(value):
    x=dt.datetime.fromisoformat(str(value).replace("Z","+00:00"))
    if x.tzinfo is None:
        raise ValueError("NBA_V5_RESEARCH_SOURCE_NAIVE_CLOCK")
    return x.astimezone(ET)


def load_past_team_games(paths):
    """Index actual final box games by club and *Eastern game day*.

    A future final in the current file cannot enter a historical roster
    reconstructed for an earlier target game's forecast. Same-day games
    are also excluded, even if nominally earlier, to prevent partial-final
    status ambiguity and mirror V5's previous-date training cutoff.
    """
    result=defaultdict(list)
    seen=set()
    for path in paths:
        opener=gzip.open if str(path).endswith(".gz") else open
        with opener(path,"rt",encoding="utf-8") as fh:
            for line in fh:
                if not line.strip():continue
                g=json.loads(line)
                gid=str(g["game_id"])
                if gid in seen:
                    raise ValueError("NBA_V5_RESEARCH_DUPLICATE_HISTORY_GAME")
                seen.add(gid)
                day=_timestamp(g["date"]).date()
                for side in ("home","away"):
                    team=str(g[side]["id"])
                    minutes={}
                    for p in g.get("players",[]):
                        if str(p.get("side"))!=side or str(p.get("team"))!=team:
                            continue
                        minute=float(p.get("min") or 0)
                        if 0 < minute <= 53:
                            pid=str(p["id"])
                            if pid in minutes:
                                raise ValueError("NBA_V5_RESEARCH_DUPLICATE_HISTORY_PLAYER")
                            minutes[pid]=minute
                    if minutes:
                        result[team].append((day,gid,minutes))
    for tid,items in result.items():
        items.sort(key=lambda x:(x[0],x[1]))
    return result


def reconstruct_prior_rotation(game,historical):
    """Prior-only coverage *reconstruction*, never actual frozen evidence."""
    day=_timestamp(game["tipoff_utc"]).date()
    output={}
    for side in ("home","away"):
        tid=str(game[side+"_id"])
        previous=[x for x in historical.get(tid,[]) if x[0]<day][-3:]
        total=defaultdict(float)
        for date,gid,minutes in previous:
            for pid,minute in minutes.items():
                total[pid]+=minute
        modeled={str(r["player_id"]) for r in game.get("rows",[])
                 if str(r.get("team_id"))==tid and
                    str(r.get("model_version","")).startswith("nba-v5-") and
                    r.get("mean_basis")=="CONDITIONAL_ON_PLAYING"}
        observed=sum(total.values())
        represented=sum(v for pid,v in total.items() if pid in modeled)
        if observed and represented>observed+1e-6:
            raise ValueError("NBA_V5_RECONSTRUCTED_MINUTES_IMPOSSIBLE")
        cov=round(represented/observed,4) if (len(previous)>=2 and observed>=200) else None
        output[side]={
            "represented_fraction":cov,
            "warning":("NO_ELIGIBLE_PRIOR_ROTATION" if cov is None
                       else "MATERIAL_PRIOR_ROTATION_UNREPRESENTED" if cov<.75
                       else "NORMAL_OR_PARTIAL_RECONSTRUCTED_COVERAGE"),
            "past_games_observed":len(previous),
            "past_minutes_total":round(observed,2),
            "represented_prior_minutes":round(represented,2),
            "missing_from_fixture_prior_minutes":None,
            "missing_from_model_prior_minutes":round(observed-represented,2),
            "coverage_source":"RECONSTRUCTED_PAST_ONLY_ET_GAMEDAYS_NOT_FROZEN",
            "source_note":"Uses only final games with Eastern calendar date strictly before target game. Later final data never enters the reconstructed past rotation.",
        }
    return output


def _archived(path):
    with gzip.open(path,"rt",encoding="utf-8") as f:
        data=json.load(f)
    if len(data.get("games",[]))!=1:
        raise ValueError("NBA_V5_ROTATION_ARCHIVE_NOT_SINGLE_GAME")
    game=data["games"][0]
    if str(game["game_id"])!=path.name.split(".")[0]:
        raise ValueError("NBA_V5_ROTATION_ARCHIVE_GAME_ID_MISMATCH")
    if game["forecast_at_utc"]>=game["tipoff_utc"]:
        raise ValueError("NBA_V5_ROTATION_ARCHIVE_NOT_PRETIP")
    return game


def _mean(x):
    return round(sum(x)/len(x),4) if x else None


def summarize(events):
    minutes=[r for r in events if r["market"]=="points"]
    played=[r for r in minutes if r["played"]]
    mark={m:[r for r in events if r["market"]==m and r["played"]] for m in CORE}
    out={
        "games":len({r["game_id"] for r in events}),
        "modeled_players_with_points_rows":len(minutes),
        "played_players":len(played),
        "DNP_players":len(minutes)-len(played),
        "minute_MAE":_mean([abs(r["forecast_minutes"]-r["actual_minutes"])
                             for r in played]),
        "minute_signed_bias":_mean([r["forecast_minutes"]-r["actual_minutes"]
                                    for r in played]),
        "predicted_40plus_players":sum(r["forecast_minutes"]>=40 for r in played),
        "predicted_40plus_actual_under_30":sum(r["forecast_minutes"]>=40
                                                and r["actual_minutes"]<30
                                                for r in played),
        "player_minutes_off_by_6plus":sum(abs(r["forecast_minutes"]-r["actual_minutes"])>=6
                                          for r in played),
        "mean_active_probability_including_DNP":_mean([r["p_active"] for r in minutes]),
        "actual_play_fraction":_mean([int(r["played"]) for r in minutes]),
        "markets":{},
    }
    for m,rows in mark.items():
        comparable=[r for r in rows if r["component_means"] is not None]
        out["markets"][m]={
            "n_all_played":len(rows),
            "n_three_way_component_comparable":len(comparable),
            "MAE":{arm:_mean([abs(r["component_means"][arm]-r["actual"])
                                   for r in comparable]) for arm in ARMS},
            "mean_signed_error":{arm:_mean([r["component_means"][arm]-r["actual"]
                                        for r in comparable]) for arm in ARMS},
        }
    return out


def build(archive_last, grades_last, omission_path=None, historical_games=None):
    historic=load_past_team_games(historical_games or [])
    omit={}
    if omission_path:
        doc=json.loads(Path(omission_path).read_text())
        if doc.get("schema")!="NBA_V5_POSTGAME_ROSTER_OMISSION_AUDIT_V1":
            raise ValueError("NBA_V5_ROTATION_OMISSION_REPORT_BAD_SCHEMA")
        omit={str(g["game_id"]):g for g in doc.get("games",[])}
    groups=defaultdict(list)
    by_status=defaultdict(list)
    games_out=[]
    all_events=[]
    for path in sorted(Path(grades_last).glob("*.json")):
        grade=json.loads(path.read_text())
        if grade.get("kind")!="last": continue
        gid=str(grade["game_id"])
        if gid!=path.stem:
            raise ValueError("NBA_V5_ROTATION_GRADE_ID_MISMATCH")
        frozen=Path(archive_last)/(gid+".json.gz")
        if not frozen.exists():
            raise ValueError("NBA_V5_ROTATION_FROZEN_ORIGINAL_MISSING")
        game=_archived(frozen)
        if game["forecast_at_utc"]!=grade["forecast_at_utc"]:
            raise ValueError("NBA_V5_ROTATION_GRADE_FORECAST_CLOCK_CHANGED")
        coverage_by_side=game.get("roster_integrity_audit") or {}
        # Older frozen first-seen games predate the coverage instrument.
        # Use strictly older *calendar-day* finished games as an explicitly
        # labeled retrospective audit; never assert the reconstructed value
        # was itself observed in the original pretip archive.
        if historic:
            inferred=reconstruct_prior_rotation(game,historic)
            coverage_by_side={side:(
                coverage_by_side.get(side)
                if (coverage_by_side.get(side) or {}).get("represented_fraction") is not None
                else inferred[side])
                for side in ("home","away")}
        source_teams={"home":str(game["home_id"]),"away":str(game["away_id"])}
        mapped={}
        for r in game.get("rows",[]):
            key=(str(r["player_id"]),str(r["market"]))
            if key in mapped:
                raise ValueError("NBA_V5_ROTATION_DUPLICATE_FROZEN_EVENT")
            mapped[key]=r
        graded=set()
        by_side=defaultdict(list)
        for r in grade.get("rows",[]):
            if r.get("market") not in CORE: continue
            key=(str(r["player_id"]),str(r["market"]))
            if key in graded:
                raise ValueError("NBA_V5_ROTATION_DUPLICATE_GRADE_EVENT")
            graded.add(key)
            before=mapped.get(key)
            if before is None:
                raise ValueError("NBA_V5_ROTATION_EVENT_NOT_IN_ORIGINAL")
            tid=str(before["team_id"])
            side=next((s for s,t in source_teams.items() if t==tid),None)
            if side is None:
                raise ValueError("NBA_V5_ROTATION_PLAYER_TEAM_MISMATCH")
            evidence=coverage_by_side.get(side) or {}
            cov=evidence.get("represented_fraction")
            label=bucket(cov)
            played=bool(r.get("played"))
            actual=(float(r["actual"]) if played else None)
            min_forecast=float(r["minutes_forecast"])
            min_actual=(float(r["minutes_actual"]) if played else None)
            if (played and (actual is None or min_actual is None)
                or not math.isfinite(min_forecast)
                or min_forecast < 0 or min_forecast > 70
                or played and min_actual < 0):
                raise ValueError("NBA_V5_ROTATION_BAD_MINUTES")
            comp=before.get("blend")
            means=(None if not isinstance(comp,dict) or comp.get("weights")!=[.5,.5]
                   else {"blend":float(before["mean"]),
                         "v4_only":float(comp["v4_model_mean"]),
                         "v5_only":float(comp["v5_simulation_mean"])})
            if abs(float(before["mean"])-float(r["projection"]))>.00011:
                raise ValueError("NBA_V5_ROTATION_ORIGINAL_PROJECTION_MISMATCH")
            e={"game_id":gid,"side":side,"market":r["market"],
               "player_id":key[0],"coverage":cov,"bucket":label,
               "played":played,"actual":actual,"forecast_minutes":min_forecast,
               "actual_minutes":min_actual,
               "p_active":float(before.get("p_active") or 0),
               "original_reported_status":str(before.get("reported_status") or "UNSPECIFIED"),
               "original_availability_source":str(before.get("availability_source") or "NO_PROVIDER"),
               "component_means":means}
            all_events.append(e)
            groups[label].append(e)
            by_status[e["original_reported_status"]].append(e)
            by_side[side].append(e)
        record={"game_id":gid,"away":game["away"],"home":game["home"],"teams":{}}
        for side in ("home","away"):
            prior=coverage_by_side.get(side) or {}
            g=by_side.get(side,[])
            outcome=omit.get(gid) or {}
            missing=outcome.get("missing_minutes_by_side",{})
            record["teams"][side]={
                "team_id":source_teams[side],
                "prior_rotation_coverage":prior.get("represented_fraction"),
                "prior_coverage_source":prior.get("coverage_source","FROZEN_PRETIP_AUDIT"),
                "prior_games_observed":prior.get("past_games_observed"),
                "prior_coverage_warning":prior.get("warning"),
                "prior_missing_from_fixture_minutes":prior.get("missing_from_fixture_prior_minutes"),
                "prior_missing_from_model_minutes":prior.get("missing_from_model_prior_minutes"),
                "postgame_missing_actual_player_minutes":
                    missing.get(side) if outcome else None,
                "played_points_player_minute_MAE":summarize(g)["minute_MAE"] if g else None,
                "played_points_player_minute_bias":summarize(g)["minute_signed_bias"] if g else None,
                "played_points_players_count":summarize(g)["played_players"] if g else 0,
            }
        games_out.append(record)
    return {
        "schema":"NBA_V5_PRETIP_ROTATION_VS_FINAL_ROOT_CAUSE_V1",
        "scope":"original frozen V5 pretip player means and independent final actuals",
        "no_filled_missing_values_or_hindsight_roster":True,
        "retrospective_past_only_reconstruction_used":bool(historic),
        "reconstructed_coverage_not_original_pretip_receipt":True,
        "all_markets_and_players_included_not_frontend_selected":True,
        "games":len(games_out),
        "events":len(all_events),
        "overall":summarize(all_events),
        "by_frozen_pretip_roster_coverage":{
            k:summarize(v) for k,v in sorted(groups.items())},
        "by_original_reported_availability_status":{
            k:summarize(v) for k,v in sorted(by_status.items())},
        "per_game_team_audit":games_out,
        "warning":"Historical roster coverage is an ex-ante quality proxy; missing prior players may genuinely be OUT. Correlation is not causation.",
        "promoted":False,
    }


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--archive-last",required=True)
    p.add_argument("--grades-last",required=True)
    p.add_argument("--omissions",default=None)
    p.add_argument("--historical-games",action="append",default=[],help="Completed box games; only days strictly before each forecast game are used to reconstruct older missing coverage audits")
    p.add_argument("--out",required=True)
    a=p.parse_args()
    result=build(a.archive_last,a.grades_last,a.omissions,a.historical_games)
    out=Path(a.out)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n")
    print("NBA_V5_ROTATION_ERROR_ATTRIBUTION",json.dumps({
        "games":result["games"],"events":result["events"],
        "overall":result["overall"],
        "by_frozen_pretip_roster_coverage":result["by_frozen_pretip_roster_coverage"],
        "by_original_reported_availability_status":result["by_original_reported_availability_status"],
        "promoted":False,
    },sort_keys=True))


if __name__=="__main__":
    main()

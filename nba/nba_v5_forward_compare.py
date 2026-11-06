"""NBA V5: true forward paired evaluation of frozen pretip challenger forecasts.

Compare exactly the champion's ORIGINAL whole-number projection and the
original challenger CDF. Never use the challenger's easier rounded threshold.
Grade all player-stat pairs (including non-featured rows and DNP), not a
hand-picked subset. Historical hindsight rosters or refreshed predictions
cannot replace either first-seen archive.

No automatic model promotion. This is a measurement and data-integrity layer.
"""
from __future__ import annotations
import argparse
import datetime as dt
import gzip
import json
from pathlib import Path

from nba.nba_v5_rank import whole, reach_prob
from nba.nba_v5_role_trial_score import _score_group

MARKETS={"points","rebounds","assists","three_pointers_made","steals","blocks","turnovers"}
MIN_PREGAME_MINUTES=15


def _doc(path):
    with gzip.open(path,"rt") as f:
        return json.load(f)


def _utc(value):
    t=dt.datetime.fromisoformat(str(value).replace("Z","+00:00"))
    if t.tzinfo is None:
        raise ValueError("Nba forecast clock lacks timezone")
    return t.astimezone(dt.timezone.utc)


def _valid(row):
    return (str(row.get("model_version","")).startswith("nba-v5-") and
            row.get("mean_basis")=="CONDITIONAL_ON_PLAYING" and
            row.get("market") in MARKETS and
            row.get("cdf_lattice",{}).get("cdf") is not None)


def _p(row,target):
    p_active=float(row["p_active"])
    if not 0<=p_active<=1:
        raise ValueError("Invalid preserved P(active)")
    cdf=row["cdf_lattice"]["cdf"]
    if not cdf or not all(0<=float(x)<=1 for x in cdf):
        raise ValueError("Invalid preserved CDF")
    return max(0.0,min(1.0,reach_prob(cdf,target)*p_active))


def compare(champion_archive:Path,challenger_archive:Path,grade_dir:Path,
            *,max_gap_minutes=45):
    chfiles={p.stem.split(".")[0]:p for p in (champion_archive/"first").glob("*.json.gz")}
    ca_files={p.stem.split(".")[0]:p for p in (challenger_archive/"first").glob("*.json.gz")}
    matched=sorted(chfiles.keys() & ca_files.keys())
    records=[]
    excluded={}
    paired={}
    for gid in matched:
        gradepath=grade_dir/"first"/f"{gid}.json"
        if not gradepath.exists():
            continue
        try:
            ch=_doc(chfiles[gid])["games"][0]
            ca=_doc(ca_files[gid])["games"][0]
            grade=json.loads(gradepath.read_text())
            tip=_utc(ch["tipoff_utc"])
            if (_utc(ca["tipoff_utc"])!=tip or
                str(ch["game_id"])!=str(ca["game_id"]) or
                str(grade["game_id"])!=gid):
                raise ValueError("Different games or tipoff in paired archives")
            th,tc=_utc(ch["forecast_at_utc"]),_utc(ca["forecast_at_utc"])
            if (th>tip-dt.timedelta(minutes=MIN_PREGAME_MINUTES) or
                tc>tip-dt.timedelta(minutes=MIN_PREGAME_MINUTES) or
                abs((th-tc).total_seconds())>max_gap_minutes*60):
                raise ValueError("Missing genuinely comparable pretip information")
            crows={(str(r["player_id"]),r["market"]):r for r in ch["rows"] if _valid(r)}
            arows={(str(r["player_id"]),r["market"]):r for r in ca["rows"] if _valid(r)}
            actual={(str(r["player_id"]),r["market"]):r for r in grade["rows"]}
            if not crows or not arows:
                raise ValueError("Missing full model distributions")
            for key,r in crows.items():
                t=arows.get(key)
                outcome=actual.get(key)
                if t is None or outcome is None:
                    continue
                player,market=key
                played=bool(outcome["played"])
                number=whole(float(r["mean"]))
                if number<1:
                    continue
                actual_stat=outcome.get("actual")
                if played and actual_stat is None:
                    raise ValueError("Played record is missing a final stat")
                p0,p1=_p(r,number),_p(t,number)
                hit=float(played and float(actual_stat)>=number)
                record={"game_id":gid,"player_id":player,"market":market,
                        "original_whole_projection":number,
                        "actual":actual_stat,"played":played,
                        "champion_prob_including_dnp":round(p0,5),
                        "challenger_prob_including_dnp":round(p1,5),
                        "hit":hit,"champion_mean":r["mean"],
                        "challenger_mean":t["mean"],
                        "champion_brier":round((p0-hit)**2,6),
                        "challenger_brier":round((p1-hit)**2,6),
                        "feature_flags":ca.get("simulation_pieces_on",{})}
                records.append(record)
                paired.setdefault(f"{market}|unconditional_brier",[]).append((gid,(p0-hit)**2,(p1-hit)**2))
                paired.setdefault("all_stats|unconditional_brier",[]).append((gid,(p0-hit)**2,(p1-hit)**2))
                if played:
                    paired.setdefault(f"{market}|mae",[]).append((
                      gid,abs(float(r["mean"])-float(actual_stat)),
                      abs(float(t["mean"])-float(actual_stat))))
        except (OSError,KeyError,TypeError,ValueError,json.JSONDecodeError) as e:
            excluded[gid]=str(e)[:160]
    return {
        "schema":"NBA_V5_FROZEN_FIRSTSEEN_CHALLENGER_COMPARISON_V1",
        "model_promotion_allowed":False,
        "comparison_scope":"Frozen original NBA V5 player/stat forecasts at the CHAMPION exact rounded number",
        "injuries_and_dnp_included":True,
        "nonfeatured_predictions_included":True,
        "matched_archived_games":len(matched),
        "graded_paired_games":len(set(r["game_id"] for r in records)),
        "joined_original_player_stat_events":len(records),
        "excluded_games":excluded,
        "metrics":{name:_score_group(vals,n_boot=400,seed=42)
                   for name,vals in sorted(paired.items())},
        "per_original_projection":records,
        "evidence_gate":"Needs sufficiently many untouched forward games, coverage and prospective calibration before manual promotion",
    }


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--champion-archive",required=True)
    p.add_argument("--challenger-archive",required=True)
    p.add_argument("--grades",required=True)
    p.add_argument("--out",required=True)
    a=p.parse_args()
    report=compare(Path(a.champion_archive),Path(a.challenger_archive),Path(a.grades))
    Path(a.out).parent.mkdir(parents=True,exist_ok=True)
    Path(a.out).write_text(json.dumps(report,indent=2)+"\n")
    print("NBA_V5_FROZEN_FORWARD_COMPARISON",json.dumps({
        "paired_games":report["graded_paired_games"],
        "paired_events":report["joined_original_player_stat_events"],
        "excluded_games":report["excluded_games"],
        "promotion_allowed":False}))
    for k,v in report["metrics"].items():
        print("PAIRED",k,v)


if __name__=="__main__":
    main()

"""Same original-threshold top pick selection for team-level opportunity challenger."""
from collections import defaultdict

from nba.nba_v5_learned_opportunity_head_score import evaluate_native
from nba.nba_v5_rank import MEANINGFUL_MIN, whole
from nba.nba_v5_role_trial_score import _score_group

MARKETS=("points","rebounds","assists","three_pointers_made","steals","blocks")


def frozen_top_cards(incumbent,candidate):
    base={(str(r["game"]),str(r["player"])):r for r in incumbent}
    alt={(str(r["game"]),str(r["player"])):r for r in candidate}
    if base.keys()!=alt.keys():
        raise ValueError("NBA_TEAM_VOLUME_NOT_SAME_GAME_PLAYER_COHORT")
    by_game=defaultdict(list)
    for (game,player),row in base.items():
        other=alt[(game,player)]
        for m in MARKETS:
            a,b=row[m],other[m]
            if a["actual"]!=b["actual"]:
                raise ValueError("NBA_TEAM_VOLUME_NOT_SAME_ACTUAL")
            threshold=whole(float(a["mean"]))
            if threshold<MEANINGFUL_MIN[m]:continue
            pa,pb=a["samples_ge"].get(threshold),b["samples_ge"].get(threshold)
            if pa is None or pb is None:continue
            hit=int(float(a["actual"])>=threshold)
            by_game[game].append((player,m,threshold,float(pa),float(pb),hit))
    result={}
    for size in (4,10):
        err=[];overlap=[]
        for game,rows in sorted(by_game.items()):
            if len(rows)<size:continue
            orig=sorted(rows,key=lambda v:(-v[3],v[0],v[1]))[:size]
            new=sorted(rows,key=lambda v:(-v[4],v[0],v[1]))[:size]
            overlap.append(len({r[:3] for r in orig}&{r[:3] for r in new})/size)
            err.extend((game,1-orig[i][5],1-new[i][5]) for i in range(size))
        met=_score_group(err)
        met["incumbent_hit_rate"]=round(1-met["incumbent_error"],5) if err else None
        met["candidate_hit_rate"]=round(1-met["candidate_error"],5) if err else None
        met["average_fixed_event_overlap"]=round(sum(overlap)/len(overlap),5) if overlap else None
        result["top"+str(size)]=met
    return result


def evaluate_team_volume(incumbent,candidate):
    met=evaluate_native(incumbent,candidate)
    met.update({
        "experiment":"NBA_V5_SUPERVISED_TEAM_OPPORTUNITY_AND_OPPONENT_CONTEXT_V1",
        "baseline":"Unchanged empirical game head",
        "candidate":"Dated team offense + opponent allowed FGA/3PA/FTA/AST/REB rate allocation",
        "top_card_fixed_original_targets":frozen_top_cards(incumbent,candidate),
        "all_original_champion_event_thresholds_preserved":True,
        "retrospective_game_rosters_known":True,
        "model_promotion_allowed":False,
        "requires_forward_first_seen_lineups_before_production":True,
    })
    return met

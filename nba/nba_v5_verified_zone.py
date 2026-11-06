"""NBA V5: independently verify the defensive opponent in shot-zone history.

ESPN PBP sometimes puts the *defender's* team ID on an event whose named
shooter is actively on the other team. This corrupts the learned team
defensive zone frequencies when code trusts the raw event team field.

For FULLY VALID five-man substitution traces only, infer the offensive team
from the named shooter being in exactly one verified on-court team at that
timestamp; adjust the shot event's *team ID* and nothing else. If the game
fails the strict complete-court integrity check, preserve the raw PBP for
the champion and do not invent missing substitutions.

This is a separate optional research source; not automatically promoted.
"""
from __future__ import annotations

from nba.nba_v5_lineup_pairs import replay_game


def verified_shot_teams(pb):
    report=replay_game(pb)
    if not report["valid"]:
        return pb,{"verified":False,"reason":report["reason"],
                   "shot_event_team_corrections":0,"model_effect":"SHADOW_ONLY"}
    a,b=str(pb["home"]),str(pb["away"])
    on={a:list(map(str,pb["starters"][a])),b:list(map(str,pb["starters"][b]))}
    fixed=[]
    changed=0
    seen_shots=0
    for event in pb["events"]:
        e=list(event)
        if len(e)<7:
            fixed.append(e)
            continue
        per,left,kind,tid,pid,prior=e[:6]
        tid=str(tid)
        pid=str(pid or "")
        prior=str(prior or "")
        if kind=="SUB" and tid in on:
            if prior not in on[tid] or pid in on[tid]:
                raise AssertionError("Validated rotation became invalid")
            on[tid][on[tid].index(prior)]=pid
        if kind in ("S2","S3") and pid and int(per) in (1,2,3,4):
            seen_shots+=1
            matches=[t for t in (a,b) if pid in on[t]]
            if len(matches)!=1:
                raise AssertionError("Previously accepted valid game has impossible shooter")
            real=matches[0]
            if real!=tid:
                e[3]=real
                changed+=1
        fixed.append(e)
    result=dict(pb,events=fixed)
    return result,{"verified":True,"reason":"VERIFIED_SHOT_ACTOR_ON_FIVE",
                   "shot_event_team_corrections":changed,
                   "shot_events_seen":seen_shots,
                   "model_effect":"SHADOW_ONLY"}


def verified_defence_zone_tallies(pb):
    from nba.nba_v5_context import game_zone_tallies
    fixed,audit=verified_shot_teams(pb)
    _,against=game_zone_tallies(fixed)
    return against,audit

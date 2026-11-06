"""Report real ESPN substitution coverage before trusting NBA V5 lineup pairs.

This is a stand-alone *data audit*, not a forecast and never a bet.
It does not infer missing quarter-start lineups from postgame box scores.
"""
from __future__ import annotations
import argparse
from collections import Counter
import gzip
import json
from pathlib import Path

from nba.nba_v5_lineup_pairs import LineupPairState


def _games(paths):
    for path in paths:
        opener = gzip.open if path.endswith(".gz") else open
        with opener(path, "rt") as fh:
            for line in fh:
                if line.strip():
                    yield json.loads(line)


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--pbp", action="append", required=True)
    a.add_argument("--out", default="")
    args = a.parse_args()
    st = LineupPairState()
    attempted = 0
    example_bad = Counter()
    for pb in _games(args.pbp):
        attempted += 1
        if not st.add_game(pb):
            reason = next(reversed(st.rejected_games))
            if example_bad[reason] < 3:
                print("REJECTED_SAMPLE", reason, pb.get("game_id"), flush=True)
            example_bad[reason] += 1
    report = {
        "version":"NBA_V5_LINEUP_PBP_COVERAGE_AUDIT_V1",
        "total_pbp_games":attempted,
        "accepted":st.accepted_games,
        "rejected": dict(st.rejected_games),
        "accepted_fraction":round(st.accepted_games/max(attempted,1),4),
        "teams_accepted":len(st.games_by_team),
        "valid_on_court_pair_ledger_entries":len(st.pairs),
        "caveat":"Only ESPN's observed substitutions; do not infer unseen quarter-start rotations.",
        "model_promotion_allowed":False,
    }
    payload = json.dumps(report, indent=2)
    print(payload,flush=True)
    if args.out:
        Path(args.out).write_text(payload+"\n")


if __name__=="__main__":
    main()

"""No-lookahead authoritative pregame roster contracts."""
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

import numpy as np
from nba.nba_v5_pregame_certified import load, apply_confirmed

NOW = "2026-11-06T22:00:00Z"
TIP = "2026-11-06T23:00:00Z"


def slate():
    return [{"game_id": "400", "tipoff_utc": TIP, "home_id": "1", "away_id": "2",
             "rows": [{"player_id": str(i), "team_id": "1",
                       "reported_status": "QUESTIONABLE" if i == 1 else "ACTIVE"}
                      for i in range(1, 8)] +
                     [{"player_id": str(i), "team_id": "2", "reported_status": "ACTIVE"}
                      for i in range(8, 14)]}]


def evidence():
    return {"schema": "NBA_V5_PREGAME_LINEUP_V1",
            "provider": "OFFICIAL_TEAM_RELEASE",
            "source_url": "https://example.org/nba/lineups",
            "published_at_utc": "2026-11-06T21:45:00Z",
            "captured_at_utc": "2026-11-06T21:50:00Z",
            "games": [{"game_id": "400", "tipoff_utc": TIP, "teams": [
                {"team_id": "1", "lineup_state": "CONFIRMED",
                 "starters": ["1", "2", "3", "4", "5"], "inactive": ["7"],
                 "minute_limits": [{"player_id": "1", "announced_max_minutes": 24.0,
                                    "announcement_source_url": "https://example.org/mins"}]}]}]}


def read(e, now=NOW, games=None):
    with tempfile.TemporaryDirectory() as tmp:
        p = Path(tmp) / "source.json"
        p.write_text(json.dumps(e))
        return load(p, now, games if games is not None else slate())


class CertifiedLineupContract(unittest.TestCase):
    def test_applies_verified_five_inactive_and_minutes(self):
        records, audit = read(evidence())
        self.assertEqual(audit["confirmed_teams"], 1)
        team = SimpleNamespace(ids=list(map(str, range(1, 8))),
                               starter=np.array([False] * 7),
                               p_play=np.full(7, .72), minutes_cap=None)
        result = apply_confirmed(team, records[("400", "1")])
        self.assertTrue(result["applied"])
        self.assertEqual(team.starter.sum(), 5)
        self.assertAlmostEqual(team.p_play[0], .999)
        self.assertEqual(team.p_play[6], 0)
        self.assertEqual(team.minutes_cap[0], 24.0)
        self.assertTrue(result["limits_are_soft_rotation_weights"])

    def test_projected_cannot_change_team(self):
        d = evidence()
        r = d["games"][0]["teams"][0]
        r.update(lineup_state="PROJECTED", inactive=[], minute_limits=[])
        records, _ = read(d)
        team = SimpleNamespace(ids=list(map(str, range(1, 8))),
                               starter=np.array([False] * 7),
                               p_play=np.full(7, .4), minutes_cap=None)
        old = team.p_play.copy()
        self.assertFalse(apply_confirmed(team, records[("400", "1")])["applied"])
        np.testing.assert_allclose(team.p_play, old)

    def test_partial_confirmed_lineup_rejected(self):
        d = evidence()
        d["games"][0]["teams"][0]["starters"].pop()
        with self.assertRaisesRegex(ValueError, "five"):
            read(d)

    def test_duplicate_player_rejected(self):
        d = evidence()
        d["games"][0]["teams"][0]["starters"][-1] = "4"
        with self.assertRaisesRegex(ValueError, "duplicate"):
            read(d)

    def test_stale_out_and_confirmed_player_conflict(self):
        d = evidence()
        rows = slate()
        rows[0]["rows"][0]["reported_status"] = "OUT"
        with self.assertRaisesRegex(ValueError, "OUT"):
            read(d, games=rows)

    def test_capture_after_tip_rejected(self):
        d = evidence()
        d["published_at_utc"] = "2026-11-06T22:30:00Z"
        d["captured_at_utc"] = "2026-11-06T22:40:00Z"
        with self.assertRaisesRegex(ValueError, "after tip"):
            read(d, now="2026-11-06T23:01:00Z")

    def test_stale_report_rejected(self):
        d = evidence()
        d["published_at_utc"] = "2026-11-06T19:50:00Z"
        d["captured_at_utc"] = "2026-11-06T20:00:00Z"
        with self.assertRaisesRegex(ValueError, "stale"):
            read(d)

    def test_unknown_player_rejected(self):
        d = evidence()
        d["games"][0]["teams"][0]["starters"][-1] = "987"
        with self.assertRaisesRegex(ValueError, "verified forecast roster"):
            read(d)

    def test_out_of_range_minutes_rejected(self):
        d = evidence()
        d["games"][0]["teams"][0]["minute_limits"][0]["announced_max_minutes"] = 80
        with self.assertRaisesRegex(ValueError, "minutes restriction"):
            read(d)

    def test_projected_cannot_claim_inactive(self):
        d = evidence()
        d["games"][0]["teams"][0]["lineup_state"] = "PROJECTED"
        with self.assertRaisesRegex(ValueError, "uncertified"):
            read(d)

    def test_naive_timestamp_rejected(self):
        d = evidence()
        d["published_at_utc"] = "2026-11-06T21:45:00"
        with self.assertRaisesRegex(ValueError, "timezone"):
            read(d)


if __name__ == "__main__":
    unittest.main()

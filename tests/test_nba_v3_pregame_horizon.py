"""Time-critical NBA forecast window: do not re-simulate the two-day slate."""
import datetime as dt
import unittest

from nba.nba_v3_shadow_publish import narrow_to_pregame_window
from nba.nba_v3_phase1_engine import source_hash

NOW=dt.datetime(2026,11,7,16,0,tzinfo=dt.timezone.utc)


def fixtures():
    offsets=[10,15,30,120,480,540,541,1440,2880]
    return {"schema":"fixture-derivation-test","future_games":len(offsets),
            "games":[{"game_id":str(n),"tipoff_utc":(NOW+dt.timedelta(minutes=m)).isoformat()}
                     for n,m in enumerate(offsets,1)]}


class PregameWindowTests(unittest.TestCase):
    def test_only_games_in_15m_to_9h_refresh_horizon(self):
        full=fixtures()
        narrowed=narrow_to_pregame_window(full,NOW,9)
        self.assertEqual([g["game_id"] for g in narrowed["games"]],
                         ["2","3","4","5","6"])
        self.assertEqual(narrowed["future_games"],5)
        self.assertEqual(narrowed["original_fixture_future_games"],9)
        self.assertEqual(narrowed["original_fixture_source_sha256"],source_hash(full))
        self.assertEqual(full["future_games"],9)
        self.assertEqual(len(full["games"]),9)
        self.assertEqual(narrowed["forecast_window_hours"],9)

    def test_window_boundary_and_small_custom_horizon(self):
        short=narrow_to_pregame_window(fixtures(),NOW,0.5)
        self.assertEqual([g["game_id"] for g in short["games"]],["2","3"])
        self.assertEqual(short["future_games"],2)

    def test_legacy_full_slate_only_when_window_not_specified(self):
        full=fixtures()
        self.assertIs(narrow_to_pregame_window(full,NOW,None),full)

    def test_invalid_windows_or_naive_clock_fail(self):
        for hours in (0,-1,49):
            with self.assertRaisesRegex(ValueError,"WINDOW_HOURS"):
                narrow_to_pregame_window(fixtures(),NOW,hours)
        with self.assertRaisesRegex(ValueError,"NAIVE"):
            narrow_to_pregame_window(fixtures(),NOW.replace(tzinfo=None),9)

    def test_ten_minute_game_does_not_trigger_expensive_now_too_late_run(self):
        short=narrow_to_pregame_window(fixtures(),NOW,0.23)
        self.assertEqual(short["games"],[])
        self.assertEqual(short["future_games"],0)


if __name__=="__main__":
    unittest.main()

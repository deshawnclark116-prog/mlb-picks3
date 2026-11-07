"""The V5 prediction board must show the highest actual model probabilities.

No post-hoc diversity by stat, no shadow substitution of turnover props.
"""
import unittest

from nba.nba_v5_rank import rank_for_screen


def row(pid, market, mean, p_active=.9, status="UNKNOWN"):
    return {"player":f"Player {pid}", "player_id":str(pid),
            "market":market, "mean":mean, "p_active":p_active,
            "mean_basis":"CONDITIONAL_ON_PLAYING", "reported_status":status,
            "model_version":"nba-v5-blend-possession-simulation-20261106",
            "cdf_lattice":{"step":1,"cdf":[min(1,(i+1)/10) for i in range(12)]}}


class HighestPercentageFrontendRank(unittest.TestCase):
    def test_top_four_are_probability_first_including_duplicate_stat_markets(self):
        rows = [row("s1", "steals", 1.2),       # 90% conditional
                row("s2", "steals", 1.1),       # 90% conditional
                row("b", "blocks", 1.1),        # 90% conditional
                row("t", "turnovers", 2.1),     # 80%, not in system picks
                row("a", "assists", 3.2),       # 70% conditional
                row("p", "points", 6.2)]        # 40% conditional
        rank_for_screen(rows)
        featured=sorted([r for r in rows if "frontend_rank" in r],
                        key=lambda r:r["frontend_rank"])
        self.assertEqual([r["player_id"] for r in featured[:4]],
                         ["b", "s1", "s2", "a"])
        self.assertEqual(len(featured), 5)
        self.assertFalse("frontend_rank" in rows[3])
        self.assertTrue(all(r["rank_by_chance_only"]==r["frontend_rank"]
                            for r in featured))
        self.assertTrue(all(featured[i]["frontend_ranking_probability"]
                            >=featured[i+1]["frontend_ranking_probability"]
                            for i in range(len(featured)-1)))

    def test_v5_includes_dnp_not_just_conditional_chance(self):
        rows=[row("a", "assists", 3.1, p_active=.76),  # .7*.76
              row("b", "assists", 3.1, p_active=.99)] # .7*.99
        rank_for_screen(rows)
        self.assertEqual(rows[1]["frontend_rank"],1)
        self.assertEqual(rows[0]["frontend_rank"],2)

    def test_no_out_or_ineligible_player_is_featured(self):
        rows=[row("out", "points", 6.2, status="OUT"),
              row("low", "points", 6.2, p_active=.49),
              row("good", "points", 6.2)]
        rank_for_screen(rows)
        self.assertNotIn("frontend_rank",rows[0])
        self.assertNotIn("frontend_rank",rows[1])
        self.assertEqual(rows[2]["frontend_rank"],1)


if __name__=="__main__":
    unittest.main()

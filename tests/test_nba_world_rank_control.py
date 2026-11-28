import unittest
from nba_world.rank_control import rank_policies
class RankControlTests(unittest.TestCase):
    def test_same_event_policy(self):
        r=[dict(game="g",pid=str(i),market="points",rank=i+1,target=10,cp=.6,base_p=.6+i*.01,
            common_p=.5,new_p=.8-i*.01,hit=int(i<4)) for i in range(12)]
        z=rank_policies(r)
        self.assertEqual(z[4]["old_frontend_rank"]["hits"],4)
        self.assertEqual(z[4]["old_unconditional_probability"]["hits"],0)
        self.assertEqual(z[4]["independent_probability"]["hits"],4)
        self.assertEqual(z[10]["old_frontend_rank"]["n"],10)

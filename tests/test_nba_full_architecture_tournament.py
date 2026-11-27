import copy,unittest
from nba.nba_full_architecture_tournament import build,complete
def fixture(day,absent=False):
 ps=[]
 for team,side in [('1','home'),('2','away')]:
  for i in range(10):
   n=i+10 if absent and i==0 else i
   ps.append(dict(id=team+str(n),team=team,side=side,min=24,pts=10,reb=4,ast=2,tpm=1,fga=8,tpa=3,fta=2,fgm=4,ftm=1,oreb=1,tov=1,start=i<5))
 return dict(game_id=str(day),date=f'2026-01-{day:02}T23:00Z',season_type=2,home=dict(id='1',score=100),away=dict(id='2',score=100),players=ps)
class Test(unittest.TestCase):
 def test_missing_player_and_future_stats(self):
  g=[fixture(i,i==5) for i in range(1,7)]
  a,_,_,_=build(g)
  b=copy.deepcopy(g);b[4]['players'][0]['reb']=99
  c,_,_,_=build(b)
  x=[r for r in a if r['gid']=='5'];y=[r for r in c if r['gid']=='5']
  self.assertEqual([r['x'] for r in x],[r['x'] for r in y])
  self.assertTrue(any(r['pid']=='10' and r['played']==0 for r in x))
  self.assertFalse(any(r['pid']=='110' for r in x))
 def test_bad_box(self):
  g=fixture(1);g['players'].pop();self.assertFalse(complete(g))
if __name__=='__main__':unittest.main()

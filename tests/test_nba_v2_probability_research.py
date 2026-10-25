"""Forward-separated probabilistic NBA research. No fake 65% or bookmaker labels."""
import copy
import unittest
from nba import nba_v2_probability_research as P

def samples():
    rows=[]
    # Distinct game identities, deterministic observational outcomes.
    # Earlier Dec validation fits; later Jan holdout audits only.
    for period,dates in [('validation',31),('holdout',23)]:
        for day in range(dates):
            when=('2025-12-'+f'{day+1:02d}') if period=='validation' else \
                 ('2026-01-'+f'{day+10:02d}' if day<22 else '2026-02-01')
            for player in range(32):
                on=(player+day)%7!=0
                mean=17.0+player*.9
                v=mean+((player*7+day*11)%13-6)*1.2
                rows.append({'game_id':f'{period}{day:02d}',
                    'team_id':'1','player_id':str(player),
                    'game_day':when,'p_play':.82+(.04 if player%2 else .0),
                    'means':{'points':mean,'rebounds':mean/4,
                             'assists':mean/6,'three_pointers_made':mean/13},
                    'played':on,
                    'actual':{'points':max(0,int(v)),'rebounds':max(0,int(v/4)),
                        'assists':max(0,int(v/6)),
                        'three_pointers_made':max(0,int(v/13))}
                        if on else None})
    return rows

class Prob(unittest.TestCase):
    def test_empirical_distribution_probability_monotone_and_nonparticipation(self):
        r=samples();f=P.fit(r)
        self.assertEqual(f['training_n_preselected_players'],24*32)
        self.assertEqual(f['source_cutoff_last_day'],'2026-01-09')
        p20=P.hit_probability(f,'points',27,.85,20)
        p25=P.hit_probability(f,'points',27,.85,25)
        p30=P.hit_probability(f,'points',27,.85,30)
        self.assertGreaterEqual(p20,p25)
        self.assertGreaterEqual(p25,p30)
        self.assertTrue(0<=p30<=1)
        self.assertEqual(P.hit_probability(f,'points',27,0,20),
             P.adjusted_play_probability(f,0)*P.residual_hit_probability(
                 f['conditional_scaled_residuals']['points'],'points',27,20))
        with self.assertRaisesRegex(ValueError,'UNTRAINED'):
            P.hit_probability(f,'points',27,.85,27)

    def test_distribution_fitted_only_on_earlier_data_no_later_label_leak(self):
        data=samples();f=P.fit(data)
        modified=copy.deepcopy(data)
        for x in modified:
            if x['game_day']>=P.HOLDOUT_FROM and x['played']:
                for m in P.MARKETS:x['actual'][m]+=90
        self.assertEqual(P.fit(modified),f)
        m=P.metrics(data,'points',f)
        changed=P.metrics(modified,'points',f)
        self.assertEqual(m['n_market_threshold_observations'],
                         changed['n_market_threshold_observations'])
        self.assertNotEqual(m['brier_distribution'],changed['brier_distribution'])

    def test_forward_gate_explicit_failed_outcome_cannot_be_labeled_calibrated(self):
        d=P.fit_and_audit(samples())
        self.assertFalse(d['calibrated_for_forward_2026_27'])
        self.assertFalse(d['some_historical_market_passed'])
        self.assertTrue(all(
           m['release_status']=='HISTORICAL_PROBABILITY_GATE_FAILED'
           for m in d['markets'].values()))
        self.assertEqual(d['official_bets'],0)
        self.assertTrue(d['training_and_holdout_are_disjoint_games'])

    def test_duplicate_historical_player_source_excluded(self):
        data=samples()
        duplicate=copy.deepcopy(data[0])
        # Authentic source parser works on ESPN games; the fitted probability
        # API rejects inconsistent target/missing market and bad P(play).
        next(r for r in data if r['game_day']>=P.VALIDATION_FROM)['played']=False
        with self.assertRaisesRegex(ValueError,'CONTRADICTION'):
            P.fit_and_audit(data)
        with self.assertRaisesRegex(ValueError,'INVALID'):
            f=P.fit(samples())
            P.hit_probability(f,'points',-5,.85,20)

    def test_source_requires_separate_minimum_sample_and_high_confidence_reliability(self):
        d=P.fit_and_audit(samples())
        gate=d['heldout_release_gates']
        self.assertGreater(gate['minimum_holdout_player_outcomes'],0)
        self.assertGreater(gate['minimum_holdout_market_target_observations'],0)
        self.assertTrue(all(
            z['n_market_threshold_observations']<gate['minimum_holdout_market_target_observations']
            for z in d['markets'].values()))
        self.assertEqual(d['outcome_distribution'],
             'validation_empirical_scale_adjusted_residual_cdf_and_play_reliability_v1')

if __name__=='__main__':unittest.main()

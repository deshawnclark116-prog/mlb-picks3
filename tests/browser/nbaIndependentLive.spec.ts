import {test,expect} from '@playwright/test';

const tomorrow=(()=>{const d=new Date(Date.now()+48*3600000);return d.toISOString()})();
const before=new Date(Date.now()-3600000).toISOString();
const research={
 schema:'NBA_INDEPENDENT_DIRECT_LIVE_PRETIP_SHADOW_V1',
 model_version:'nba-independent-direct-prior-date-head-v1',
 status:'LIVE_PRETIP_RESEARCH_AVAILABLE',
 source_state:'VERIFIED_PUBLISHED_SOURCE',
 generated_at_utc:before,
 trained_through_eastern_date:'2026-11-19',
 research_only:true,official_bets:0,prospective_calibration_verified:false,
 games_forecast:1,
 games:[{
  game_id:'401999991',home:'Denver Nuggets',away:'Houston Rockets',
  tipoff_utc:tomorrow,forecast_at_utc:before,players_forecast:2,rows_count:8,
  players:[{
   player:'Nikola Jokic',player_id:'3112335',team_id:'7',
   reported_status:'UNKNOWN_NOT_ACTIVE_CERTIFIED',
   active_or_starter_certified:false,
   source_active_probability_unverified:.87,
   historical_current_team_played_games:8,history_games:50,
   predictions:{points:24.3,rebounds:11.2,assists:8.1,three_pointers_made:1.4},
   projection_accuracy_confidence:{
    points:{probability_within_window_if_plays:.64,window_plus_or_minus:5,
      historical_validation_n_in_bin:400,metric:'PROB_ACTUAL_WITHIN_ERROR_WINDOW_OF_OWN_MODEL_PROJECTION',
      not_over_under_probability:true,current_season_calibration_verified:false},
    rebounds:{probability_within_window_if_plays:.63,window_plus_or_minus:2,
      historical_validation_n_in_bin:400,metric:'PROB_ACTUAL_WITHIN_ERROR_WINDOW_OF_OWN_MODEL_PROJECTION',
      not_over_under_probability:true,current_season_calibration_verified:false},
    assists:{probability_within_window_if_plays:.71,window_plus_or_minus:2,
      historical_validation_n_in_bin:400,metric:'PROB_ACTUAL_WITHIN_ERROR_WINDOW_OF_OWN_MODEL_PROJECTION',
      not_over_under_probability:true,current_season_calibration_verified:false},
    three_pointers_made:{probability_within_window_if_plays:.57,window_plus_or_minus:1,
      historical_validation_n_in_bin:400,metric:'PROB_ACTUAL_WITHIN_ERROR_WINDOW_OF_OWN_MODEL_PROJECTION',
      not_over_under_probability:true,current_season_calibration_verified:false}
   },
   prior_recent5:{points:25,rebounds:10.8,assists:8.4,three_pointers_made:1.5}
  },{
   player:'Kevin Durant',player_id:'320199',team_id:'10',
   reported_status:'UNKNOWN_NOT_ACTIVE_CERTIFIED',
   active_or_starter_certified:false,
   source_active_probability_unverified:.85,
   historical_current_team_played_games:8,history_games:40,
   predictions:{points:21.5,rebounds:5.1,assists:3.7,three_pointers_made:2.3},
   prior_recent5:{points:22,rebounds:4.7,assists:4.1,three_pointers_made:2.0}
  }],
  skipped_player_reasons:{}
 }]
};

async function launch(page:any,model:unknown=research){
 await page.route('**/api/**',route=>
  route.fulfill({json:{games:[],picks:[],research_only:true,official_bets:0}}));
 await page.route('**/api/nba-independent-shadow**',route=>route.fulfill({json:model}));
 await page.goto('/');
 await page.locator('#tab-btn-nba').click();
 await page.getByTestId('nba-independent-model-tab').click();
}

test('New AI NBA forecasts render the independent real numbers in mobile NBA tab, not V5',async({page})=>{
 await launch(page);
 const root=page.getByTestId('nba-independent-live-model');
 await expect(root).toBeVisible();
 await expect(page.getByTestId('nba-independent-model-tab')).toHaveAttribute('aria-pressed','true');
 await expect(root.getByText('NEW AI · Independent NBA Model')).toBeVisible();
 const match=root.getByTestId('nba-independent-game');
 await expect(match).toHaveCount(1);
 await expect(match).toContainText('Houston Rockets @ Denver Nuggets');
 await expect(match).toContainText('Nikola Jokic');
 await expect(match).toContainText('24.3');
 await expect(match).toContainText('11.2');
 await expect(match).toContainText('8.1');
 await expect(match).toContainText('1.4');
 await expect(match).toContainText('Kevin Durant');
 await expect(root).toContainText('Historical projection accuracy');
 await expect(root.getByTestId('nba-independent-confidence-ranking')).toContainText('71%');
 await expect(root.getByTestId('nba-independent-confidence-ranking')).toContainText('Nikola Jokic');
 await expect(root.getByTestId('nba-independent-confidence-ranking')).toContainText('AST 8.1');
 await expect(root.getByTestId('nba-independent-confidence-ranking')).toContainText('(±2)');
 await expect(root.getByText(/No sportsbook|no sportsbook/i).first()).toBeVisible();
 await expect(page.getByTestId('nba-v3-primary-board')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});

test('New AI source unavailability does NOT quietly fallback to V5 or invent player picks',async({page})=>{
 await launch(page,{
  schema:'NBA_INDEPENDENT_DIRECT_LIVE_PRETIP_SHADOW_V1',
  model_version:'nba-independent-direct-prior-date-head-v1',
  status:'SOURCE_NOT_YET_PUBLISHED',
  research_only:true,official_bets:0,source_state:'SOURCE_UNAVAILABLE',games:[]
 });
 const root=page.getByTestId('nba-independent-live-model');
 await expect(root.getByTestId('nba-independent-not-ready')).toContainText(
  'have not been published yet');
 await expect(root.getByTestId('nba-independent-game')).toHaveCount(0);
 await expect(root).not.toContainText('V5 substitute');
});

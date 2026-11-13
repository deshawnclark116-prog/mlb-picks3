import {test,expect} from '@playwright/test';

const tomorrow=(()=>{
 const d=new Date(Date.now()+2*86400000);
 return d.toISOString();
})();
// Authentic integer CDFs: 26.7 points means P(27+) = 67.5%, not the
// previous fixture's unrelated 20-point milestone probability.
const pointCdf=Array.from({length:45},(_,k)=>k<24?0:k<28?.325:1);
const assistCdf=Array.from({length:24},(_,k)=>k<6?0:k<8?.4:1);
const game={
 game_id:'401999987',home:'Dallas Mavericks',away:'Philadelphia 76ers',
 tipoff_utc:tomorrow,forecast_at_utc:new Date(Date.now()-3600000).toISOString(),
 rows_count:3,
 rows:[
  {game_id:'401999987',team_id:'20',player_id:'5252',player:'V3 Source Athlete',
   market:'points',mean:26.7,median:28,p10:24,p25:24,p75:28,p90:28,
   cdf_lattice:{step:1,cdf:pointCdf},
   p_active:.93,exp_opp:31,role_share:.15,
   reported_status:'UNKNOWN_NOT_ACTIVE_CERTIFIED',
   unc_reasons:['GAME_DAY_ACTIVE_NOT_CERTIFIED'],
   model_target:{milestone:20,probability:.788,method:'pregame_full_game_mc_cdf'}},
  {game_id:'401999987',team_id:'20',player_id:'5252',player:'V3 Source Athlete',
   market:'assists',mean:7.2,median:8,p10:6,p25:6,p75:8,p90:8,
   cdf_lattice:{step:1,cdf:assistCdf},
   p_active:.93,exp_opp:31,role_share:.15,
   reported_status:'UNKNOWN_NOT_ACTIVE_CERTIFIED',
   unc_reasons:['GAME_DAY_ACTIVE_NOT_CERTIFIED'],
   model_target:{milestone:5,probability:.702,method:'pregame_full_game_mc_cdf'}},
  {game_id:'401999987',team_id:'6',player_id:'5555',player:'Reported Out',
   market:'points',mean:0,median:0,p10:0,p25:0,p75:0,p90:0,
   p_active:0,exp_opp:0,role_share:0,
   reported_status:'OUT',unc_reasons:['SOURCE_REPORTED_OUT'],
   model_target:{milestone:6,probability:.90,method:'pregame_full_game_mc_cdf'}}
 ]
};
const research={
 schema:'NBA_V3_FULL_GAME_DISTRIBUTION_READ_ONLY_V1',
 status:'AVAILABLE_RESEARCH_ONLY',
 upcoming_games:1,original_games_audited:1,
 research_only:true,official_bets:0,
 games:[game],
 prospective_model_probability_calibration_verified:false,
 sportsbook_lines_required:false
};
async function setup(page:any,v3:any=research){
 // Last-added route has priority in Playwright. The V3-specific fixture
 // MUST run before the generic application API catch-all.
 await page.route('**/api/**',route=>route.fulfill({json:{games:[],picks:[]}}));
 await page.route('**/api/nba-v3-shadow**',route=>
  route.fulfill(typeof v3==='function'?v3():{json:v3}));
 await page.goto('/');
 await page.locator('#tab-btn-nba').click();
}
test('NBA opens V3 SYSTEM PICKS, not V2 or optional shadow view',async({page})=>{
 await setup(page);
 await expect(page.getByTestId('nba-research-screen')).toBeVisible();
 await expect(page.getByRole('button',{name:'SYSTEM PICKS',exact:true}))
    .toHaveAttribute('aria-pressed','true');
 await expect(page.getByTestId('nba-v3-primary-board')).toBeVisible();
 await expect(page.getByRole('heading',{name:/NBA.*2026–27 model projections/})).toBeVisible();
 await expect(page.getByTestId('nba-betting-style-decision-board')).toHaveCount(0);
 // Sunday night default must show the NEXT independently captured V3 slate
 // when no game has a first-observed forecast on the current Eastern date.
 await expect(page.getByRole('button',{name:'Next slate'}))
   .toHaveAttribute('aria-pressed','true');
 await expect(page.getByTestId('nba-v3-game')).toHaveCount(1);
 await expect(page.getByText(/Next available:/)).toBeVisible();
 await page.getByRole('button',{name:'All upcoming'}).click();
 const g=page.getByTestId('nba-v3-game');
 await expect(g).toHaveCount(1);
 await g.locator('button[aria-expanded]').click();
 await expect(g.getByTestId('nba-v3-system-pick')).toHaveCount(2);
 await expect(g.getByTestId('nba-v3-system-pick').first()).toContainText('27 PTS');
 await expect(g.getByTestId('nba-v3-system-pick').first()).toContainText('67.5%');
 await expect(g.getByTestId('nba-v3-system-pick').filter({hasText:'Reported Out'})).toHaveCount(0);
 await expect(g.getByTestId('nba-v3-system-pick').last()).toContainText('ASSISTS');
 await expect(page.getByText(/NOT YET PROSPECTIVELY CALIBRATED/)).toBeVisible();
});
test('NBA MODEL BOARD contains every authentic V3 stat even when system gate rejects it',async({page})=>{
 await setup(page);
 await page.getByRole('button',{name:'MODEL BOARD',exact:true}).click();
 await expect(page.getByRole('button',{name:'MODEL BOARD',exact:true}))
   .toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'All upcoming'}).click();
 await page.getByTestId('nba-v3-game').locator('button[aria-expanded]').click();
 await expect(page.getByTestId('nba-v3-stat-projection')).toHaveCount(3);
 await expect(page.getByTestId('nba-v3-stat-projection').last()).toContainText('Reported Out');
 await expect(page.getByTestId('nba-v3-system-pick')).toHaveCount(0);
});
test('when V3 originals are missing frontend does not silently substitute V2 picks',async({page})=>{
 await setup(page,{
  ...research,status:'NO_FIRSTSEEN_V3_SHADOW_YET',
  upcoming_games:0,games:[],original_games_audited:0
 });
 await expect(page.getByTestId('nba-v3-no-source')).toContainText(
  'old V2 predictions will NOT be mislabeled as V3');
 await expect(page.getByTestId('nba-betting-style-decision-board')).toHaveCount(0);
 await page.getByRole('button',{name:'MODEL EVIDENCE',exact:true}).click();
 await expect(page.getByTestId('nba-v5-evidence'))
   .toContainText('FORECAST VALIDATION STATUS');
 await expect(page.getByRole('button',{name:'V2 ARCHIVE'})).toBeVisible();
});

test('NBA featured game tiles show the four highest percentages across stat categories, never forced variety or turnovers',async({page})=>{
 const sample=(id:string,player:string,market:string,mean:number,whole:number,prob:number)=>({
  ...game.rows[0],player_id:id,player,market,mean,p_active:.95,
  // This test exercises probability ordering of independently confirmed starters.
  starter_evidence:'CONFIRMED_STARTER',
  model_target:null,
  reach_probabilities:{whole_projection:whole,probability_including_dnp:prob,
   probability_if_playing:Math.min(1,prob/.95),p_active:.95,forward_calibrated:false}
 });
 const rows=[
  sample('a','Top Points A','points',20.7,21,.85),
  sample('b','Top Points B','points',18.7,19,.82),
  sample('c','Top Rebound','rebounds',7.1,7,.76),
  sample('d','Top Assist','assists',5.2,5,.75),
  sample('e','Unbettable Turnover','turnovers',2.1,2,.98),
  sample('f','Lower Block','blocks',1.1,1,.70),
  sample('g','Lower Three','three_pointers_made',2.1,2,.65)
 ];
 await setup(page,{...research,games:[{...game,rows,rows_count:rows.length,
   forecast_kind:'V5_LATEST'}]});
 const card=page.getByTestId('nba-v3-game');
 const tiles=card.getByTestId('nba-v3-tile');
 await expect(tiles).toHaveCount(4);
 await expect(tiles.nth(0)).toContainText('Top Points A');
 await expect(tiles.nth(1)).toContainText('Top Points B');
 await expect(tiles.nth(2)).toContainText('Top Rebound');
 await expect(tiles.nth(3)).toContainText('Top Assist');
 await expect(tiles.nth(0)).toContainText('85.0%');
 await expect(tiles.nth(1)).toContainText('82.0%');
 await expect(card.getByText('Unbettable Turnover')).toHaveCount(0);
 await card.locator('button[aria-expanded]').click();
 const detail=card.getByTestId('nba-v3-system-pick');
 await expect(detail).toHaveCount(6);
 await expect(detail.nth(0)).toContainText('Top Points A');
 await expect(detail.nth(1)).toContainText('Top Points B');
 await page.getByRole('button',{name:'MODEL BOARD',exact:true}).click();
 await page.getByTestId('nba-v3-game').locator('button[aria-expanded]').click();
 await expect(page.getByTestId('nba-v3-stat-projection').filter({hasText:'Unbettable Turnover'})).toHaveCount(1);
});

import {test,expect} from '@playwright/test';

const tip=new Date(Date.now()+48*3600_000).toISOString();
const prior=new Date(Date.now()-3600_000).toISOString();
const marketToModel={
 points:'V5',rebounds:'V3',assists:'V4',three_pointers_made:'V3'
} as const;
const cdf=Array.from({length:65},(_,i)=>Math.min(1,(i+1)/60));
const values=[
 {market:'points',model:'V5',mean:20.1,player:'Official Points Player'},
 {market:'rebounds',model:'V3',mean:8.2,player:'Official Rebounds Player'},
 {market:'assists',model:'V4',mean:6.2,player:'Official Assists Player'},
 {market:'three_pointers_made',model:'V3',mean:2.2,player:'Official Threes Player'}
] as const;
const game=(removeMarket?:string)=>({
 game_id:'401999983',home:'New York Knicks',away:'Boston Celtics',
 tipoff_utc:tip,rows_count:values.filter(x=>x.market!==removeMarket).length,
 missing_markets:removeMarket?[removeMarket]:[],
 rows:values.filter(x=>x.market!==removeMarket).map((x,i)=>({
  game_id:'401999983',team_id:'18',player_id:String(90000+i),
  player:x.player,market:x.market,mean:x.mean,median:x.mean,
  p10:0,p90:x.mean+5,p_active:.91,reported_status:'UNKNOWN',
  specialist_model:x.model,model_version:'nba-'+x.model.toLowerCase()+'-verified-test',
  specialist_forecast_at_utc:prior,
  cdf_lattice:{step:1,cdf}
 }))
});
const base={
 schema:'NBA_SPECIALIST_MARKET_ROUTER_V1',status:'AVAILABLE_PRIMARY_PROJECTIONS',
 publication_role:'PRIMARY_NBA_SYSTEM_PICKS',
 research_only:true,official_bets:0,no_ensemble_blending:true,
 no_automatic_model_fallback:true,market_assignments:marketToModel
};
async function setup(page:any,missing?:string){
 await page.route('**/api/**',route=>route.fulfill({json:{games:[],picks:[]}}));
 await page.route('**/api/nba-specialist**',route=>route.fulfill({
  json:{...base,games:[game(missing)]}
 }));
 await page.goto('/');
 await page.locator('#tab-btn-nba').click();
}

test('NBA defaults to official specialist market ownership, with no blending or legacy picks',async({page})=>{
 await setup(page);
 await expect(page.getByRole('button',{name:'SYSTEM PICKS',exact:true}))
  .toHaveAttribute('aria-pressed','true');
 const board=page.getByTestId('nba-specialist-board');
 await expect(board).toBeVisible();
 await expect(page.getByTestId('nba-v3-primary-board')).toHaveCount(0);
 await expect(board.getByText('NBA SYSTEM PICKS · SPECIALIST MODELS')).toBeVisible();
 await expect(board.getByText('Official Points Player')).toBeVisible();
 await expect(board.getByText('Official Rebounds Player')).toBeVisible();
 await expect(board.getByText('Official Assists Player')).toBeVisible();
 await expect(board.getByText('Official Threes Player')).toBeVisible();
 const gameButton=board.locator('button[aria-expanded]');
 await gameButton.click();
 const rows=board.getByTestId('nba-specialist-projection');
 await expect(rows).toHaveCount(4);
 await expect(rows.filter({hasText:'Official Points Player'})).toContainText('V5');
 await expect(rows.filter({hasText:'Official Rebounds Player'})).toContainText('V3');
 await expect(rows.filter({hasText:'Official Assists Player'})).toContainText('V4');
 await expect(rows.filter({hasText:'Official Threes Player'})).toContainText('V3');
 await expect(board.getByText(/not yet calibrated/i).last()).toBeVisible();
});
test('An unavailable model market is visibly missing, never silently filled',async({page})=>{
 await setup(page,'assists');
 const board=page.getByTestId('nba-specialist-board');
 await expect(board.getByTestId('nba-specialist-missing')).toContainText('AST');
 await board.locator('button[aria-expanded]').click();
 await expect(board.getByTestId('nba-specialist-projection')).toHaveCount(3);
 await expect(board.getByText('Official Assists Player')).toHaveCount(0);
});
test('Previous system remains reachable but does not own the first screen',async({page})=>{
 await setup(page);
 await page.getByTestId('nba-previous-system-tab').click();
 await expect(page.getByTestId('nba-previous-system-tab')).toHaveAttribute('aria-pressed','true');
 await expect(page.getByTestId('nba-specialist-board')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'SYSTEM PICKS',exact:true}))
  .toHaveAttribute('aria-pressed','false');
});

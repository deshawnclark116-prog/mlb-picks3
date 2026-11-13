import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

const tip=new Date(Date.now()+2*86400000).toISOString();
const forecast=new Date(Date.now()-3600000).toISOString();
const uniform=Array.from({length:40},(_,i)=>Math.min(1,(i+1)/40));
const choices:['points'|'rebounds'|'assists'|'three_pointers_made'|'steals'|'blocks',number,number][]=[
 ['steals',1.4,1],['three_pointers_made',1.2,1],['blocks',1.2,1],
 ['three_pointers_made',1.3,1],['three_pointers_made',1.4,1],
 ['three_pointers_made',1.2,1],['steals',1.3,1],
 ['three_pointers_made',1.2,1],['assists',2.4,2],
 ['assists',2.3,2],['rebounds',3.5,3],['points',7.4,7]
];
const game={
 game_id:'401999938',home:'Indiana Pacers',away:'Denver Nuggets',
 tipoff_utc:tip,forecast_at_utc:forecast,rows_count:choices.length,
 forecast_kind:'V5_LATEST',
 certified_pregame_team_effect:{'7':{applied:true,confirmed_starters:5},'8':{applied:true,confirmed_starters:5}},
 rows:choices.map(([market,mean,whole],i)=>({
   game_id:'401999938',team_id:i<5?'7':'8',player_id:String(51000+i),
   player:['Nikola Jokic','Kelly Oubre Jr.','Jay Huff','Jay Huff',
    'Nikola Jokic','Christian Braun','Kelly Oubre Jr.','Quenton Jackson',
    'Christian Braun','Jalen Slawson','Rebound Candidate','Points Candidate'][i],
   market,mean,median:mean,p10:0,p25:0,p75:3,p90:5,
   p_active:.96,exp_opp:20,role_share:.1,
   reported_status:'UNKNOWN_NOT_ACTIVE_CERTIFIED',
   starter_evidence:i<10?'CONFIRMED_STARTER':'CONFIRMED_NONSTARTER',
   unc_reasons:[],model_target:null,cdf_lattice:{step:1,cdf:uniform},
   reach_probabilities:{
     whole_projection:whole,probability_if_playing:.97-i*.02,
     probability_including_dnp:.93-i*.02,p_active:.96,forward_calibrated:false
   }
 }))
};
const source={
 schema:'NBA_V3_FULL_GAME_DISTRIBUTION_READ_ONLY_V1',
 status:'AVAILABLE_RESEARCH_ONLY',
 upcoming_games:1,original_games_audited:1,research_only:true,official_bets:0,
 games:[game],
 prospective_model_probability_calibration_verified:false,
 sportsbook_lines_required:false
};
async function setup(page:any,doc:any=source){
 await page.route('**/api/**',route=>route.fulfill({json:{games:[],picks:[]}}));
 await page.route('**/api/nba-v3-shadow**',route=>route.fulfill({json:doc}));
 await page.goto('/');
 await page.locator('#tab-btn-nba').click();
 await expect(page.getByTestId('nba-v3-game')).toHaveCount(1);
}
test('NBA V5 TOP 10 is separate from existing 4 tiles; matches canonical top 10 across all categories despite filter',async({page})=>{
 test.setTimeout(60000);
 await setup(page);
 const host=page.getByTestId('nba-v3-game');
 await expect(host.getByTestId('nba-v3-tile')).toHaveCount(4);
 const button=host.getByRole('button',{name:'Open NBA V5 top 10 game card for Denver Nuggets at Indiana Pacers'});
 await expect(button).toBeVisible();
 const box=await button.boundingBox();
 expect(box!.width).toBeGreaterThanOrEqual(44);
 expect(box!.height).toBeGreaterThanOrEqual(44);
 expect(await button.evaluate(x=>x.parentElement?.closest('button'))).toBe(null);
 await page.getByRole('button',{name:'Filter',exact:true}).click();
 await page.getByRole('button',{name:'3PM',exact:true}).click();
 // The small normal tiles now obey the market filter; the image does NOT.
 await expect(host.getByTestId('nba-v3-tile')).toHaveCount(4);
 await button.click();
 const modal=page.getByRole('dialog',{name:'NBA V5 · TOP 10 GAME CARD'});
 await expect(modal).toBeVisible();
 const poster=modal.getByTestId('nba-v5-game-share-poster');
 const rows=poster.getByTestId('nba-v5-share-pick');
 await expect(rows).toHaveCount(10);
 await expect(rows.nth(0)).toContainText('Nikola Jokic');
 await expect(rows.nth(0)).toContainText('1+ STEALS');
 await expect(rows.nth(0)).toContainText('93.00%');
 await expect(rows.nth(9)).toContainText('Jalen Slawson');
 await expect(rows.nth(9)).toContainText('2+ ASSISTS');
 await expect(poster).not.toContainText('Rebound Candidate');
 await expect(modal).toContainText('No sportsbook lines or combined parlay probability');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
 const preview=await modal.getByTestId('nba-v5-share-preview').boundingBox();
 expect(preview!.x).toBeGreaterThanOrEqual(0);
 expect(preview!.x+preview!.width).toBeLessThanOrEqual(360);
 const download=page.waitForEvent('download');
 await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();
 const dl=await download,filename=dl.suggestedFilename();
 expect(filename).toContain('prop-edge-nba-v5-denver-nuggets-indiana-pacers-top10-');
 const saved=readFileSync((await dl.path())!);
 expect(saved.length).toBeGreaterThan(10000);
 expect(saved.subarray(1,4).toString()).toBe('PNG');
 expect(saved.readUInt32BE(16)).toBe(1080);
 expect(saved.readUInt32BE(20)).toBe(1350);
 await modal.getByRole('button',{name:'CLOSE',exact:true}).click();
 await expect(modal).toHaveCount(0);
 await expect(host.getByTestId('nba-v3-tile')).toHaveCount(4);
});

test('V3/V4 never get mislabeled V5 image cards',async({page})=>{
 await setup(page,{...source,games:[{...game,forecast_kind:'V4_LATEST'}]});
 await expect(page.getByTestId('nba-v5-open-top10')).toHaveCount(0);
 await expect(page.getByTestId('nba-v3-tile')).toHaveCount(4);
});

test('V5 with no confirmed lineup hides the betting-style cards instead of treating bench as a starter',async({page})=>{
 const pending={...source,games:[{...game,
   certified_pregame_team_effect:{},
   rows:game.rows.map(row=>({...row,starter_evidence:'NOT_VERIFIED'}))
 }]};
 await setup(page,pending);
 const host=page.getByTestId('nba-v3-game');
 await expect(host.getByTestId('nba-v3-tile')).toHaveCount(0);
 await expect(host.getByTestId('nba-v5-open-top10')).toHaveCount(0);
 await expect(host.getByTestId('nba-v5-starters-pending')).toContainText('no confirmed game-day starters');
});

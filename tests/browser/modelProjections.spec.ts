import {test,expect} from "@playwright/test";

// Synthetic NHL browser games must be UPCOMING Eastern-date fixtures.
const futureDate=(()=>{
 const tomorrow=new Date(Date.now()+2*86400000);
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',
   year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(tomorrow);
 const p=Object.fromEntries(parts.map(f=>[f.type,f.value]));
 return `${p.year}-${p.month}-${p.day}`;
})();
const futureKickoff=futureDate+'T23:00:00Z';
const originalCutoff=new Date(Date.parse(futureKickoff)-86400000).toISOString();
const originalGenerated=new Date(Date.parse(futureKickoff)-90000000).toISOString();

const cfb={
 schema:"cfb-player-stat-projections-research-v1",research_only:true,official_new_betting_picks:0,
 original_run_id:38053736857, original_baseline_generated_at:"2026-10-10T12:30:00Z",
 forecast_count:1,monte_carlo_count:1,
 forecasts:[{game_id:"one",player_id:"123",player:"Alex Runner",team:"Alpha",opponent:"Beta",
  position:"RB",market:"rushing_yards",kickoff_utc:"2026-10-10T16:00:00Z",unit:"yards",
  baseline:{mean:61,median:60,last_three:[57,60,66]},
  monte_carlo:{mean:72,median:70,p10:35,p90:110,n_simulations:4000}}]
};
const currentCfb={
 generated_at_utc:"2026-10-10T20:25:19Z",season:2026,week:6,
 markets:{moneyline:{eligible:13}},picks:[
  {market:"moneyline",prop_type:"moneyline",player:"Oregon State Beavers",team:"Oregon State Beavers",
   opponent:"San Diego State Aztecs",season:2026,week:6,kickoff_utc:"2026-10-10T22:00:00Z",
   game_id:"401860902",pick:"Oregon State Beavers ML",model_prob:.8735,prob_pct:87.35,confidence:"HIGH"},
  {market:"moneyline",prop_type:"moneyline",player:"Memphis Tigers",team:"Memphis Tigers",
   opponent:"UAB Blazers",season:2026,week:6,kickoff_utc:"2026-10-10T23:00:00Z",
   game_id:"401862798",pick:"Memphis Tigers ML",model_prob:.8225,prob_pct:82.25,confidence:"HIGH"},
  {market:"rushing_yards",prop_type:"rushing_yards",player:"Current Running Back",team:"AAA",
   opponent:"BBB",season:2026,week:6,kickoff_utc:"2026-10-10T23:00:00Z",
   game_id:"g2",pick:"OVER 50.5",line:50.5,model_prob:.678,prob_pct:67.8,confidence:"MEDIUM"}
 ]};
const rowFields=["game_id","player_id","player","team","opponent","game_date","scheduled_start","mean","median","sd","p10","p25","p75","p90","p0","p_ge1","p_ge2","p_ge3","p_ge4","p_ge5"];
const nhl={
 schema:"nhl-v2-sog-nfl-style-shadow-v1",status:"RESEARCH_ONLY_NOT_VALIDATED_FOR_BETTING",
 horizons:["T90"],dates:["2026-10-07"],total_valid_forecasts:1,row_fields:rowFields,
 forecasts:{T90:[["nhl-game","nhl-player-123","Skater Example","PIT","WSH","2026-10-07","2026-10-07T23:00:00Z",2.4,2,1.5,0,1,3,5,.15,.85,.65,.4,.2,.08]]}
};
const currentNhl={
 generated_at_utc:"2026-10-18T20:45:00Z",season:2026,game_date:futureDate,
 markets:{shots_on_goal:{eligible:1}},picks:[{
   market:"shots_on_goal",prop_type:"shots_on_goal",player_id:"nl-1",
   player:"Current Skater",team:"PIT",opponent:"WSH",season:2026,
   game_date:futureDate,kickoff_utc:futureKickoff,
   pick:"OVER 2.5",line:2.5,model_prob:.74,prob_pct:74,confidence:"MEDIUM",games_played:5
 }]
};
const currentTennis={
 generated_at_utc:"2026-10-18T20:45:00Z",markets:{moneyline:{eligible:1}},
 picks:[{
   market:"moneyline",prop_type:"moneyline",tour:"atp",tourney:"Test Open",
   surface:"Hard",surface_confirmed:true,best_of:3,
   player1:"Player Alpha",player1_id:"p1",player2:"Player Beta",player2_id:"p2",
   start_time_utc:futureKickoff,pick:"Player Alpha ML",
   model_prob:.68,prob_pct:68,unagraded:true,model_source:"original_moneyline_research"
 }]
};
async function setup(page:any,cfbFailed=false,nhlFixture=currentNhl) {
 await page.route("**/api/**", route=>{
  const url=route.request().url();
  if(url.includes("/api/model-projections/cfb"))return route.fulfill(cfbFailed?{status:503,json:{error:"CFB research unavailable",details:"Original artifact missing"}}:{json:cfb});
  if(url.includes("/api/cfb-predictions"))return route.fulfill({json:currentCfb});
  if(url.includes("/api/nhl-predictions"))return route.fulfill({json:nhlFixture});
  if(url.includes("/api/tennis-predictions"))return route.fulfill({json:currentTennis});
  if(url.includes("/api/model-projections/nhl"))return route.fulfill({json:nhl});
  if(url.includes("/api/predictions"))return route.fulfill({json:[]});
  return route.fulfill({json:{picks:[],predictions:[],games:[]}});
 });
 await page.goto("/");
}
test("CFB opens current prediction board with moneylines first; archived 3-game means remain separate",async ({page})=>{
 await setup(page);
 await page.locator("#tab-btn-cfb").click();
 await expect(page.getByText("CFB PREDICTIONS",{exact:true})).toBeVisible();
 await expect(page.getByRole("button",{name:"Current predictions"})).toHaveAttribute("aria-pressed","true");
 await expect(page.getByRole("region",{name:"Current CFB moneyline model predictions"})).toContainText("Oregon State Beavers ML");
 await expect(page.getByRole("region",{name:"Current CFB moneyline model predictions"})).toContainText("87.4%");
 await expect(page.getByRole("region",{name:"Current CFB moneyline model predictions"})).toContainText("Memphis Tigers ML");
 await expect(page.getByText("Alex Runner")).toHaveCount(0);
 await page.getByRole("button",{name:"View all 2"}).click();
 await expect(page.locator("#cfb-btn-market-moneyline")).toHaveClass(/bg-\[#00FF41\]/);
 await page.getByRole("button",{name:"Research archive"}).click();
 await expect(page.getByRole("button",{name:"Research archive"})).toHaveAttribute("aria-pressed","true");
 await expect(page.getByText("Alex Runner")).toBeVisible();
 await expect(page.getByText(/72\.0\s*yards/)).toBeVisible();
 await expect(page.getByText("UNCALIBRATED MC")).toBeVisible();
 await expect(page.getByText("Oregon State Beavers ML")).toHaveCount(0);
 await page.getByRole("button",{name:"Current predictions"}).click();
 await expect(page.getByText("Alex Runner")).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
test("NHL shot-count forecast renders the model mean and horizon without fabricated sportsbook sides",async ({page})=>{
 await setup(page);await page.locator("#tab-btn-nhl").click();
 await expect(page.getByRole("button",{name:"Current predictions"})).toHaveAttribute("aria-pressed","true");
 await page.getByRole("button",{name:"Research archive"}).click();
 await expect(page.getByText("NHL PREDICTIONS")).toBeVisible();
 await expect(page.getByText("Skater Example")).toBeVisible();
 await expect(page.getByText("2.4",{exact:true})).toBeVisible();
 await expect(page.getByText("40.0%",{exact:true})).toBeVisible();
 await expect(page.getByText(/Frozen historical player shot-count forecasts/)).toBeVisible();
 await expect(page.getByText(/OVER 2.5/)).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
test("missing model feed fails closed; no legacy auto-fallback",async ({page})=>{
 await setup(page,true);await page.locator("#tab-btn-cfb").click();
 await expect(page.getByRole("region",{name:"Current CFB moneyline model predictions"})).toContainText("Oregon State Beavers ML");
 await page.getByRole("button",{name:"Research archive"}).click();
 await expect(page.getByRole("alert")).toContainText("Original artifact missing");
 await expect(page.getByText("Alex Runner")).toHaveCount(0);
 await expect(page.getByRole("button",{name:"Research archive"})).toHaveAttribute("aria-pressed","true");
 await page.getByRole("button",{name:"Current predictions"}).click();
 await expect(page.getByRole("region",{name:"Current CFB moneyline model predictions"})).toContainText("Oregon State Beavers ML");
});

test("current CFB and NHL use the same NFL-style grouped matchup and share-card layout",async ({page})=>{
 await setup(page);
 await page.locator("#tab-btn-cfb").click();
 await expect(page.getByTestId("unified-sport-board")).toBeVisible();
 await expect(page.getByRole("button",{name:"SYSTEM PICKS",exact:true})).toBeVisible();
 await expect(page.getByRole("button",{name:"MODEL BOARD",exact:true})).toBeVisible();
 const cfb=page.getByTestId("unified-sport-game").first();
 await expect(cfb).toBeVisible();
 await cfb.locator('button[aria-expanded]').click();
 await expect(cfb.getByTestId("unified-sport-projection")).toBeVisible();
 await page.locator("#tab-btn-nhl").click();
 // Framer Motion deliberately retains the exiting CFB screen briefly.
 // Match the ACTIVE NHL container, not an exiting CFB board.
 const nhlScreen=page.locator("#motion-screen-NHL");
 await expect(nhlScreen).toBeVisible();
 await expect(nhlScreen.getByTestId("unified-sport-board")).toBeVisible();
 const nhl=nhlScreen.getByTestId("unified-sport-game").first();
 await expect(nhl).toContainText("PIT vs WSH");
 await nhl.locator('button[aria-expanded]').click();
 await expect(nhl.getByTestId("unified-predicted-stat")).toContainText("MODEL CHANCE OF TARGET");
 await expect(nhl.getByTestId("unified-sport-projection")).toContainText("OVER 2.5");
 await nhl.getByRole("button",{name:/Create share card/}).click();
 await expect(page.getByRole("dialog")).toContainText("CREATE GAME CARD");
 await expect(page.getByTestId("unified-sport-share-poster")).toContainText("MODEL EVENT PROBABILITIES · NO NUMERIC STATS");
 await expect(page.getByRole("button",{name:"BETTABLE CARD"})).toBeDisabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});

test("Minnesota-Columbus six-player poster shows frozen numerical shot projections, not 0.5 point targets",async ({page})=>{
 await setup(page);
 const kickoff=futureKickoff;
 const current={...currentNhl,game_date:futureDate,picks:[{
    ...currentNhl.picks[0],player:"Kirill Kaprizov",team:"MIN",opponent:"CBJ",
    market:"points",prop_type:"points",pick:"OVER 0.5",line:.5,
    kickoff_utc:kickoff,model_prob:.744,prob_pct:74.4
 }]};
 const players=[
   ["Matt Boldy","MIN",3.9464,4],
   ["Zach Werenski","CBJ",3.2464,3],
   ["Joel Eriksson Ek","MIN",3.0564,3],
   ["Kirill Kaprizov","MIN",3.0177,3],
   ["Marcus Johansson","MIN",2.842,3],
   ["Cole Sillinger","CBJ",2.621,2]
 ] as const;
 const source={
   schema:"NHL_APP_VERIFIED_SOG_COUNT_RESEARCH_V1",
   research_only:true,not_an_official_betting_board:true,
   game_date:futureDate,projected_count:players.length,
   projections:players.map(([player,team,mean,median],i)=>({
     game_id:"2026020048",player_id:String(8478864+i),player,team,
     opponent:team==="MIN"?"CBJ":"MIN",game_date:futureDate,
     scheduled_start:kickoff,mean,median,sd:1.4,p10:1,p90:6,
     forecast_horizon:"T24H",source_generated_at:originalGenerated,
     source_cutoff_at:originalCutoff,
     research_only:true,not_an_official_betting_prediction:true
   }))
 };
 await page.route("**/api/nhl-predictions**",route=>route.fulfill({json:current}));
 await page.route("**/api/nhl-count-research**",route=>route.fulfill({json:source}));
 await page.locator("#tab-btn-nhl").click();
 await expect(page.getByText(/Frozen V2 numerical shot forecasts \([^)]+: 6\)/)).toBeVisible();
 const game=page.getByTestId("unified-sport-game").filter({hasText:"CBJ"});
 await expect(game).toContainText("MIN vs CBJ");
 await game.locator('button[aria-expanded]').click();
 const featured=game.getByTestId("unified-sport-projection");
 await expect(featured.first()).toContainText("Matt Boldy");
 await expect(featured.first().getByTestId("unified-predicted-stat")).toContainText("3.9 shots");
 await expect(featured.first()).toContainText("NO VERIFIED SPORTSBOOK SHOT LINE");
 await game.getByRole("button",{name:/Create share card/}).click();
 const poster=page.getByTestId("unified-sport-share-poster");
 await expect(poster).toContainText("MODEL STAT PROJECTIONS");
 await expect(poster).toContainText("MATT BOLDY");
 await expect(poster).toContainText("3.9 SHOTS");
 await expect(poster).not.toContainText("NOT PUBLISHED");
 await expect(poster).not.toContainText("OVER 0.5");
 await expect(page.getByRole("button",{name:"BETTABLE CARD"})).toBeDisabled();
});

test("frozen NHL numerical game remains visible with ZERO point-classifier picks",async ({page})=>{
 const current={...currentNhl,picks:[]};
 // Seed zero classifier rows BEFORE app bootstrap, not after an in-flight
 // initial GET can already populate a different synthetic PIT-WAS fixture.
 await setup(page,false,current);
 await page.route("**/api/nhl-predictions**",route=>route.fulfill({json:current}));
 await page.route("**/api/nhl-count-research**",route=>route.fulfill({json:{
   schema:"NHL_APP_VERIFIED_SOG_COUNT_RESEARCH_V1",research_only:true,
   not_an_official_betting_board:true,game_date:futureDate,
   projected_count:1,projections:[{
     game_id:"2026020048",player_id:"8478864",player:"Kirill Kaprizov",
     team:"MIN",opponent:"CBJ",game_date:futureDate,
     scheduled_start:futureKickoff,mean:3.02,median:3,
     sd:1.4,p10:1,p90:6,forecast_horizon:"T24H",
     source_generated_at:originalGenerated,
     source_cutoff_at:originalCutoff,
     research_only:true,not_an_official_betting_prediction:true
   }]
 }}));
 await page.locator("#tab-btn-nhl").click();
 const games=page.getByTestId("unified-sport-game");
 await expect(games).toHaveCount(1);
 await expect(games.first()).toContainText("MIN vs CBJ");
 await games.first().locator('button[aria-expanded]').click();
 await expect(games.first().getByTestId("unified-predicted-stat")).toContainText("3 shots");
 await expect(games.first()).not.toContainText("OVER 0.5");
});

test("tennis serves match-winner model only and never restores unsupported totals",async ({page})=>{
 await setup(page);
 await page.locator("#tab-btn-tennis").click();
 await expect(page.getByTestId("unified-sport-board")).toBeVisible();
 const game=page.getByTestId("unified-sport-game").first();
 await expect(game).toContainText("Player Alpha vs Player Beta");
 await game.locator('button[aria-expanded]').click();
 await expect(game.getByTestId("unified-sport-projection")).toContainText("Player Alpha ML");
 await expect(game).not.toContainText("OVER 22.5");
 await expect(game).not.toContainText("24.2 games");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});

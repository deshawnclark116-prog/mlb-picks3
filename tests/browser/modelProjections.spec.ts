import {test,expect} from "@playwright/test";

const cfb={
 schema:"cfb-player-stat-projections-research-v1",research_only:true,official_new_betting_picks:0,
 original_run_id:38053736857, original_baseline_generated_at:"2026-10-10T12:30:00Z",
 forecast_count:1,monte_carlo_count:1,
 forecasts:[{game_id:"one",player_id:"123",player:"Alex Runner",team:"Alpha",opponent:"Beta",
  position:"RB",market:"rushing_yards",kickoff_utc:"2026-10-10T16:00:00Z",unit:"yards",
  baseline:{mean:61,median:60,last_three:[57,60,66]},
  monte_carlo:{mean:72,median:70,p10:35,p90:110,n_simulations:4000}}]
};
const rowFields=["game_id","player","team","opponent","game_date","mean","median","sd","p10","p25","p75","p90","p0","p_ge1","p_ge2","p_ge3","p_ge4","p_ge5"];
const nhl={
 schema:"nhl-v2-sog-nfl-style-shadow-v1",status:"RESEARCH_ONLY_NOT_VALIDATED_FOR_BETTING",
 horizons:["T90"],dates:["2026-10-07"],total_valid_forecasts:1,row_fields:rowFields,
 forecasts:{T90:[["nhl-game","Skater Example","PIT","WSH","2026-10-07",2.4,2,1.5,0,1,3,5,.15,.85,.65,.4,.2,.08]]}
};
async function setup(page:any,cfbFailed=false) {
 await page.route("**/api/**", route=>{
  const url=route.request().url();
  if(url.includes("/api/model-projections/cfb"))return route.fulfill(cfbFailed?{status:503,json:{error:"CFB research unavailable",details:"Original artifact missing"}}:{json:cfb});
  if(url.includes("/api/model-projections/nhl"))return route.fulfill({json:nhl});
  if(url.includes("/api/predictions"))return route.fulfill({json:[]});
  return route.fulfill({json:{picks:[],predictions:[],games:[]}});
 });
 await page.goto("/");
}
test("CFB model stats are primary, Monte Carlo labeled; legacy is explicit, no mobile overflow",async ({page})=>{
 await setup(page);
 await page.locator("#tab-btn-cfb").click();
 await expect(page.getByText("CFB PLAYER PROJECTIONS")).toBeVisible();
 await expect(page.getByText("Alex Runner")).toBeVisible();
 await expect(page.getByText("72.0", {exact:true})).toBeVisible();
 await expect(page.getByText("UNCALIBRATED MC")).toBeVisible();
 await expect(page.getByRole("button",{name:"Model stats"})).toHaveAttribute("aria-pressed","true");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
 await page.getByRole("button",{name:"Legacy picks"}).click();
 await expect(page.getByRole("button",{name:"Legacy picks"})).toHaveAttribute("aria-pressed","true");
 await expect(page.getByText("Alex Runner")).toHaveCount(0);
 await page.getByRole("button",{name:"Model stats"}).click();
 await expect(page.getByText("Alex Runner")).toBeVisible();
});
test("NHL shot-count forecast renders the model mean and horizon without fabricated sportsbook sides",async ({page})=>{
 await setup(page);await page.locator("#tab-btn-nhl").click();
 await expect(page.getByText("NHL PLAYER PROJECTIONS")).toBeVisible();
 await expect(page.getByText("Skater Example")).toBeVisible();
 await expect(page.getByText("2.4",{exact:true})).toBeVisible();
 await expect(page.getByText("40.0%",{exact:true})).toBeVisible();
 await expect(page.getByText(/Frozen historical player shot-count forecasts/)).toBeVisible();
 await expect(page.getByText(/OVER 2.5/)).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
test("missing model feed fails closed; no legacy auto-fallback",async ({page})=>{
 await setup(page,true);await page.locator("#tab-btn-cfb").click();
 await expect(page.getByRole("alert")).toContainText("Original artifact missing");
 await expect(page.getByText("Alex Runner")).toHaveCount(0);
 await expect(page.getByRole("button",{name:"Model stats"})).toHaveAttribute("aria-pressed","true");
});

"""Freeze the previously specified direct distribution model prospectively.

The chronological split, model parameters, and calibration are the same as
DISTRIBUTION V1. Persist the fitted objects so forecasts can be repeated
without retraining or optimizing against November outcomes.
"""
import argparse,concurrent.futures,datetime as dt,hashlib,json,os
from pathlib import Path
import joblib,numpy as np,sklearn
from nba_world.data import read,teams
from nba_world.distribution import build,fit,distribution,logit
from nba_world.prospective import now,source_schedule,roster,forecast
from nba_world.refresh import refresh
class DirectAdapter:
    def __init__(self,fitted):self.fitted=fitted
    def x(self,rows):
        # The shared forecast path appends action features; this arm was
        # trained exclusively on its independently built box state.
        n=self.fitted[0].n_features_in_
        x=np.stack([r["f"][:n] for r in rows])
        if x.shape[1]!=n:raise ValueError("feature schema mismatch")
        return x
    def predict(self,rows):
        x=self.x(rows);av,ac,mins,models,reg,cal,diag=self.fitted
        pa=ac.predict_proba(logit(av.predict_proba(x)[:,1])[:,None])[:,1]
        return pa,mins.predict(x),np.stack([m.predict(x) for m in reg],axis=1).clip(min=0)
    def survivals(self,rows):
        x=self.x(rows);models=self.fitted[3];cal=self.fitted[5]
        out=[]
        for j,m in enumerate(models):
            p=distribution(m,x,j)
            p=cal[j].predict_proba(logit(p.ravel())[:,None])[:,1].reshape(p.shape)
            if np.any(np.diff(p,axis=1)>1e-8):raise ValueError("calibrated distribution not monotone")
            out.append(p)
        return out
def main():
    p=argparse.ArgumentParser();p.add_argument("--games",action="append",required=True)
    p.add_argument("--out",required=True);p.add_argument("--checkpoint",required=True);p.add_argument("--reuse-checkpoint",action="store_true");a=p.parse_args()
    games=read(a.games);ck=Path(a.checkpoint)
    if a.reuse_checkpoint:
        # Only use a trusted artifact produced by this repository's workflow.
        saved=joblib.load(ck)
        if saved["schema"]!="NBA_WORLD_DISTRIBUTION_CHECKPOINT_V1" or saved["sklearn_version"]!=sklearn.__version__:
            raise ValueError("checkpoint schema/version")
        fitted=saved["fitted"];trn=saved["train_rows"];can=saved["calibration_rows"]
    else:
        tr=build(games,"2022-11-01","2026-02-01");ca=build(games,"2026-02-01","2026-04-15")
        trn=len(tr);can=len(ca)
        if trn<50000 or can<1000:raise ValueError("expanded history required")
        fitted=fit(tr,ca)
        saved={"schema":"NBA_WORLD_DISTRIBUTION_CHECKPOINT_V1","sklearn_version":sklearn.__version__,
             "train_rows":trn,"calibration_rows":can,"git_commit":os.getenv("GITHUB_SHA"),
             "source_hashes":{x:hashlib.sha256(Path(x).read_bytes()).hexdigest() for x in a.games},
             "fitted":fitted}
        joblib.dump(saved,ck,compress=3)
    games,ha=refresh(games,now().date()-dt.timedelta(days=1))
    schedule,sr=source_schedule();ids=sorted({t for g in schedule for t in teams(g)})
    rosters={};receipts={};errors={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        jobs={pool.submit(roster,t):t for t in ids}
        for f in concurrent.futures.as_completed(jobs):
            try:t,r,s=f.result();rosters[t]=r;receipts[t]=s
            except Exception as e:errors[jobs[f]]=str(e)
    forecasts,skipped=forecast(DirectAdapter(fitted),games,schedule,rosters,receipts,sr)
    out={"schema":"NBA_WORLD_PROSPECTIVE_FIRST_V1","model":"DISTRIBUTION_V1","research_only":True,"production_changed":False,
         "created_at":now().isoformat(),"git_commit":os.getenv("GITHUB_SHA"),"run_id":os.getenv("GITHUB_RUN_ID"),
         "train_rows":trn,"calibration_rows":can,"checkpoint_sha256":hashlib.sha256(ck.read_bytes()).hexdigest(),
         "training_source_hashes":saved["source_hashes"],"schedule_receipt":sr,"recent_history_refresh":ha,"roster_errors":errors,
         "games":forecasts,"skipped":skipped,"limitations":["not confirmed starters or injury availability","current roster membership only",
             "finite threshold support; unsupported own targets are not ranked","research only; no production changes"]}
    dst=Path(a.out);dst.write_text(json.dumps(out,indent=2,allow_nan=False))
    print("DIRECT_PROSPECTIVE_RECEIPT",json.dumps({"games":len(forecasts),"rows":sum(len(g["rows"]) for g in forecasts),
      "candidates":sum(r["candidate"] for g in forecasts for r in g["rows"]),"skipped":skipped,"roster_errors":errors,
      "injury_abstained_rows":sum(r["candidate"] and not r["injury_gated_candidate"] for g in forecasts for r in g["rows"]),
      "injury_errors":{g["game_id"]:g["injury_source_error"] for g in forecasts if g["injury_source_error"]},
      "checkpoint_sha256":out["checkpoint_sha256"],"forecast_sha256":hashlib.sha256(dst.read_bytes()).hexdigest()}),flush=True)
if __name__=="__main__":main()

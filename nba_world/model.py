"""Independent learned game-state encoder and physically constrained joint simulation."""
import numpy as np
import torch
from torch import nn
import torch.nn.functional as F
from nba_world.data import N,L,F as FEATURES,C

class World(nn.Module):
    def __init__(self,width=48):
        super().__init__()
        self.seq=nn.GRU(FEATURES,24,batch_first=True)
        self.embed=nn.Sequential(nn.Linear(24+7+C+3,width),nn.GELU(),nn.LayerNorm(width))
        layer=nn.TransformerEncoderLayer(width,4,96,.10,batch_first=True,norm_first=True,activation="gelu")
        self.interact=nn.TransformerEncoder(layer,2,enable_nested_tensor=False)
        self.out=nn.Linear(width,12)
    def forward(self,seq,extra,ctx,mask):
        b=seq.shape[0]
        _,hidden=self.seq(seq.reshape(-1,L,FEATURES))
        h=hidden[-1].reshape(b,2,N,-1)
        context=ctx[:,:,None,:].expand(-1,-1,N,-1)
        z=self.embed(torch.cat([h,extra,context],-1)).reshape(b,2*N,-1)
        z=self.interact(z,src_key_padding_mask=~mask.reshape(b,2*N)).reshape(b,2,N,-1)
        o=self.out(z)
        active=o[...,0]
        cap=torch.where(extra[...,-1]>.5,torch.full_like(active,240.),torch.full_like(active,48.))
        minutes=cap*torch.sigmoid(o[...,1])
        scales=torch.tensor([12.,8.,6.,3.,7.,6.],device=o.device)
        rates=F.softplus(o[...,2:8])*scales
        eff=torch.sigmoid(o[...,8:11])
        # final head predicts minutes dispersion in positive units
        msd=1.+8.*torch.sigmoid(o[...,11])
        return active,minutes,rates,eff,msd
def objective(pred,y,mask):
    a,m,r,e,sd=pred;act=y[...,0];played=mask&(act>0)
    if not played.any():raise ValueError("no played rows")
    av=F.binary_cross_entropy_with_logits(a[mask],act[mask])
    mn=y[...,1][played];mp=m[played];s=sd[played]
    # Robust minutes location plus heteroskedastic scale.
    ml=(torch.log(s)+.5*((mn-mp)/s).square()).mean()+.2*F.smooth_l1_loss(mp/6,mn/6)
    exposure=y[...,1:2].clamp_min(.01)/36
    counts=y[..., [2,3,4,8,9,10]]
    mu=(r*exposure).clamp_min(1e-5)
    rate=(mu-counts*torch.log(mu))[played].mean()
    att=y[...,2:5];makes=y[...,5:8]
    ep=e.clamp(.001,.999)
    eff=(-(makes*ep.log()+(att-makes).clamp_min(0)*(1-ep).log())[played]).sum()/att[played].sum().clamp_min(1)
    # Learn conditional count estimates too, not only rate likelihood.
    pmin=m[...,None]/36
    expected=r*pmin
    predpts=2*expected[...,0]*e[...,0]+3*expected[...,1]*e[...,1]+expected[...,2]*e[...,2]
    stat=torch.stack([predpts,expected[...,3]+expected[...,4],expected[...,5],expected[...,1]*e[...,1]],-1)
    actual=torch.stack([2*y[...,5]+3*y[...,6]+y[...,7],y[...,8]+y[...,9],y[...,10],y[...,6]],-1)
    sc=torch.tensor([8.,4.,3.,2.],device=y.device)
    err=F.smooth_l1_loss((stat/sc)[played],(actual/sc)[played])
    return av+ml+.40*rate+eff+.60*err
def batch(rows):
    return [torch.from_numpy(np.stack([r[k] for r in rows])) for k in ("seq","extra","ctx","mask","y")]
def train(train_rows,valid_rows,epochs=16,seed=625):
    torch.manual_seed(seed);torch.set_num_threads(2)
    rng=np.random.default_rng(seed)
    model=World();opt=torch.optim.AdamW(model.parameters(),lr=.0015,weight_decay=.015)
    best=None;bestloss=float("inf");trace=[]
    for epoch in range(epochs):
        model.train()
        idx=rng.permutation(len(train_rows))
        for start in range(0,len(idx),24):
            seq,ext,ctx,mask,y=batch([train_rows[i] for i in idx[start:start+24]])
            loss=objective(model(seq,ext,ctx,mask),y,mask)
            opt.zero_grad();loss.backward();nn.utils.clip_grad_norm_(model.parameters(),2.);opt.step()
        model.eval()
        with torch.no_grad():
            vals=[]
            for i in range(0,len(valid_rows),32):
                seq,ext,ctx,mask,y=batch(valid_rows[i:i+32]);vals.append(float(objective(model(seq,ext,ctx,mask),y,mask)))
        v=float(np.mean(vals));trace.append(v)
        print("WORLD_EPOCH",epoch+1,"validation_loss",round(v,5),flush=True)
        if v<bestloss:
            bestloss=v;best={k:x.detach().clone() for k,x in model.state_dict().items()}
    if best is None:raise ValueError("no finite checkpoint")
    model.load_state_dict(best);model.eval();return model,trace

def allocation(total,weights,rng):
    """Multinomial allocation with different player shares in each world."""
    w=np.maximum(weights,0.).astype(float);w[:,-1]+=1e-9
    tail=np.cumsum(w[:,::-1],axis=1)[:,::-1]
    left=np.asarray(total,dtype=int).copy();out=np.zeros_like(w,dtype=int)
    for i in range(w.shape[1]-1):
        p=np.divide(w[:,i],tail[:,i],out=np.zeros(len(w)),where=tail[:,i]>0)
        out[:,i]=rng.binomial(left,np.clip(p,0,1));left-=out[:,i]
    out[:,-1]=left
    return out
def minute_budget(weights,total,mask):
    """Exactly 5*game minutes; named players cannot exceed game length."""
    w=np.where(mask,np.maximum(weights,0),0.).astype(float)
    caps=np.broadcast_to(total[:,None]/5,w.shape).copy();caps[:,-1]=total
    free=mask.copy();free[:,-1]=True
    result=np.zeros_like(w);remaining=total.astype(float).copy()
    for _ in range(w.shape[1]+1):
        denom=np.where(free,w,0).sum(axis=1)
        # Reserve is an anonymous pool, not an athlete.
        w[:,-1]+=np.where(denom<=1e-12,1.,0.)
        denom=np.where(free,w,0).sum(axis=1)
        offer=np.divide(remaining[:,None]*np.where(free,w,0),denom[:,None],
                         out=np.zeros_like(w),where=denom[:,None]>0)
        hit=free&(offer>caps+1e-9)
        done=~hit.any(axis=1)
        result[done]+=offer[done];remaining[done]=0;free[done]=False
        result+=np.where(hit,caps,0.);remaining-=np.where(hit,caps,0.).sum(axis=1);free &= ~hit
        if np.max(remaining)<1e-7:break
    if np.max(np.abs(result.sum(axis=1)-total))>1e-5:raise ValueError("minute conservation")
    return result
def simulate(model,example,sims=3000,seed=1):
    rng=np.random.default_rng(seed)
    with torch.no_grad():
        seq,ext,ctx,mask,_=batch([example]);raw=model(seq,ext,ctx,mask)
        a,m,r,e,sd=[x[0].detach().numpy().astype(float) for x in raw]
    mask=example["mask"]
    # A shared game world: pace, overtime, and team-level role uncertainty.
    ot=rng.random(sims)<.06
    total=240.+25.*ot
    pace=np.exp(rng.normal(-.5*.065**2,.065,sims))
    minute=[];act=[];shots=[];made=[];rate=[]
    for t in range(2):
        common=rng.normal(0,.22,(sims,1));p=1/(1+np.exp(-np.clip(a[t]+common,-20,20)))
        playing=(rng.random((sims,N))<p)&mask[t]
        playing[:,-1]=True # reserve can receive otherwise unallocated minutes
        w=np.maximum(.02,m[t]+rng.normal(0,sd[t],(sims,N)))*playing
        w[:,-1]*=(rng.random(sims)<p[:,-1])
        mn=minute_budget(w,total,playing)
        minute.append(mn);act.append(mn>.05)
        intensity=mn[:,:,None]*r[t]/36*pace[:,None,None]
        intensity*=np.exp(rng.normal(-.5*.12**2,.12,(sims,N,1)))
        rate.append(intensity)
        attempts=[]
        for k in range(3):
            budget=rng.poisson(intensity[:,:,k].sum(axis=1))
            attempts.append(allocation(budget,intensity[:,:,k],rng))
        attempts=np.stack(attempts,axis=-1);shots.append(attempts)
        made.append(rng.binomial(attempts,np.clip(e[t],.01,.99)))
    reb=[np.zeros((sims,N),int),np.zeros((sims,N),int)]
    assists=[np.zeros((sims,N),int),np.zeros((sims,N),int)]
    for t in range(2):
        other=1-t
        miss=(shots[t][:,:,:2]-made[t][:,:,:2]).sum(axis=(1,2))
        ftmiss=(shots[t][:,:,2]-made[t][:,:,2]).sum(axis=1)
        # Terminal free throws are approximated; not every miss creates a board.
        chances=rng.binomial(miss,.96)+rng.binomial(ftmiss,.45)
        ow=rate[t][:,:,3];dw=rate[other][:,:,4]
        share=ow.sum(axis=1)/np.maximum(ow.sum(axis=1)+dw.sum(axis=1),1e-8)
        offensive=rng.binomial(chances,np.clip(share,.05,.50))
        reb[t]+=allocation(offensive,ow,rng)
        reb[other]+=allocation(chances-offensive,dw,rng)
        fgm=made[t][:,:,:2].sum(axis=2);aw=rate[t][:,:,5]
        ratio=np.clip(aw.sum(axis=1)/np.maximum(fgm.sum(axis=1),1),0,.85)
        # At most one assist per made field goal, never a self-assist.
        for shooter in range(N):
            n=rng.binomial(fgm[:,shooter],ratio)
            weights=aw.copy();weights[:,shooter]=0.
            n=np.where(weights.sum(axis=1)>1e-9,n,0)
            if shooter==N-1:
                # Anonymous reserve may contain several real players; avoid
                # assigning its own made basket an anonymous assist.
                tail=weights[:,:-1]
                assists[t][:,:-1]+=allocation(n,tail,rng)
            else:
                assists[t]+=allocation(n,weights,rng)
        if np.any(assists[t].sum(axis=1)>fgm.sum(axis=1)):raise ValueError("assist conservation")
    result=[]
    for t in range(2):
        points=2*made[t][:,:,0]+3*made[t][:,:,1]+made[t][:,:,2]
        stats=np.stack([points,reb[t],assists[t],made[t][:,:,1]],axis=-1)
        result.append(dict(minutes=minute[t],active=act[t],stats=stats,attempts=shots[t],made=made[t]))
    return result

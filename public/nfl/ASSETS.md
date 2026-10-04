# NFL poster asset provenance and ingestion

## Team marks

The 32 transparent PNGs were bundled from ESPN's public team-logo CDN
(`https://a.espncdn.com/i/teamlogos/nfl/500/{team}.png`), resized to fit
384 × 384. Local bundling prevents runtime dependence on ESPN's CDN.
Source/provenance is documented; CDN availability does **not** establish a
redistribution or commercial license. Team marks remain their owners' marks.
No claim that these logos are freely licensed is made here.

## Original atmosphere and generic heroes

`src/components/NflPosterArtwork.tsx` contains original hand-authored SVG
football equipment/shadow figures and geometric scene primitives. They are
not photographs, traced stadium art, real-player likenesses, or exact stadium
replicas. Anonymous figures use team-colored jerseys, helmets, and shadow
lighting, with no real face or identifying jersey number. Their labels explicitly
say they do not depict the featured real players. Featured names are selected
from eligible SYSTEM candidates; decorative art never influences picks.

`src/nfl/cityAtmosphere.ts` maps every NFL home team to a named-city treatment:
skylines, mountains, bridges, coastlines, palms, arches, rivers, or a capitol,
combined with original field geometry and stadium lights. The Chicago SVG is
also original stylized artwork. Unknown teams use abstract branding.
CLEAN omits player figures and heavy city artwork.

## Licensed real cutouts

No licensed real-player cutouts have been supplied. Production PREMIUM uses
original anonymous figures until verified local imagery exists. Resolution:
verified local cutout → generic team-colored figure → logo-forward layout
(if there are no eligible featured identities).

Featured identities are the top two unique players per team from the full
eligible SYSTEM pool, using existing compareSystem ranking. Keys normalize
names consistently across teams/outcomes: `D’Andre Swift` → `dandre-swift`.
No manual per-game player-name lists exist. Name-key collisions must be reviewed
when ingesting (the source forecast schema does not expose a separate player ID).

To ingest **already licensed, local** transparent PNG/WebP files, from repo root:

```
node --import tsx scripts/ingestNflPlayer.ts --name "Player Name" \
  --file /path/to/licensed-cutout.webp --source "Supplier / asset identifier" \
  --permission "Permission document / license and permitted use" --approved
```

`--approved` is the operator's explicit attestation that permission for intended
redistribution/commercial use has been reviewed; the script cannot establish
legal rights itself. It performs no network retrieval. Record the actual
permission basis, not a CDN URL alone. Keep source/license documents in the
appropriate authorized asset records. Optimize transparent images below 5 MB.

The script validates format, sanitizes the stable key, rejects overwrites unless
`--replace`, copies to `/nfl/players/<key>.png|webp`, and updates both
`players/manifest.json` and `src/nfl/licensedPlayerAssets.ts`. Commit all three.
The renderer accepts only local assets with a verified provenance entry.
Missing or transiently failed cutouts use anonymous figures, never invented
real likenesses. Successes may be cached; failures are evicted and RETRY IMAGE
rechecks local assets before preparing a new PNG.

Theme filenames include `premium` or `clean`. Export remains 1080 × 1350.

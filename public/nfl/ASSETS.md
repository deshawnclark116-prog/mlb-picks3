# NFL poster assets

The 32 transparent team PNGs were bundled from ESPN's public team-logo CDN
(`https://a.espncdn.com/i/teamlogos/nfl/500/{team}.png`) and resized to fit
384 × 384. Posters make no runtime requests to that CDN. Logos retain their
respective team identities; they are not Prop Edge artwork.

`art/chicago-night.svg` is original, stylized Chicago skyline artwork, not a
stadium photograph. Other matchups fall back to abstract field/light artwork.

No player imagery is shipped or fabricated in v1. Add licensed transparent
cutouts under `/nfl/players/`, then configure `POSTER_ASSETS.games[game_id]`
in `src/nfl/posterAssets.ts` with `{players:[{team,name,src}]}` and an optional
`background` path. The renderer supports up to two cutouts per team, zero to
four total, without influencing picks. Optional paths must remain local.
Missing assets are omitted before export; missing logos use team initials.
Theme configuration is in `src/nfl/posterTheme.ts`.

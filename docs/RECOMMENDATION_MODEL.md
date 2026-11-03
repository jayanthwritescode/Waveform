# Browser recommendation model v1

This static engine supersedes the historical Python and collaborative models. It is a deterministic metadata ranker with editorial context heuristics, not trained ML or a claim about musical emotion.

## Candidates

Mood/activity mappings in `frontend/js/recommender/context.js` construct two differently grouped MusicBrainz recording tag queries. An optional seed artist/song adds targeted searches (at most three total, 60 records each). We combine responses before ranking. Regeneration changes bounded query offsets and adds deterministic seeded tie variation. A verified 208-record fallback supplements insufficient/live-failed candidate pools and is clearly labeled. Exclusions remain applied even if that causes a shortfall; results are never padded with invented tracks.

## Scores

Default weights: genre .35, context .25, explicit user preference .20, artist .10, discovery .10. Components lie in [0,1]. Missing components have no weight; the remaining weights are normalized to sum to one. The displayed score is a ranking utility, never confidence, relevance accuracy or a probability.

- Genre: fraction of selected (or saved favorite) genres matched by exact normalized source genre/tags.
- Context: average of source tag overlap with the mood/activity mapping (up to two matching tags) and, where available, closeness of a documented genre energy proxy to the requested energy. Energy proxies are editorial constants, never written to track metadata as measured audio properties.
- Preference: available explicit like, saved genre overlap, and source instrumental/vocal tags. Missing instrumental tags are unknown; classical does not automatically mean instrumental.
- Artist: exact normalized match to selected/favorite/seed artists, available only when those preferences and artist credits exist.
- Discovery: preference-controlled value for artists outside versus inside explicit favorites/liked artist labels. This is not listening history or population popularity.

Every positive explanation corresponds to an available component. Detailed contributions and redistributed weights remain attached to tracks; missing signals are named. Unknown audio energy/valence/tempo/instrumentalness stay unknown. The saved energy range midpoint supplies the initial Vibe energy setting before any generation settings exist; the current Vibe slider then drives the energy proxy directly.

## Selection and replacement

Dislikes, excluded IDs and exact normalized excluded genre/tags remove candidates. First deduplicate stable recording IDs; then conservatively suppress same-artist/same-base-title remaster/live/explicit-version variants. Identical song titles by different artists are distinct. Cross-provider crosswalks are not guessed. Version suppression is heuristic and may occasionally merge a legitimate version; search still exposes distinct records.

Sort by score and stable ID. Greedy selection subtracts configurable artist/primary-genre repetition penalties. A hard limit of three tracks per credited artist (two at high variety) prevents excessive repetition. Select 10/20/30 or report the actual shortfall. Keep a reserve for replacements that checks existing IDs, work keys and artist limits. Regeneration uses fixed-hash variation, retaining preferences. It does not promise an entirely disjoint playlist.

Local history stores the last ten genuine nonempty generation snapshots, separate from manual drafts, saves or listening. Source coverage and metadata density limit relevance; no quality/accuracy benchmark for this browser model is claimed. Historical Last.fm evaluation is archived and excluded from the active UI.

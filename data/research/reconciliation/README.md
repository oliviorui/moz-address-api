# Batch reconciliation

This folder contains generated comparison reports between historical MozGIS / INE snapshots and the current canonical dataset.

## Maputo Province

Run:

```bash
npm run data:reconcile:maputo
```

Inputs:

- `data/research/mozgis/localities-2017-maputo.json`, when available;
- otherwise `data/research/mozgis/localities-2017-mozambique.json`;
- `data/current/districts.json`;
- `data/current/administrative-posts.json`;
- `data/coverage/maputo-province.json`.

Outputs:

- `maputo-mozgis-2017-comparison.json`
- `maputo-locality-candidates.json`

A district marked `READY_FOR_REVIEW` has:

1. the same locality count in MozGIS 2017 and the current expected target;
2. all source administrative posts mapped uniquely to canonical post IDs;
3. a complete set of generated candidate locality records.

`READY_FOR_REVIEW` does **not** automatically mean the 2017 names are current. It means that district can be reviewed quickly as a batch instead of locality-by-locality.

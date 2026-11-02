# Batch reconciliation

This folder contains generated comparison reports between historical MozGIS / INE snapshots and the current canonical dataset.

## Current workflow

Run:

```bash
npm run data:reconcile -- <province-slug>
```

Inputs:

- `data/research/reconciliation/config/<province-slug>.json`;
- `data/research/mozgis/localities-2017-mozambique.json`;
- `data/current/districts.json`;
- `data/current/administrative-posts.json`.

Output:

- `<province-slug>-diagnostic.json`

Configurations currently exist for Cabo Delgado, Manica, Tete and Zambézia.

Verified districts can then be promoted with:

```bash
npm run data:promote -- <province-slug>
```

## Maputo Province

The `maputo-*` reports were produced by dedicated tooling that was removed once the province was complete. They are kept as evidence.

A district marked `READY_FOR_REVIEW` in those reports has:

1. the same locality count in MozGIS 2017 and the current expected target;
2. all source administrative posts mapped uniquely to canonical post IDs;
3. a complete set of generated candidate locality records.

`READY_FOR_REVIEW` does **not** automatically mean the 2017 names are current. It means that district can be reviewed quickly as a batch instead of locality-by-locality.

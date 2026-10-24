# Contributing to moz-address-api

Thanks for helping improve Mozambique's administrative location data.

## The simple rule

If you want to add or correct a locality or neighborhood, start with its province:

```text
data/current/by-province/<province>/
```

Then edit one of:

```text
localities.json
neighborhoods.json
```

Source references for those records live under:

```text
data/sources/by-province/<province>/
├── locality-references.json
└── neighborhood-references.json
```

## Preferred sources

Use the strongest current source available:

1. Instituto Nacional de Estatística (INE)
2. Government or legal publications
3. Municipal authorities
4. Other authoritative administrative sources

Historical datasets may help with reconciliation, but historical names must not be promoted as current data without current evidence.

## Do not

- invent a locality or neighborhood just to make a count reach 100%;
- copy unverified lists from random websites;
- change an existing stable ID without a strong reason;
- place research candidates directly in canonical files;
- encode research status such as `confirmed`, `exact` or `reconciled` in canonical filenames.

## Research and unresolved cases

Use:

```text
data/research/
data/issues/
data/coverage/
```

for historical evidence, diagnostics, unresolved conflicts and coverage tracking.

## Before opening a pull request

Run:

```bash
npm run data:validate
npm run typecheck
npm run test:all
```

Data changes should preserve referential integrity and include source provenance.

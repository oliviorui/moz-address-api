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

Each reference states what the source supports:

```json
{
  "localityId": "locality_maputo_magude_example",
  "sourceId": "boletim-republica-magude-2024",
  "supports": "NAME",
  "page": "12",
  "notes": "Listed under its administrative post in the territorial table."
}
```

- `NAME`: the source lists this record's name.
- `COUNT`: the source confirms only how many records exist.

Every record needs at least one `NAME` reference. Mark a source `isHistorical` in `data/sources/sources.json` when its names may no longer be current. The dataset derives each record's `nameEvidence` from these values.

If your change fills a gap, update the province file under `data/coverage/by-province/`. Validation fails while a known gap is unexplained.

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

Data-only changes can be checked without a database:

```bash
npm run data:validate
```

For code changes, follow the development setup in the README, then run:

```bash
npm run data:validate
npm run lint
npm run typecheck
npm run test:all
```

Data changes should preserve referential integrity and include source provenance.

## Licensing of contributions

By contributing, you agree that your code is licensed under the MIT License and your data contributions under CC BY 4.0. Only submit data you are allowed to share. See [DATA_LICENSE.md](DATA_LICENSE.md).

## Releasing

1. Update the version in `package.json` and `package-lock.json`, and add the date to `CHANGELOG.md`.
2. Merge the changes into `main`.
3. Tag `main` as `v<version>` and push the tag. The release workflow validates the data and publishes the export as a GitHub release.

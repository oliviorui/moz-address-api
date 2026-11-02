# Coverage

`by-province/<province>.json` records the verified targets for each province and explains why any records are missing. Loaded counts are not stored here: they are always computed from the canonical data.

`npm run data:validate` fails when:

- a province has no coverage file;
- a `COMPLETE` province has missing records;
- a `PARTIAL` province has no gaps;
- the blockers do not add up to the number of missing records;
- a layer has no verified target (`null`) and no blocker explaining why;
- a district differs from its target and no blocker names it.

The API serves these figures at `GET /api/v1/coverage`.

## File format

```json
{
  "provinceId": "prov_04",
  "province": "Zambézia",
  "status": "PARTIAL",
  "sourceIds": ["ine-zambezia-province-yearbook-2024"],
  "expected": {
    "administrativePosts": 54,
    "localities": 191,
    "neighborhoods": 128
  },
  "blockers": [
    {
      "code": "POST_RECONCILIATION_REQUIRED",
      "layer": "localities",
      "districts": ["Namacurra", "Nicoadala"],
      "missing": 13,
      "note": "Why these records cannot be promoted yet."
    }
  ],
  "notes": [],
  "districts": [
    {
      "districtId": "dist_zambezia_namacurra",
      "district": "Namacurra",
      "expected": { "localities": 9, "neighborhoods": 0 }
    }
  ]
}
```

Use `null` for a target that cannot be verified, never a guess. `districts` is optional and lists the district targets that are known.

## Status

- `COMPLETE`: every tracked layer has reached its verified target.
- `PARTIAL`: records are missing or a target is unknown, and blockers explain why.

A complete province means that the counts match. It does not mean that every name is current: see `nameEvidence` in the main README.

## Blocker codes

- `BLOCKED_ON_OFFICIAL_SOURCE_EXTRACTION`: a current official source has been identified, but its table of names has not been safely extracted and reconciled.
- `BLOCKED_ON_OFFICIAL_SOURCE_CONFLICT`: current official sources disagree on counts, names or hierarchy.
- `MISSING_COMPLETE_CURRENT_NOMINAL_LIST`: a current count exists, but no complete authoritative list of names has been found.
- `POST_RECONCILIATION_REQUIRED`: historical records use administrative posts that are not in the current structure, so their parent is not established.
- `BLOCKED_WITH_DISTRICT_NEIGHBORHOODS`: the locality counts match, but the district was reconciled as a whole and is held back by its neighborhood layer.

## Release policy

A documented gap does not block a release.

A release is blocked by:

- invalid canonical data;
- broken hierarchy or foreign keys;
- duplicate canonical records;
- failing validation, seed, typecheck, build or integration tests;
- unexplained coverage gaps.

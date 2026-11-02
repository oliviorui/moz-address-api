# Changelog

This project follows [Semantic Versioning](https://semver.org/).

## Unreleased

### Added

- The address of the public API in the README.

### Fixed

- `GET /api/v1/coverage` reported national layers as `COMPLETE` at 100% while province coverage had not been loaded. Their target is now unknown until it has.

## 1.1.0 - 2026-11-02

To upgrade an existing installation, run `npm install`, `npm run db:generate`, `npm run db:deploy` and `npm run db:seed`.

### Added

- `nameEvidence` on localities and neighborhoods, showing whether a current source lists the name or only confirms the record count, and a filter for it on `GET /api/v1/localities`.
- `supports` on locality and neighborhood source references, and `isHistorical` on sources.
- Per-province figures, blockers and evidence totals in `GET /api/v1/coverage`.
- `GET /health/ready`, which checks the database.
- `Cache-Control`, weak `ETag` and `304` responses on the API, and response compression.
- `TRUST_PROXY` and `CACHE_MAX_AGE_SECONDS` settings.
- `Dockerfile`, a Docker Compose `app` profile and a Render blueprint.
- `npm run data:export`, with JSON and CSV files attached to each GitHub release.
- The attribution notice required by the INE Open Data License Agreement, and a data license.
- Security policy, code of conduct, issue and pull request templates, Dependabot and ESLint.

### Changed

- Search ignores accents, case and punctuation.
- `npm run db:seed` removes all records and source links that are not in the canonical files.
- Coverage files moved to `data/coverage/by-province/` and use a single format.
- Validation fails on unexplained coverage gaps, records whose name no source lists, and unreferenced sources.
- `src/generated/` is no longer tracked. Run `npm run db:generate` after cloning.

### Fixed

- The OpenAPI document and `/docs` listed no routes.
- `GET /` reported version `0.1.0`.
- Unexpected errors exposed internal query details. They now return a generic `INTERNAL_SERVER_ERROR`.
- Very large `page` values returned `500`. They now return `400 INVALID_PAGE`.
- `verifiedAt` recorded the seed time instead of a review date. It is `null` until review dates are recorded.
- The server now closes cleanly on `SIGTERM` and `SIGINT`.

### Corrected data claims

- Nampula is partial, not complete: INE 2024 reports 63 neighborhoods and 22 are loaded.
- The 41 missing Zambézia localities are now documented.

## 1.0.0 - 2026-10-24

First release.

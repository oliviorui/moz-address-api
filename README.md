# 🇲🇿 moz-address-api

[![CI](https://github.com/oliviorui/moz-address-api/actions/workflows/ci.yml/badge.svg)](https://github.com/oliviorui/moz-address-api/actions/workflows/ci.yml)
[![Code license: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Data license: CC BY 4.0](https://img.shields.io/badge/data-CC%20BY%204.0-blue.svg)](DATA_LICENSE.md)

Open-source REST API and canonical dataset for Mozambique's administrative divisions.

The project provides structured, source-aware location data for applications such as e-commerce, logistics, delivery systems, address forms, ERPs, CRMs, fintech and public-sector software.

This is an independent project, not an official publication. The dataset is incomplete and most names come from historical sources, so read [Coverage](#coverage) and [How far to trust a name](#how-far-to-trust-a-name) before relying on it. See the [changelog](CHANGELOG.md) for changes.

### Current canonical dataset

- **11** province/top-level records
- **161** districts
- **443** administrative posts
- **1080** localities
- **314** neighborhoods

Canonical locality and neighborhood data is organized by province under `data/current/by-province/`. Machine-generated aggregate files are created by `npm run data:build` and are not edited manually.

## Coverage

The project does **not** invent administrative records to force 100% coverage.

Where current official sources conflict, provide aggregate counts without complete nominal lists, or cannot yet be reconciled safely, the gap remains documented instead of being guessed.

Records loaded against the verified targets:

| Province | Status | Administrative posts | Localities | Neighborhoods |
| --- | --- | ---: | ---: | ---: |
| Cabo Delgado | Partial | 56 / 56 | 131 / 131 | 13 / unknown |
| Cidade de Maputo | Complete | 0 / 0 | 0 / 0 | 63 / 63 |
| Gaza | Partial | 50 / 50 | 95 / 119 | 24 / 56 |
| Inhambane | Complete | 26 / 26 | 70 / 70 | 40 / 40 |
| Manica | Complete | 37 / 37 | 97 / 97 | 43 / 43 |
| Maputo | Complete | 29 / 29 | 76 / 76 | 42 / 42 |
| Nampula | Partial | 72 / 72 | 171 / 171 | 22 / 63 |
| Niassa | Partial | 45 / 45 | 74 / 97 | 22 / 22 |
| Sofala | Complete | 38 / 38 | 89 / 89 | 36 / 36 |
| Tete | Complete | 36 / 36 | 127 / 127 | 9 / 9 |
| Zambézia | Partial | 54 / 54 | 150 / 191 | 0 / 128 |
| **Total** | | **443 / 443** | **1080 / 1168** | **314 / unknown** |

`GET /api/v1/coverage` reports the same figures with the reason for each gap. They are also recorded under `data/coverage/by-province/`, and validation fails if a known gap is not explained. See `data/coverage/README.md`.

## How far to trust a name

Reaching a target only shows that the **number** of records matches. For most records, the name itself comes from an older source.

Each locality and neighborhood has a `nameEvidence` value:

| Value | Meaning | Records |
| --- | --- | ---: |
| `CURRENT_SOURCE` | A current source lists this name. | 208 |
| `HISTORICAL_SOURCE_COUNT_CONFIRMED` | The name comes from a historical source, mainly the INE/MozGIS 2017 layer. A current source confirms only the number of records in the district. | 1186 |
| `HISTORICAL_SOURCE_ONLY` | The name comes from a historical source with no current confirmation. | 0 |

A name, spelling or parent may therefore have changed since the source was published, even in a province marked complete. Check `nameEvidence` if your application depends on current names, or filter with `GET /api/v1/localities?nameEvidence=CURRENT_SOURCE`.

The detail routes also show, for each source, whether it `supports` the `NAME` or only the `COUNT`, and whether the source `isHistorical`. The `verifiedAt` field stays `null` because review dates are not recorded yet.

## Administrative model

The primary hierarchy is:

```text
Mozambique
└── Province / Cidade de Maputo
    └── District
        └── Administrative Post
            └── Locality
```

Urban data may also include neighborhoods. Where the official hierarchy is ambiguous or a municipality publishes neighborhoods independently of state administrative posts, the dataset can preserve district-level neighborhoods without inventing a parent administrative post.

## Public API

A public instance runs at **https://moz-address-api.onrender.com** ([interactive documentation](https://moz-address-api.onrender.com/docs)).

It runs on free hosting with no uptime guarantee: after a period without requests, the next one can take 30 seconds or more. For production use, cache responses, [download the dataset](#download-the-dataset) or run your own instance.

## API

Default API prefix:

```text
/api/v1
```

Core resources:

```http
GET /api/v1/provinces
GET /api/v1/provinces/:identifier
GET /api/v1/provinces/:identifier/districts

GET /api/v1/districts
GET /api/v1/districts/:identifier

GET /api/v1/administrative-posts
GET /api/v1/localities
GET /api/v1/sources

GET /api/v1/search
GET /api/v1/tree
GET /api/v1/coverage
```

District routes also expose related administrative posts, localities and neighborhoods where available.

For the complete live route contract, use the generated OpenAPI documentation.

## OpenAPI / Swagger

When the server is running:

```text
http://localhost:3333/docs
```

The API publishes an OpenAPI 3.1 specification through Fastify Swagger. The raw document is available at `/docs/json`.

## Search

Global search covers:

- provinces
- districts
- administrative posts
- localities
- neighborhoods

Example:

```http
GET /api/v1/search?q=matola
```

Accents, case and punctuation do not matter, so `Chokwe` finds `Chókwè` and `Xai Xai` finds `Xai-Xai`. List routes apply the same matching to their `q` filter.

## Download the dataset

You can use the data without running the API. Each [GitHub release](https://github.com/oliviorui/moz-address-api/releases) includes a zip file with UTF-8 JSON and CSV files for provinces, districts, administrative posts, localities and neighborhoods with their full hierarchy, sources and coverage.

To create the same files locally in `release/`:

```bash
npm run data:export
```

## Run with Docker

Start the API, a PostgreSQL database and a one-off job that applies the migrations and seeds the data:

```bash
docker compose --profile app up --build
```

The API is then available at `http://localhost:3333`. This setup uses the default database password and is meant for local use.

## Tech stack

- Node.js 24+
- TypeScript
- Fastify 5
- PostgreSQL
- Prisma 7
- Zod
- OpenAPI / Swagger
- Docker and Docker Compose
- Node test runner through `tsx --test`
- GitHub Actions

## Project structure

```text
moz-address-api/
├── data/
│   ├── current/
│   │   ├── provinces.json
│   │   ├── districts.json
│   │   ├── administrative-posts.json
│   │   └── by-province/
│   │       └── <province>/
│   │           ├── localities.json
│   │           └── neighborhoods.json
│   ├── sources/
│   │   ├── sources.json
│   │   └── by-province/
│   │       └── <province>/
│   │           ├── locality-references.json
│   │           └── neighborhood-references.json
│   ├── coverage/
│   │   └── by-province/
│   │       └── <province>.json
│   ├── issues/
│   └── research/
├── prisma/
├── scripts/
├── src/
├── tests/
├── CHANGELOG.md
├── CONTRIBUTING.md
├── DATA_LICENSE.md
├── Dockerfile
└── README.md
```

### Human-edited vs generated data

Contributors edit the canonical province files under `data/current/by-province/` and their source references under `data/sources/by-province/`.

`npm run data:build` compiles those files into `data/generated/` for validation and database seeding. Generated files are ignored by Git and must not be edited manually.

The Prisma client under `src/generated/` is also generated and ignored by Git. Create it with `npm run db:generate`.

## Data principles

Canonical records must be backed by verifiable evidence.

Preferred sources include:

1. Instituto Nacional de Estatística (INE)
2. Government / legal publications
3. Municipal authorities
4. Other authoritative administrative sources

Historical MozGIS/INE names are promoted only when the district's record count and hierarchy reconcile with current official figures, and they stay marked as historical through `nameEvidence`.

The project intentionally distinguishes:

- canonical data
- historical/research data
- source metadata
- unresolved issues
- coverage status

## Development

Clone and install:

```bash
git clone https://github.com/oliviorui/moz-address-api.git
cd moz-address-api
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Start PostgreSQL with Docker if desired:

```bash
docker compose up -d
```

Generate the Prisma client, apply the migrations and seed the database:

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
```

Run development server:

```bash
npm run dev
```

Default server:

```text
http://localhost:3333
```

Health endpoints:

```http
GET /health
GET /health/ready
```

`/health` confirms that the API process is responding. `/health/ready` also checks the database and returns `503` when it cannot be reached.

## Running in production

Build the API, prepare the database and start the compiled server:

```bash
npm ci --include=dev
npm run build
npm run db:deploy
npm run db:seed
npm start
```

`DATABASE_URL` must be set for all of these steps, and `NODE_ENV` should be `production`. The server finishes in-flight requests and closes its database connections when it receives `SIGTERM` or `SIGINT`.

The `Dockerfile` builds an image that contains only what the API needs to run. Its `setup` target has the tools for migrations and seeding.

Responses are compressed, and successful API responses include `Cache-Control` and an `ETag`, so clients can reuse them and receive `304 Not Modified` when nothing has changed. Reduce `CACHE_MAX_AGE_SECONDS` if you re-seed often.

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | Address the server binds to. |
| `PORT` | `3333` | Port the server listens on. |
| `DATABASE_URL` | none | PostgreSQL connection string. Required. |
| `CORS_ORIGIN` | `*` | Allowed browser origins, as a comma-separated list. |
| `TRUST_PROXY` | `false` | The proxies to trust for the client address: a comma-separated list of IPs/CIDRs, or the number of proxies. |
| `CLIENT_IP_HEADER` | none | A header with the client address, set by a CDN in front of the API. Takes priority over `TRUST_PROXY`. |
| `RATE_LIMIT_MAX` | `120` | Maximum requests per client during the window. |
| `RATE_LIMIT_WINDOW` | `1 minute` | Rate-limit window. |
| `CACHE_MAX_AGE_SECONDS` | `3600` | How long clients may reuse a successful API response. |

Set `TRUST_PROXY` when the API runs behind a reverse proxy; otherwise all clients are counted as one and share a single rate limit. If the proxy IPs change, as on most hosting platforms, use the number of proxies (usually `1`), but only if clients cannot reach the API directly. Avoid `true`: clients can then forge `X-Forwarded-For` and bypass the rate limit.

To confirm the setting, find a request of yours in the logs: its `remoteAddress` is the address used for the rate limit and should be your public IP, not `127.0.0.1` or a proxy. If it is not, use `CLIENT_IP_HEADER` with the header your CDN sets. Use it only if clients cannot reach the API directly and the CDN overwrites the header.

### Deploying to Render and Neon

`render.yaml` describes the API as a Docker service on [Render](https://render.com), using a [Neon](https://neon.com) PostgreSQL database.

1. Create a Neon project, ideally in a European region near Render's Frankfurt region, and copy its **direct** connection string (not the pooled one).
2. Apply the migrations and load the data from your computer:

   ```bash
   DATABASE_URL="<neon-connection-string>" npm run db:deploy
   DATABASE_URL="<neon-connection-string>" npm run db:seed
   ```

3. In Render, create a Blueprint from this repository and set `DATABASE_URL` when asked.
4. Check `GET /health/ready`. Then confirm the rate limit: in the service logs, the `remoteAddress` of your own request should be your public IP. Repeat a request with different `True-Client-IP` values, and `x-ratelimit-remaining` should keep falling. If it does not, clients can forge the header, so remove `CLIENT_IP_HEADER` and look for another way to identify them.

On free plans, the service sleeps when idle, so the first request after a pause can take 30 seconds or more. Run the seed again after each data release.

## Validation and tests

Build machine-readable aggregates:

```bash
npm run data:build
```

Dataset validation (builds first automatically):

```bash
npm run data:validate
```

Linting and type checking:

```bash
npm run lint
npm run typecheck
```

Build:

```bash
npm run build
```

Smoke tests (need `DATABASE_URL` to be set and the Prisma client to be generated, but make no database queries):

```bash
npm test
```

Integration tests (need a migrated and seeded database):

```bash
npm run test:integration
```

All tests:

```bash
npm run test:all
```

## Data reconciliation tools

Reconcile one province without modifying canonical data:

```bash
npm run data:reconcile -- <province-slug>
```

Promote verified reconciled records:

```bash
npm run data:promote -- <province-slug>
```

These tools are designed to keep historical/research material separate from canonical records until structural checks pass.

## Database

Prisma is used for PostgreSQL persistence and query operations.

Useful commands:

```bash
npm run db:generate
npm run db:migrate # create a migration during development
npm run db:deploy  # apply existing migrations
npm run db:seed
npm run db:studio
```

`npm run db:seed` makes the database match the canonical files, so it **removes** any provinces, districts, administrative posts, localities, sources and source links that are not in them. Do not store your own records in these tables.

## Contributing

Contributions are welcome for:

- missing or corrected administrative data
- updated official sources
- API improvements
- tests
- documentation
- reconciliation rules

Administrative data contributions should include an authoritative source whenever possible.

Do not submit inferred locality or neighborhood names merely to make coverage totals match.

## License

Source code is licensed under the [MIT License](LICENSE).

The dataset is licensed under [CC BY 4.0](DATA_LICENSE.md), and its sources keep their own terms. If you redistribute the data, keep the attribution and the INE notice in [DATA_LICENSE.md](DATA_LICENSE.md).

## Why this project?

Mozambican applications repeatedly need reliable address hierarchy data. Instead of each project maintaining a different inconsistent list, `moz-address-api` provides a reusable, inspectable and source-aware foundation.

If the project is useful, contributions, corrections and repository stars are welcome.

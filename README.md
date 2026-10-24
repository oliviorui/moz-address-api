# 🇲🇿 moz-address-api

Open-source REST API and canonical dataset for Mozambique's administrative divisions.

The project provides structured, source-aware location data for applications such as e-commerce, logistics, delivery systems, address forms, ERPs, CRMs, fintech and public-sector software.

## v1.0.0

Version 1.0.0 establishes a stable API, canonical administrative hierarchy, PostgreSQL persistence, source provenance, dataset validation and explicit coverage reporting.

### Current canonical dataset

- **11** province/top-level records
- **161** districts
- **443** administrative posts
- **1080** localities
- **314** neighborhoods

Canonical locality and neighborhood data is organized by province under `data/current/by-province/`. Machine-generated aggregate files are created by `npm run data:build` and are not edited manually.

## Coverage policy

The project does **not** invent administrative records to force 100% coverage.

Where current official sources conflict, provide aggregate counts without complete nominal lists, or cannot yet be reconciled safely, the gap remains documented instead of being guessed.

### Complete or effectively complete for v1

- Maputo
- Cidade de Maputo
- Nampula
- Sofala
- Inhambane
- Tete
- Manica

### Accepted partial coverage for v1

- Niassa
- Gaza
- Zambézia
- Cabo Delgado

Detailed coverage and blocker information is stored under:

```text
data/coverage/
data/issues/
```

See `data/coverage/README.md` for the release coverage policy.

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

The API publishes an OpenAPI 3.1 specification through Fastify Swagger.

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

## Tech stack

- Node.js 24+
- TypeScript
- Fastify 5
- PostgreSQL
- Prisma 7
- Zod
- OpenAPI / Swagger
- Docker
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
│   ├── issues/
│   └── research/
├── prisma/
├── scripts/
├── src/
├── tests/
├── CONTRIBUTING.md
└── README.md
```

### Human-edited vs generated data

Contributors edit the canonical province files under `data/current/by-province/` and their source references under `data/sources/by-province/`.

`npm run data:build` compiles those files into `data/generated/` for validation and database seeding. Generated files are ignored by Git and must not be edited manually.

## Data principles

Canonical records must be backed by verifiable evidence.

Preferred sources include:

1. Instituto Nacional de Estatística (INE)
2. Government / legal publications
3. Municipal authorities
4. Other authoritative administrative sources

Historical MozGIS/INE data may be used for reconciliation, but historical names are not automatically promoted as current records.

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

Generate Prisma client and seed the database:

```bash
npm run db:generate
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

Health endpoint:

```http
GET /health
```

## Validation and tests

Build machine-readable aggregates:

```bash
npm run data:build
```

Dataset validation (builds first automatically):

```bash
npm run data:validate
```

Type checking:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

Smoke tests:

```bash
npm test
```

Integration tests:

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
npm run db:migrate
npm run db:seed
npm run db:studio
```

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

Source code is licensed under the MIT License.

The dataset aggregates and normalizes information from external sources. Source-specific attribution and reuse requirements may differ from the software license and should be respected.

## Why this project?

Mozambican applications repeatedly need reliable address hierarchy data. Instead of each project maintaining a different inconsistent list, `moz-address-api` provides a reusable, inspectable and source-aware foundation.

If the project is useful, contributions, corrections and repository stars are welcome.

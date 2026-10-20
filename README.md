# 🇲🇿 moz-address-api

Open-source REST API and dataset for Mozambique's administrative divisions.

`moz-address-api` provides structured and developer-friendly information about Mozambique's provinces, districts, administrative posts and localities.

The project is designed for developers building e-commerce platforms, delivery systems, forms, ERPs, CRMs, government applications, fintech products and other applications that require standardized Mozambican location data.

---

## ✨ Features

- 🇲🇿 Mozambique administrative divisions
- Provinces
- Districts
- Administrative posts
- Localities
- REST API
- JSON datasets
- TypeScript support
- Search
- PostgreSQL support
- OpenAPI documentation
- NPM package planned
- Open-source

---

## 🚀 API

Base URL:

```text
/api/v1
```

### Get all provinces

```http
GET /api/v1/provinces
```

Example response:

```json
{
  "data": [
    {
      "id": "prov_10",
      "code": null,
      "name": "Maputo",
      "slug": "maputo",
      "type": "province",
      "capital": "Matola"
    }
  ],
  "meta": {
    "total": 11
  }
}
```

### Get a province

By slug:

```http
GET /api/v1/provinces/maputo
```

Or by ID:

```http
GET /api/v1/provinces/prov_10
```

---

## 🗺 Administrative hierarchy

The project follows the administrative hierarchy used in Mozambique:

```text
Mozambique
└── Province
    └── District
        └── Administrative Post
            └── Locality
```

Maputo City may require specific treatment because its administrative organization differs from the other provinces.

---

## 📦 Planned endpoints

```http
GET /api/v1/provinces
GET /api/v1/provinces/:identifier

GET /api/v1/districts
GET /api/v1/districts/:identifier

GET /api/v1/provinces/:provinceId/districts

GET /api/v1/administrative-posts
GET /api/v1/administrative-posts/:identifier

GET /api/v1/districts/:districtId/administrative-posts

GET /api/v1/localities
GET /api/v1/localities/:identifier

GET /api/v1/administrative-posts/:id/localities

GET /api/v1/search?q=matola

GET /api/v1/tree
```

---

## 🛠 Tech stack

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Prisma ORM
- Zod
- OpenAPI / Swagger
- Docker
- Vitest
- GitHub Actions

---

## 📁 Project structure

```text
moz-address-api/
│
├── data/
│   ├── current/
│   ├── raw/
│   └── sources/
│
├── src/
│   ├── config/
│   ├── modules/
│   ├── routes/
│   ├── app.ts
│   └── server.ts
│
├── tests/
│
├── .env.example
├── LICENSE
├── README.md
├── package.json
└── tsconfig.json
```

---

## 💾 Dataset

The canonical dataset is stored under:

```text
data/current/
```

Current files:

```text
provinces.json
districts.json
administrative-posts.json
localities.json
```

Raw source material and imported datasets are kept separately from normalized data.

```text
data/raw/
```

Information about original data sources is stored under:

```text
data/sources/
```

This separation allows the project to preserve provenance while providing normalized data to developers.

---

## 🔎 Data quality

Administrative information should not be added without a verifiable source.

Where possible, data should include information about:

- Source institution
- Source document
- Publication year
- Source URL
- Access date

The Instituto Nacional de Estatística de Moçambique (INE) is intended to be one of the primary sources of administrative information.

Community contributions correcting or updating administrative information are welcome, but must include an appropriate source.

---

## 🧑‍💻 Development

Clone the repository:

```bash
git clone https://github.com/oliviorui/moz-address-api.git
```

Enter the project:

```bash
cd moz-address-api
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Run the development server:

```bash
npm run dev
```

The API will be available by default at:

```text
http://localhost:3333
```

Health check:

```http
GET /health
```

---

## 📜 Scripts

Development:

```bash
npm run dev
```

Type checking:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

Production:

```bash
npm start
```

---

## 🛣 Roadmap

### v0.1

- [x] Project foundation
- [x] TypeScript
- [x] Fastify
- [x] Province dataset
- [x] Provinces endpoint
- [ ] Province data sources

### v0.2

- [ ] District dataset
- [ ] District endpoints
- [ ] Province → district relationships

### v0.3

- [ ] Administrative posts
- [ ] Administrative post endpoints

### v0.4

- [ ] Localities
- [ ] Locality endpoints

### v0.5

- [ ] PostgreSQL
- [ ] Prisma ORM
- [ ] Database migrations
- [ ] Database seeding

### v0.6

- [ ] Search
- [ ] Filters
- [ ] Administrative tree endpoint

### v0.7

- [ ] Swagger / OpenAPI
- [ ] API documentation

### v0.8

- [ ] Automated tests
- [ ] CI with GitHub Actions
- [ ] Docker support

### v0.9

- [ ] NPM package
- [ ] TypeScript package
- [ ] JSON downloads

### v1.0

- [ ] Complete verified dataset
- [ ] Stable REST API
- [ ] Public deployment
- [ ] Complete documentation

---

## 🤝 Contributing

Contributions are welcome.

You can contribute by:

- Adding missing administrative divisions
- Reporting incorrect data
- Providing updated official sources
- Improving documentation
- Fixing bugs
- Adding tests
- Suggesting API improvements

When contributing location data, please provide a reliable source whenever possible.

---

## 📄 Licensing

### Source code

The source code of this project is licensed under the MIT License.

### Dataset

The dataset contains information collected and normalized from external sources.

Dataset licensing and attribution requirements may differ from the software license and will be documented according to the terms of the original data providers.

---

## 🇲🇿 Why this project?

Developers building applications for Mozambique often need province, district and locality information for:

- Checkout forms
- Delivery systems
- Address forms
- E-commerce
- Government systems
- Financial applications
- CRMs
- ERPs
- Registration systems

Instead of every project maintaining its own inconsistent list, `moz-address-api` aims to provide a reusable, verifiable and open foundation for Mozambican administrative location data.

---

## ⭐ Support

If this project is useful to you, consider giving the repository a star.

Contributions, corrections and suggestions are welcome.

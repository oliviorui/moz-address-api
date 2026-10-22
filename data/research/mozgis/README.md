# Automated MozGIS / INE research

The project can fetch the official INE 2017 locality/bairro layer directly from MozGIS.

This is intended to accelerate reconciliation of Mozambique's locality layer.

## Fetch one province

```bash
npm run data:research:mozgis -- --province Maputo
```

Output:

```text
data/research/mozgis/localities-2017-maputo.json
```

## Fetch all Mozambique

```bash
npm run data:research:mozgis
```

Output:

```text
data/research/mozgis/localities-2017-mozambique.json
```

## Important

The MozGIS layer is official INE 2017 data, but it is a historical reference.

Generated files under this directory:

- are not seeded into PostgreSQL;
- are not exposed as current API data;
- provide province, district, administrative post, locality and bairro names/codes;
- must be reconciled against newer INE or government sources before records move into `data/current/`.

This lets the project discover thousands of names in one request instead of researching every locality manually.

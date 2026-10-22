# Maputo Province locality reconciliation

## Status

The administrative-post layer for Maputo Province is complete in the canonical dataset:

- 8 districts / territorial equivalents
- 29 administrative posts

The locality layer is **not yet complete**.

The current provincial INE territorial-units table reports:

| District | Administrative posts | Localities | City neighborhoods |
| --- | ---: | ---: | ---: |
| Matola | 3 | 0 | 42 |
| Boane | 2 | 3 | 0 |
| Magude | 5 | 17 | 0 |
| Manhiça | 6 | 13 | 0 |
| Marracuene | 2 | 8 | 0 |
| Matutuíne | 5 | 14 | 0 |
| Moamba | 4 | 12 | 0 |
| Namaacha | 2 | 9 | 0 |
| **Total** | **29** | **76** | **42** |

Matola's 42 municipal neighborhoods are already loaded and verified.

## Reconciliation progress

### Matutuíne — 13/14 names reconciled

A recent district-level structure repeatedly supports 13 locality names:

- Bela Vista / Missevene: Missevene, Salamanga, Madjuva, Tinonganine
- Catembe-Nsime: Nsime, Mungazine
- Catuane: Phazimane, Manhangane
- Machangulo: Nhonguane, Ndelane
- Zitundo: Zitundo Sede, Manhoca, Ponta do Ouro

The newer provincial INE total is 14 localities.

Recent official material for Machangulo mentions Ngomene, Mabuluco, Ndelane and Santa-Maria as communities, but does not classify all of them as localities. Therefore the project does not infer the missing 14th locality from community names.

The 13-name reconciliation set is preserved in:

`data/research/maputo/matutuine-localities-reconciliation.json`

It remains outside `data/current/` until the 14th current locality and its parent post are authoritatively identified.

### Moamba — 10/12 historical names preserved

The current provincial INE total is 12 localities, but the official district profile available from the Portal do Governo enumerates 10:

- Moamba: Moamba-Sede
- Ressano Garcia: Ressano Garcia
- Pessene: Pessene-Sede, Mahulane, Vundiça
- Sabié: Sabié, Rengué, Macaene, Malengane, Matunganhane

The historical structure is preserved in:

`data/research/maputo/moamba-localities-historical.json`

It must not be seeded while the two additional current localities remain unidentified.

### Other pending districts

- Boane: current target 3
- Magude: current target 17
- Manhiça: current target 13
- Marracuene: current target 8
- Namaacha: current target 9

## Canonical-data rule

Do not add a locality to `data/current/` only to make totals match.

A locality may enter the current canonical dataset when at least one sufficiently recent authoritative source supports:

1. its name;
2. its parent administrative post;
3. its current administrative status.

When authoritative sources conflict, retain evidence in `data/research/` and keep the canonical record pending.

## Research-data rule

Files under `data/research/` are not canonical API data.

They:

- are not loaded by the database seed;
- may contain historical, partial or conflicting records;
- must not be exposed as current administrative divisions;
- can be promoted into `data/current/` only after reconciliation.

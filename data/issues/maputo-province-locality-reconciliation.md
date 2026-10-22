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

## Why the remaining 76 localities are not being bulk-imported yet

Available enumerated administrative lists do not consistently match the newer INE counts.

### Boane

Older territorial lists enumerate more locality names than the newer provincial total.

Known older structure includes locality names such as:

- Gueguegue
- Eduardo Mondlane
- Matola-Rio Sede
- Mulotana

The newer provincial total is 3 localities.

This likely reflects administrative or municipal reclassification, but the canonical dataset must not infer which record ceased to be counted as a locality without a source that explicitly confirms the change.

### Magude

An older national administrative-division list enumerates 18 localities.

The newer provincial total is 17.

### Manhiça

An older administrative list enumerates 15 localities.

The newer provincial total is 13.

### Marracuene

An older administrative list enumerates 7 localities.

The newer provincial total is 8.

### Matutuíne

District statistics for 2019–2023 report 13 localities, distributed as:

- Bela Vista: 4
- Catembe: 2
- Catuane: 2 in 2022–2023
- Machangulo: 2
- Zitundo: 3

The newer provincial territorial-units table reports 14 localities.

This means at least one locality was added or reclassified after the district series represented in that publication.

### Moamba

The current provincial INE total is **12 localities**, but the official district profile available from the Portal do Governo enumerates **10**:

- Moamba: Moamba-Sede
- Ressano Garcia: Ressano Garcia
- Pessene: Pessene-Sede, Mahulane, Vundiça
- Sabié: Sabié, Rengué, Macaene, Malengane, Matunganhane

The INE district publication *Estatísticas do Distrito de Moamba 2018–2022* confirms the same four administrative posts — Moamba, Pessene, Ressano Garcia and Sabié — but the indexed text reviewed here does not expose a current enumerated locality list.

The historical 10-locality structure is now preserved in:

`data/research/maputo/moamba-localities-historical.json`

That file is **research evidence only** and must not be seeded into the current API while the two additional localities in the newer total of 12 remain unidentified.

### Namaacha

An older administrative list enumerates 8 localities.

The newer provincial total is 9.

## Canonical-data rule

Do not add a locality to `data/current/` only to make the totals match.

A locality may enter the current canonical dataset when at least one sufficiently recent authoritative source supports:

1. its name;
2. its parent administrative post;
3. its current administrative status.

When two authoritative sources conflict, record the discrepancy here (or in a district-specific issue file) and keep the canonical record pending until reconciled.

## Research-data rule

Files under `data/research/` are not canonical API data.

They may contain historical, candidate or conflicting records retained for reconciliation. They must never be loaded by the database seed unless they are promoted into `data/current/` after verification.

## Next research target

Priority order:

1. Moamba — identify the two additional current localities
2. Matutuíne
3. Boane
4. Namaacha
5. Marracuene
6. Manhiça
7. Magude

For each district, prefer:

1. current INE territorial publication;
2. current government gazette / official electoral territorial table;
3. provincial or district government administrative plan;
4. older official classifiers only as historical comparison.

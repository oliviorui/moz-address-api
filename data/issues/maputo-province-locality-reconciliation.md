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

Several official/historical administrative sources enumerate 10 localities.

A commonly repeated structure is:

- Moamba-Sede: 1
- Pessene: 3
- Ressano Garcia: 1
- Sabié: 5

Other official administrative lists from later periods use a different set of locality names, while the newer provincial INE table reports 12 localities.

Because both the count and the enumerated names vary by source/year, importing a guessed list would make the API less reliable.

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

## Next research target

Priority order:

1. Moamba
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

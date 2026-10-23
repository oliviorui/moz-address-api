# Zambézia urban neighborhood reconciliation

Status: BLOCKED_ON_NOMINAL_CURRENT_SOURCE

## Scope

The rural locality layer for Zambézia has been reconciled separately.

Three urban districts remain blocked because the current official province totals are known,
but a complete authoritative current nominal neighborhood list has not yet been established:

- Quelimane — 51 neighborhoods
- Gurué — 46 neighborhoods
- Mocuba — 31 neighborhoods

Total: 128 neighborhoods.

## Current official baseline

Source: Instituto Nacional de Estatística (INE), *Anuário Estatístico, Província da Zambézia, 2024*,
Quadro 1.2.1.

Province totals:

- 54 administrative posts
- 191 localities
- 128 neighborhoods

Urban district totals:

| District | Localities | Neighborhoods |
| --- | ---: | ---: |
| Quelimane | 6 | 51 |
| Gurué | 16 | 46 |
| Mocuba | 6 | 31 |

## Historical reference

The MozGIS / INE 2017 snapshot is research-only and must not be promoted directly when its
counts differ from the current official baseline.

Historical snapshot counts:

- Quelimane — 60 neighborhoods
- Gurué — 27 neighborhoods
- Mocuba — 22 neighborhoods

These differences are structural and cannot be resolved safely by count matching alone.

## Quelimane evidence conflict

The current INE provincial baseline reports 51 neighborhoods.

A 2020 municipal diagnostic document reports 52 neighborhoods distributed across five urban
administrative posts. It also notes that several neighborhoods had been resized or subdivided
and that some updated boundaries had not yet been topographically surveyed.

A later municipal posture document uses a different seven-post urban organization and includes
different neighborhood naming/grouping.

Because the nominal structures differ, neither older list should be treated as the current
canonical 51-neighborhood list without a newer authoritative crosswalk.

## Required evidence before promotion

For each of Quelimane, Gurué and Mocuba obtain one of the following:

1. Current INE or municipal nominal neighborhood list matching the official current count; or
2. Current official map / gazette / municipal administrative instrument with neighborhood names
   and parent administrative posts; or
3. An official crosswalk explaining mergers, splits, renames or transfers from the 2017 structure.

## Promotion rule

Do not promote historical neighborhoods for these three districts until:

- nominal current names are established;
- parent administrative posts are established;
- count matches the current official baseline;
- aliases / merges / splits are documented in reconciliation config.

## Sources

- INE — Anuário Estatístico, Província da Zambézia, 2024.
- INE / MozGIS — SociedPopulacaoLocalidadeBairro2017 (historical reference only).
- PDUL — Relatório de Diagnóstico, Município de Quelimane (2020), used only as historical /
  transitional evidence, not as the current canonical neighborhood source.

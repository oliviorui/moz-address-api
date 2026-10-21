# Cabo Delgado administrative posts — unresolved source discrepancy

Status: BLOCKED
Last reviewed: 2026-10-21

## Summary

Administrative post data for Cabo Delgado is temporarily blocked
because official INE publications contain conflicting counts for the
2024 administrative structure.

No Cabo Delgado administrative posts should be added to the canonical
dataset until the discrepancy is resolved using an authoritative
administrative classification or legal source.

## Provincial total

The INE Statistical Yearbook for Cabo Delgado, 2024 reports:

- Administrative posts: 57

However, the district-level counts presented in the same territorial
table do not reconcile cleanly with the provincial total.

## Confirmed discrepancies

### Macomia

Provincial yearbook count:

- 3 administrative posts

INE district territorial publication uses:

- Macomia-Sede
- Chai
- Mucojo
- Quiterajo

Observed district count:

- 4

### Mecúfi

Provincial yearbook count:

- 3 administrative posts

INE district territorial publication uses:

- Mecúfi-Sede
- Murrebue

Observed district count:

- 2

### Muidumbe

Provincial yearbook count:

- 2 administrative posts

INE district territorial publication uses:

- Muidumbe
- Chitunda
- Miteda

Observed district count:

- 3

### Namuno

Provincial yearbook count:

- 3 administrative posts

INE district territorial publication uses:

- Namuno-Sede
- Hucula
- Meloco
- Machoca
- Ncumpe
- Papai

Observed district count:

- 6

### Metuge

Provincial yearbook count:

- 4 administrative posts

INE territorial publications use:

- Metuge-Sede
- Mieze

Observed district count:

- 2

## Historical structure

Older administrative classifications also differ from some values
reported in the 2024 provincial yearbook.

Examples include:

- Ancuabe: Ancuabe, Metoro, Meza
- Balama: Balama, Impiri, Kwekwe, Mavala
- Chiúre: Chiúre, Chiúre Velho, Katapua, Mazeze, Namogelia, Ocua
- Ibo: Ibo, Quirimba
- Macomia: Macomia, Chai, Mucojo, Quiterajo
- Mocímboa da Praia: Mocímboa da Praia, Diaca, Mbau
- Montepuez: Montepuez, Mapupulo, Mirate, Nairoto, Namanhumbir
- Quissanga: Quissanga, Bilibiza, Mahate

These records must not automatically be treated as the current
canonical 2024 structure.

## Dataset decision

Until resolved:

- Do not add Cabo Delgado administrative posts to
  `data/current/administrative-posts.json`.
- Do not add Cabo Delgado to
  `expectedAdministrativePostCountsByProvince`.
- Do not add Cabo Delgado district counts to
  `expectedAdministrativePostCountsByDistrict`.
- Keep Cabo Delgado district records already present.
- Continue tracking official sources.

## Resolution requirements

Accept the administrative-post dataset only after finding a source that:

1. explicitly describes the current administrative division;
2. provides the complete list of posts by district;
3. reconciles the provincial total;
4. is authoritative enough to supersede conflicting statistical tables.

Preferred sources:

- INE official administrative classification;
- Ministry responsible for State Administration;
- Boletim da República / legislation establishing administrative units.

## Current canonical state

Cabo Delgado districts: complete.

Cabo Delgado administrative posts: blocked pending verification.

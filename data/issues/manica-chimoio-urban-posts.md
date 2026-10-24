# Chimoio urban administrative-post reconciliation

Status: PARTIAL — neighborhoods canonical, post-level grouping unresolved

## Canonical neighborhood layer

The INE 2025 Chimoio detailed territorial table explicitly enumerates 33
neighborhoods. Those 33 names are promoted canonically as direct district
neighborhoods of Chimoio.

## Administrative-post discrepancy

The same INE 2025 leaflet is internally inconsistent:

- header: 3 administrative posts
- detailed table: 4 urban administrative units
- detailed table total: 33 neighborhoods

The existing canonical structure keeps three administrative posts:

- Urbano Nº 1
- Urbano Nº 2
- Urbano Nº 3

The 2025 detailed table places six neighborhoods under a fourth urban unit:

- Nhauir
- 1 de Maio
- Francisco Manyanga
- Textáfrica
- Nhamaonha
- Mudzingadzi

Earlier municipal planning material grouped these six neighborhoods under
Urbano Nº 3. Because the 2025 source conflicts internally, this patch does not
create a fourth canonical administrative post and does not force a remapping.

The 33 neighborhood names are therefore stored directly under Chimoio district
until a current legal/municipal source definitively resolves the urban-post
hierarchy.

# Maputo batch promotion

This is a historical record. The dedicated Maputo promotion command was removed after the province was completed. Use `npm run data:promote -- <province-slug>` for current promotions.

The Maputo command promoted only the three districts that passed the first automated structural reconciliation:

- Marracuene
- Moamba
- Namaacha

It had hard safety guards. It aborted if any of those districts was no longer:

- `READY_FOR_REVIEW`;
- an exact locality-count match;
- fully mapped to canonical administrative posts;
- complete in candidate count.

Evidence basis:

- locality names and parent posts: official INE/MozGIS 2017 layer;
- current locality totals: INE Maputo Province 2024 statistical yearbook.

The script wrote canonical locality shards, source metadata, source references, and updated the Maputo Province coverage status.

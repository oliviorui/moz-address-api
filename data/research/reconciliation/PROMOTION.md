# Maputo batch promotion

`npm run data:promote:maputo-ready` promotes only the three districts that passed the first automated structural reconciliation:

- Marracuene
- Moamba
- Namaacha

The command has hard safety guards. It aborts if any of those districts is no longer:

- `READY_FOR_REVIEW`;
- an exact locality-count match;
- fully mapped to canonical administrative posts;
- complete in candidate count.

Evidence basis:

- locality names and parent posts: official INE/MozGIS 2017 layer;
- current locality totals: INE Maputo Province 2024 statistical yearbook.

The script writes canonical locality shards, source metadata, source references, and updates the Maputo Province coverage status.

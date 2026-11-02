# Sources without a URL

Status: OPEN

These entries in `data/sources/sources.json` have no URL, so readers cannot open the document to check a record:

- `ine-administrative-divisions`: generic entry with no year or access date. It is cited by the 56 administrative posts of Cabo Delgado, which also cite `cabo-delgado-56-posts-verified-2022` for the province total only. Replace it with the specific INE or district publications used for the post names.
- `ine-manica-chimoio-folheto-2025`: the INE 2025 Chimoio leaflet. Add the document's URL.
- `ine-manica-manica-folheto-2025`: the INE 2025 Manica district leaflet. Add the document's URL.

`npm run data:validate` prints a warning for each of them until this is fixed.

# Canonical locality layout

This directory is the contributor-friendly canonical layout planned for v1.1.

Each province has exactly two human-edited locality files:

```text
<province>/
├── localities.json
└── neighborhoods.json
```

## Rules

- `localities.json` contains only records with `type: "LOCALITY"`.
- `neighborhoods.json` contains only records with `type: "NEIGHBORHOOD"`.
- Existing IDs must not be changed casually.
- A locality normally references an `administrativePostId`.
- A neighborhood may reference an administrative post or, where the authoritative urban structure requires it, a district directly.
- Every canonical record should have a verifiable source reference under `data/sources/by-province/<province>/`.

Names such as `exact`, `confirmed`, `reconciled` and `small-gap-verified` belong to research history, not to the canonical contributor layout.

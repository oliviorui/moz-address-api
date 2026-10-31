# Research data

This directory contains non-canonical administrative data retained for verification and reconciliation.

Records under `data/research/`:

- are **not** loaded by the database seed;
- may be historical, incomplete or conflicting;
- must not be exposed as current administrative divisions;
- can be promoted into `data/current/` only after their counts and hierarchy reconcile with current authoritative sources. Promoted names stay marked as historical through `nameEvidence` unless a current source lists them.

This separation allows the project to preserve useful official evidence without weakening the reliability of the current API dataset.

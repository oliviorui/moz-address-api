# Coverage policy

Coverage files describe what is verified and loaded into the canonical dataset.

## Release dispositions

### COMPLETE

The province/district has reached the current verified target for all tracked
layers.

### ACCEPTED_PARTIAL_FOR_V1

The canonical dataset is intentionally incomplete because one or more records
cannot be promoted safely from the currently available official sources.

This status is acceptable for a stable release when:

- the verified records are already canonical;
- the missing records are explicitly counted;
- the blocking districts/layers are named;
- the source conflict or missing nominal source is documented;
- no value has been inferred only to make the coverage reach 100%.

## Blocker codes

### BLOCKED_ON_OFFICIAL_SOURCE_EXTRACTION

A current official source has been identified, but its nominal table has not
yet been safely extracted and reconciled.

### BLOCKED_ON_OFFICIAL_SOURCE_CONFLICT

Current official sources disagree on counts, names or hierarchy.

### MISSING_COMPLETE_CURRENT_NOMINAL_LIST

A current aggregate count exists, but a complete authoritative list of names
has not been found.

## v1 policy

A documented partial province does not block v1.0.0.

The release is blocked only by:

- invalid canonical data;
- broken hierarchy or foreign keys;
- duplicate canonical records;
- failing validation, seed, typecheck, build or integration tests;
- undocumented known coverage gaps.

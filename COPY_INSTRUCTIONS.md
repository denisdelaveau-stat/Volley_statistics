# Copy into the local Git working tree

1. Copy the contents of this directory over the repository root, preserving paths.
2. Delete the paths listed in `DELETE_THESE.txt` if they exist.
3. Run `python3 -m pytest -q tests` (expected: 19 passed).
4. Run `sha256sum -c SHA256SUMS.txt` from the repository root.

The root-level Word file is the standalone copy; the identical package copy remains under `docs/`.

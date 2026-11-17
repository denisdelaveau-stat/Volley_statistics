# Copy into the local Git working tree

1. Copy the contents of this directory over the repository root, preserving paths.
2. Delete `docs/Volley_Live_Capture_Screens_v1.3.2.pdf`.
3. Run `python3 -m pytest -q tests` (expected: 14 passed).
4. Run `sha256sum -c SHA256SUMS.txt` from the repository root.

The root-level Word file is the corrected standalone copy; the identical package copy remains under `docs/`.

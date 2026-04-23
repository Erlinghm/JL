# Solution: Start repo orientation with Graphify, then verify source

Use Graphify as a navigation layer, not as the final authority.

## Workflow

1. Read `graphify-out/GRAPH_REPORT.md` first when `graphify-out/` exists.
2. Use `graphify-out/graph.html` for interactive exploration when needed.
3. Treat `graphify-out/graph.json` as the raw graph artifact.
4. Verify every Graphify inference against the actual source before editing.
5. Rerun Graphify if the output predates major structural cleanup.

## Caution

The report includes inferred edges. These are useful search hints, but they are
not proof. Confirm behavior in source files before making code changes.

#!/usr/bin/env python3
"""Adapt managed Supabase auth/storage COPY blocks to the pinned self-hosted schema."""

from __future__ import annotations

import argparse
import re
from collections import defaultdict
from pathlib import Path


COPY_RE = re.compile(
    r'^COPY "(?P<schema>[^"]+)"\."(?P<table>[^"]+)" '
    r'\((?P<columns>.+)\) FROM stdin;$'
)
COLUMN_RE = re.compile(r'"([^"]+)"')
INTERNAL_SCHEMAS = {"auth", "storage"}
FORCE_SKIP_TABLES = {
    ("storage", "buckets_vectors"),
    ("storage", "vector_indexes"),
}


def load_target_columns(path: Path) -> dict[tuple[str, str], list[str]]:
    target: dict[tuple[str, str], list[str]] = defaultdict(list)
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        if not raw_line:
            continue
        schema, table, column = raw_line.split("\t", 2)
        target[(schema, table)].append(column)
    return dict(target)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("target_columns", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    target_columns = load_target_columns(args.target_columns)
    adjusted: dict[str, tuple[list[str], int]] = {}
    skipped_empty: list[str] = []
    missing_with_rows: list[str] = []

    active_key: tuple[str, str] | None = None
    active_columns: list[str] = []
    keep_indices: list[int] = []
    drop_block = False
    block_rows = 0

    with args.source.open("r", encoding="utf-8", newline="") as source_file, args.output.open(
        "w", encoding="utf-8", newline=""
    ) as output_file:
        for raw_line in source_file:
            line = raw_line.rstrip("\r\n")

            if active_key is not None:
                if line == r"\.":
                    label = ".".join(active_key)
                    if drop_block:
                        if block_rows:
                            missing_with_rows.append(f"{label}:{block_rows}")
                        else:
                            skipped_empty.append(label)
                    else:
                        output_file.write(raw_line)
                        if len(keep_indices) != len(active_columns):
                            dropped = [
                                column
                                for index, column in enumerate(active_columns)
                                if index not in keep_indices
                            ]
                            adjusted[label] = (dropped, block_rows)

                    active_key = None
                    active_columns = []
                    keep_indices = []
                    drop_block = False
                    block_rows = 0
                    continue

                block_rows += 1
                if drop_block:
                    continue

                if len(keep_indices) == len(active_columns):
                    output_file.write(raw_line)
                    continue

                fields = line.split("\t")
                if len(fields) != len(active_columns):
                    raise RuntimeError(
                        f"COPY field mismatch for {'.'.join(active_key)}: "
                        f"expected {len(active_columns)}, found {len(fields)}"
                    )
                output_file.write("\t".join(fields[index] for index in keep_indices) + "\n")
                continue

            match = COPY_RE.match(line)
            if not match:
                output_file.write(raw_line)
                continue

            schema = match.group("schema")
            table = match.group("table")
            if schema not in INTERNAL_SCHEMAS:
                output_file.write(raw_line)
                active_key = (schema, table)
                active_columns = COLUMN_RE.findall(match.group("columns"))
                keep_indices = list(range(len(active_columns)))
                continue

            active_key = (schema, table)
            active_columns = COLUMN_RE.findall(match.group("columns"))
            if active_key in FORCE_SKIP_TABLES:
                drop_block = True
                continue
            available = target_columns.get(active_key)
            if not available:
                drop_block = True
                continue

            available_set = set(available)
            keep_indices = [
                index for index, column in enumerate(active_columns) if column in available_set
            ]
            kept_columns = [active_columns[index] for index in keep_indices]
            rendered_columns = ", ".join(f'"{column}"' for column in kept_columns)
            output_file.write(
                f'COPY "{schema}"."{table}" ({rendered_columns}) FROM stdin;\n'
            )

    if missing_with_rows:
        args.output.unlink(missing_ok=True)
        raise RuntimeError(
            "Refusing to drop non-empty tables absent from target: "
            + ", ".join(missing_with_rows)
        )

    print(f"COMPAT_ADJUSTED_TABLES={len(adjusted)}")
    for label, (columns, row_count) in sorted(adjusted.items()):
        print(f"ADJUSTED={label} DROPPED_COLUMNS={','.join(columns)} ROWS={row_count}")
    print(f"COMPAT_SKIPPED_EMPTY_TABLES={len(skipped_empty)}")
    for label in sorted(skipped_empty):
        print(f"SKIPPED_EMPTY={label}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

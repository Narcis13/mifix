#!/usr/bin/env python3
"""Convert all DBF files in import/mf/ to a single SQLite database."""

import os
import sqlite3
import datetime
from pathlib import Path
from dbfread import DBF

SCRIPT_DIR = Path(__file__).resolve().parent
MF_DIR = SCRIPT_DIR / "mf"
SQLITE_PATH = MF_DIR / "legacy_data.sqlite"

TYPE_MAP = {
    "C": "TEXT",
    "M": "TEXT",
    "D": "TEXT",
    "L": "INTEGER",
}


def dbf_type_to_sqlite(field):
    if field.type == "N":
        return "INTEGER" if field.decimal_count == 0 else "REAL"
    return TYPE_MAP.get(field.type, "TEXT")


def convert_value(value):
    if value is None:
        return None
    if isinstance(value, datetime.date):
        return value.isoformat()
    if isinstance(value, bool):
        return int(value)
    return value


def main():
    dbf_files = sorted(
        p for p in MF_DIR.iterdir()
        if p.suffix.upper() == ".DBF" and p.is_file()
    )

    if not dbf_files:
        print("No DBF files found in", MF_DIR)
        return

    if SQLITE_PATH.exists():
        SQLITE_PATH.unlink()

    conn = sqlite3.connect(SQLITE_PATH)
    cur = conn.cursor()

    print(f"{'Table':<20} {'Columns':>8} {'Rows':>8}")
    print("-" * 40)

    total_tables = 0
    total_rows = 0

    for dbf_path in dbf_files:
        table_name = dbf_path.stem.lower()
        try:
            table = DBF(str(dbf_path), encoding="cp852", ignore_missing_memofile=True)
        except Exception as e:
            print(f"  SKIP {dbf_path.name}: {e}")
            continue

        columns = []
        for f in table.fields:
            col_type = dbf_type_to_sqlite(f)
            columns.append(f'"{f.name.lower()}" {col_type}')

        if not columns:
            print(f"  SKIP {dbf_path.name}: no columns")
            continue

        cur.execute(f'DROP TABLE IF EXISTS "{table_name}"')
        cur.execute(f'CREATE TABLE "{table_name}" ({", ".join(columns)})')

        field_names = [f.name for f in table.fields]
        placeholders = ", ".join("?" for _ in field_names)
        insert_sql = f'INSERT INTO "{table_name}" VALUES ({placeholders})'

        row_count = 0
        for record in table:
            values = [convert_value(record[name]) for name in field_names]
            cur.execute(insert_sql, values)
            row_count += 1

        conn.commit()
        total_tables += 1
        total_rows += row_count
        print(f"{table_name:<20} {len(columns):>8} {row_count:>8}")

    conn.close()
    print("-" * 40)
    print(f"Done: {total_tables} tables, {total_rows} total rows")
    print(f"Output: {SQLITE_PATH}")


if __name__ == "__main__":
    main()

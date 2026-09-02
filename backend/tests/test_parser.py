import os
import json
import tempfile
import pandas as pd
import pytest

from app.parser import parse_file, read_dataset_into_df, extract_metadata, format_schema_for_llm


def test_csv_parser():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        f.write("id,name,age,salary,joined\n")
        f.write("1,Alice,30,75000.50,2022-01-15\n")
        f.write("2,Bob,,82000.00,2021-06-10\n")
        f.write("3,Charlie,28,,2023-03-20\n")
        temp_path = f.name

    try:
        df, meta = parse_file(temp_path, "employees.csv")
        assert len(df) == 3
        assert len(df.columns) == 5
        assert meta.row_count == 3
        assert meta.col_count == 5
        assert len(meta.columns) == 5
        assert meta.head_rows[0]["name"] == "Alice"
        assert meta.head_rows[1]["age"] is None  # Null sanitized
        
        # Check formatted schema for LLM
        schema_text = format_schema_for_llm(meta)
        assert "employees.csv" in schema_text
        assert "Total Rows: 3" in schema_text
    finally:
        os.remove(temp_path)


def test_json_parser():
    data = [
        {"product": "Laptop", "price": 1200, "in_stock": True},
        {"product": "Mouse", "price": 25, "in_stock": False},
        {"product": "Monitor", "price": 300, "in_stock": True},
    ]
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(data, f)
        temp_path = f.name

    try:
        df, meta = parse_file(temp_path, "inventory.json")
        assert len(df) == 3
        assert meta.col_count == 3
        assert meta.head_rows[0]["product"] == "Laptop"
    finally:
        os.remove(temp_path)


def test_tsv_txt_parser():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        f.write("sensor\ttemperature\thumidity\n")
        f.write("A1\t22.4\t45\n")
        f.write("B2\t24.1\t50\n")
        temp_path = f.name

    try:
        df, meta = parse_file(temp_path, "sensors.txt")
        assert len(df) == 2
        assert meta.col_count == 3
        assert meta.head_rows[0]["sensor"] == "A1"
    finally:
        os.remove(temp_path)

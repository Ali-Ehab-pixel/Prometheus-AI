import os
import json
import uuid
import datetime
import sqlite3
import pandas as pd


class DatasetVersionManager:
    def __init__(self, base_dir="backend/data/versions", db_path=None):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)
        if db_path is None:
            # Default database location inside backend/data/users.db
            app_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            self.db_path = os.path.join(app_root, "data", "users.db")
        else:
            self.db_path = db_path

    def _get_db(self):
        try:
            if os.path.exists(self.db_path):
                conn = sqlite3.connect(self.db_path, check_same_thread=False)
                conn.row_factory = sqlite3.Row
                return conn
        except Exception:
            pass
        return None

    def save_version(self, file_id: str, df: pd.DataFrame, label: str) -> dict:
        file_dir = os.path.join(self.base_dir, file_id)
        os.makedirs(file_dir, exist_ok=True)

        metadata_path = os.path.join(file_dir, "versions.json")
        versions = []
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, "r") as f:
                    versions = json.load(f)
            except Exception:
                versions = []

        version_num = len(versions) + 1
        timestamp = datetime.datetime.now().isoformat()
        version_id = f"v{version_num}_{timestamp.replace(':', '-')}"
        file_path = os.path.join(file_dir, f"{version_id}.csv")

        df.to_csv(file_path, index=False)

        version_metadata = {
            "version_id": version_id,
            "label": label,
            "timestamp": timestamp,
            "row_count": len(df),
            "col_count": len(df.columns),
            "file_path": file_path,
        }
        versions.append(version_metadata)

        with open(metadata_path, "w") as f:
            json.dump(versions, f, indent=4)

        # Sync with SQLite database
        conn = self._get_db()
        if conn:
            try:
                with conn:
                    conn.execute(
                        """
                        INSERT INTO dataset_versions (id, file_id, version_id, label, row_count, col_count, file_path, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            str(uuid.uuid4()),
                            file_id,
                            version_id,
                            label,
                            len(df),
                            len(df.columns),
                            file_path,
                            timestamp,
                        ),
                    )
            except Exception:
                pass

        return version_metadata

    def list_versions(self, file_id: str) -> list[dict]:
        # Try database first
        conn = self._get_db()
        if conn:
            try:
                cursor = conn.execute(
                    """
                    SELECT version_id, label, row_count, col_count, file_path, created_at AS timestamp
                    FROM dataset_versions
                    WHERE file_id = ?
                    ORDER BY created_at ASC
                    """,
                    (file_id,),
                )
                rows = cursor.fetchall()
                if rows:
                    return [dict(r) for r in rows]
            except Exception:
                pass

        # Fallback to JSON file
        file_dir = os.path.join(self.base_dir, file_id)
        metadata_path = os.path.join(file_dir, "versions.json")
        if not os.path.exists(metadata_path):
            return []
        try:
            with open(metadata_path, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def get_version(self, file_id: str, version_id: str) -> pd.DataFrame:
        file_dir = os.path.join(self.base_dir, file_id)
        file_path = os.path.join(file_dir, f"{version_id}.csv")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Version {version_id} not found")
        return pd.read_csv(file_path)

    def rollback(self, file_id: str, version_id: str) -> pd.DataFrame:
        return self.get_version(file_id, version_id)


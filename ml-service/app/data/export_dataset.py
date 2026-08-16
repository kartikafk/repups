import pathlib
import pandas as pd
from app.data.mongo_client import database

ROOT = pathlib.Path(__file__).parents[1]

def _clean(rows):
    return pd.DataFrame(rows).select_dtypes(include="number").dropna(axis=1, how="all")

def export_dataset(key="posture"):
    rows = []
    if key == "posture":
        for record in database().posturerecords.find({}, {"featureVector": 1, "overallScore": 1, "createdAt": 1}):
            rows.append(record.get("featureVector") or {"overallScore": record.get("overallScore")})
    else:
        for session in database().sessions.find({"exercise": key}, {"featureVector": 1}): rows.append(session.get("featureVector") or {})
    frame = _clean(rows)
    destination = ROOT / "datasets"; destination.mkdir(exist_ok=True)
    output = destination / f"{key}_features_v1.parquet"
    frame.to_parquet(output, index=False)
    return output, len(frame)

def export_all():
    keys = ["posture"] + [value for value in database().sessions.distinct("exercise") if value]
    return {key: export_dataset(key)[1] for key in keys}

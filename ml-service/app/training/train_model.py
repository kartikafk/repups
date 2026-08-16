import pathlib
import time
import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
from app.models.model_registry import ROOT, registry

MIN_ROWS = 500
KEEP_VERSIONS = 3

def train(key="posture"):
    files = sorted((pathlib.Path(__file__).parents[1] / "datasets").glob(f"{key}_features_*.parquet"))
    if not files: return None
    frame = pd.read_parquet(files[-1]).select_dtypes(include="number").dropna()
    if len(frame) < MIN_ROWS: return None
    model = IsolationForest(contamination="auto", n_estimators=200, random_state=42).fit(frame)
    ROOT.mkdir(exist_ok=True); version = f"v{int(time.time())}"; output = ROOT / f"{key}_{version}.pkl"
    payload = {"model": model, "features": list(frame.columns), "sampleSize": len(frame), "version": version}
    joblib.dump(payload, output)
    manifest = {} if not (ROOT / "registry.json").exists() else __import__("json").loads((ROOT / "registry.json").read_text())
    manifest[key] = {"file": output.name, "rows": len(frame), "features": list(frame.columns), "version": version}
    registry.write(manifest)
    for stale in sorted(ROOT.glob(f"{key}_v*.pkl"))[:-KEEP_VERSIONS]: stale.unlink()
    return payload

def train_all(keys=None):
    dataset_root = pathlib.Path(__file__).parents[1] / "datasets"
    available = [path.name.split("_features_")[0] for path in dataset_root.glob("*_features_*.parquet")]
    return {key: bool(train(key)) for key in available if keys is None or key in keys}

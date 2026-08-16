from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.models.model_registry import registry
from app.data.export_dataset import export_all
from app.training.train_model import train_all
from app.models.model_registry import ROOT
import json
import os

router = APIRouter()
class PredictionRequest(BaseModel): exerciseId: str | None = None; plane: str | None = None; features: dict = Field(default_factory=dict)

@router.post("/predict/anomaly")
def anomaly(request: PredictionRequest):
    key = request.exerciseId or request.plane or "posture"; saved = registry.models.get(key)
    if not saved: return {"anomalyScore": None, "isAnomaly": None, "reason": "insufficient_training_data"}
    names = saved["features"]
    if any(name not in request.features for name in names): return {"anomalyScore": None, "isAnomaly": None, "reason": "missing_features"}
    values = [[request.features[name] for name in names]]
    return {"anomalyScore": float(saved["model"].decision_function(values)[0]), "isAnomaly": bool(saved["model"].predict(values)[0] == -1), "modelVersion": saved["version"], "sampleSizeAtTraining": saved["sampleSize"]}

@router.post("/pipeline/export-train")
def export_train():
    exported = export_all()
    manifest = {} if not (ROOT / "registry.json").exists() else json.loads((ROOT / "registry.json").read_text())
    minimum_new_rows = int(os.getenv("MIN_NEW_ROWS_FOR_RETRAIN", "50"))
    trainable = {key: rows for key, rows in exported.items() if rows - int(manifest.get(key, {}).get("rows", 0)) >= minimum_new_rows or key not in manifest}
    trained = train_all(trainable) if trainable else {}
    return {"exported": exported, "trained": trained, "minimumNewRows": minimum_new_rows}

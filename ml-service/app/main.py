from fastapi import FastAPI
from app.api.predict import router
from app.models.model_registry import registry
app=FastAPI(title="RepUps ML Service")
app.include_router(router,prefix="/ml/v1")
@app.get("/ml/v1/health")
def health(): return {"status":"ok", "models": list(registry.models.keys())}

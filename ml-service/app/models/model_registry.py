import json
import pathlib
import joblib

ROOT = pathlib.Path(__file__).parents[1] / "models_store"

class Registry:
    def __init__(self): self.models = {}; self.reload()
    def reload(self):
        manifest = ROOT / "registry.json"; self.models = {}
        if not manifest.exists(): return
        for key, metadata in json.loads(manifest.read_text()).items():
            file = ROOT / metadata["file"]
            if file.exists(): self.models[key] = joblib.load(file)
    def write(self, metadata):
        ROOT.mkdir(exist_ok=True); (ROOT / "registry.json").write_text(json.dumps(metadata, indent=2)); self.reload()

registry = Registry()

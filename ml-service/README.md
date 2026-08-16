# ML service

Run `uvicorn app.main:app --reload` from this directory. `export_dataset.py` exports posture records to ignored parquet datasets; `train_model.py` trains Isolation Forest only with at least 500 rows. Export should run daily (`EXPORT_INTERVAL_MINUTES=1440`); retraining should require `MIN_NEW_ROWS_FOR_RETRAIN=50` beyond the registry row count. Generated datasets and models are not committed.

import { useEffect, useState } from 'react';
import { fetchAssessments, deleteAssessment } from '../api';

export default function HistoryView({ onBack }) {
  const [items, setItems] = useState(null); // null = loading
  const [previewUrl, setPreviewUrl] = useState(null);

 const load = async () => {
  try {
    const data = await fetchAssessments();
    setItems(data);
  } catch (err) {
    console.warn(err);
    setItems([]);
  }
};

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
  try {
    await deleteAssessment(id);
    load();
  } catch (err) {
    console.warn(err);
  }
};

  const formatDate = (ts) =>
    new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="history">
      <div className="brand">HISTORY</div>
      <div className="history-note">Saved on this device only — auto-deletes after 15 days.</div>

      {items === null && <div className="history-empty">Loading…</div>}

      {items && items.length === 0 && (
        <div className="history-empty">No saved sets yet. Finish a set to see it here.</div>
      )}

      {items && items.length > 0 && (
        <div className="history-list">
          {items.map((item) => (
            <div className="history-card" key={item.id}>
              <div className="history-card-main">
                <div className="history-exercise">{item.exercise}</div>
                <div className="history-meta">
                  {formatDate(item.createdAt)} · Score {item.report.avgScore ?? '—'} ·{' '}
                  {item.hoursRemaining < 24
                    ? `${item.hoursRemaining}h left`
                    : `${item.daysRemaining} day${item.daysRemaining === 1 ? '' : 's'} left`}
                </div>
              </div>
              <div className="history-card-actions">
                {item.videoUrl && (
                  <button className="btn-ghost" onClick={() => setPreviewUrl(item.videoUrl)}>
                    ▶ Play
                  </button>
                )}
                <button className="btn-ghost" onClick={() => handleDelete(item.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="report-actions">
        <button className="btn-solid" onClick={onBack}>
          Back
        </button>
      </div>

      {previewUrl && (
        <div className="preview-modal-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="preview-modal-close" onClick={() => setPreviewUrl(null)}>
              ✕
            </button>
            <video
              src={previewUrl}
              controls
              autoPlay
              playsInline
              style={{ width: '100%', maxHeight: '80vh', borderRadius: 8 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
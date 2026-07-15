import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, deleteHistoryEntry, clearHistory } from '../services/api';

function fmt(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function bodyEmoji(bodyTypes) {
  const t = (bodyTypes?.[0] || '').toLowerCase();
  if (t.includes('bus'))   return '🚌';
  if (t.includes('truck')) return '🚛';
  if (t.includes('taxi'))  return '🚕';
  if (t.includes('bike') || t.includes('scoot')) return '🏍️';
  if (t.includes('electric')) return '⚡';
  return '🚗';
}

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [clearing, setClearing] = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  async function fetchHistory() {
    setLoading(true);
    try {
      const data = await getHistory();
      setHistory(data.history || []);
    } catch {
      setError('Failed to load history.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteHistoryEntry(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch {
      alert('Failed to delete entry.');
    }
  }

  async function handleClearAll() {
    if (!window.confirm('Delete all detection history? This cannot be undone.')) return;
    setClearing(true);
    try {
      await clearHistory();
      setHistory([]);
    } catch {
      alert('Failed to clear history.');
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-badge">📋 Your Records</div>
        <h1 className="page-title">Detection History</h1>
        <p className="page-subtitle">All number plates you have scanned, saved automatically to your account.</p>
      </div>

      {loading && (
        <div className="processing-card">
          <div className="spinner" />
          <p>Loading history…</p>
        </div>
      )}

      {error && (
        <div className="error-card">
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn-glass" onClick={fetchHistory}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="history-controls">
            <p className="history-count">
              <strong>{history.length}</strong> detection{history.length !== 1 ? 's' : ''} recorded
            </p>
            {history.length > 0 && (
              <button className="btn-danger-glass" onClick={handleClearAll} disabled={clearing}>
                {clearing ? 'Clearing…' : '🗑 Clear All'}
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">📭</div>
              <h3>No detections yet</h3>
              <p>
                Run your first detection on the{' '}
                <span
                  onClick={() => navigate('/detect')}
                  style={{ color: 'var(--cyan)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Detection page
                </span>
                .
              </p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item, i) => (
                <div
                  className="history-item"
                  key={item.id}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className={`history-plate ${!item.detectedPlate ? 'no-plate' : ''}`}>
                    {item.detectedPlate || 'Not detected'}
                  </div>

                  <div className="history-info">
                    <div className="history-tags">
                      {item.state?.found && (
                        <span className="tag tag-cyan" style={{ fontSize: '0.75rem' }}>
                          {item.state.name}
                        </span>
                      )}
                      {item.fuelType && (
                        <span className="tag tag-green" style={{ fontSize: '0.75rem' }}>
                          {item.fuelType}
                        </span>
                      )}
                      {item.bodyTypes?.length > 0 && (
                        <span className="tag tag-ghost" style={{ fontSize: '0.75rem' }}>
                          {bodyEmoji(item.bodyTypes)} {item.bodyTypes[0]}
                        </span>
                      )}
                      {item.isValid && (
                        <span className="tag tag-green" style={{ fontSize: '0.72rem' }}>✓ Valid</span>
                      )}
                    </div>
                    <div className="history-meta">
                      {item.plateType && <>{item.plateType} &nbsp;·&nbsp;</>}
                      OCR {item.confidence}% &nbsp;·&nbsp; {fmt(item.timestamp)}
                    </div>
                  </div>

                  <button
                    className="btn-danger-glass"
                    style={{ padding: '5px 10px', flexShrink: 0 }}
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

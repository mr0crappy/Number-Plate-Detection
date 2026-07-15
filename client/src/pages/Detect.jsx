import { useState, useEffect } from 'react';
import UploadZone from '../components/UploadZone';
import ResultCard from '../components/ResultCard';
import { analyzeImage } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  'Uploading image to server',
  'Running Tesseract OCR engine',
  'Extracting plate text pattern',
  'Detecting plate color & type',
  'Looking up state and RTO info',
];

export default function Detect() {
  const { user } = useAuth();
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [status, setStatus]     = useState('idle'); // idle | processing | done | error
  const [result, setResult]     = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [stepIdx, setStepIdx]   = useState(0);

  useEffect(() => {
    let t;
    if (status === 'processing') {
      t = setInterval(() => setStepIdx((p) => Math.min(p + 1, STEPS.length - 1)), 900);
    } else {
      setStepIdx(0);
    }
    return () => clearInterval(t);
  }, [status]);

  function handleFileSelect(f) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
  }

  function handleClear() {
    setFile(null);
    setPreview(null);
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
  }

  async function handleAnalyze() {
    if (!file) return;
    setStatus('processing');
    try {
      const data = await analyzeImage(file);
      if (data.success) {
        setResult(data.result);
        setStatus('done');
      } else {
        setErrorMsg(data.message || 'Analysis failed.');
        setStatus('error');
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          'Could not connect to the server. Make sure the backend is running on port 8000.'
      );
      setStatus('error');
    }
  }

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-badge">🇮🇳 Indian Vehicle Registry</div>
        <h1 className="page-title">Number Plate Detection</h1>
        <p className="page-subtitle">
          Upload any vehicle photo — OCR extracts the plate, then we identify the state,
          RTO, vehicle type, and fuel type from the plate color.
          {user && <>{' '}Results are <strong style={{ color: 'var(--cyan)' }}>saved automatically</strong> to your history.</>}
        </p>
      </div>

      {status !== 'done' && (
        <>
          <UploadZone onFileSelect={handleFileSelect} />

          {file && status !== 'processing' && (
            <div className="preview-card">
              <div className="preview-card-header">
                <span>Selected Image</span>
                <button className="btn-danger-glass" onClick={handleClear}>✕ Remove</button>
              </div>
              <div className="preview-card-body">
                <img src={preview} alt="Selected vehicle" />
              </div>
              <div className="preview-card-footer">
                <button className="btn-analyze" onClick={handleAnalyze}>
                  🔍 Detect Number Plate
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {status === 'processing' && (
        <div className="processing-card">
          <div className="spinner" />
          <h3>Analyzing Image…</h3>
          <p>OCR is processing your photo. This may take a few seconds.</p>
          <div className="steps-track">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className={`step-row ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}`}
              >
                <span className="step-dot" />
                {i < stepIdx ? '✓ ' : ''}{step}
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="error-card">
          <h3>⚠️ Detection Failed</h3>
          <p>{errorMsg}</p>
          <button className="btn-glass" onClick={handleClear}>↩ Try Again</button>
        </div>
      )}

      {status === 'done' && result && (
        <ResultCard result={result} onReset={handleClear} />
      )}
    </div>
  );
}

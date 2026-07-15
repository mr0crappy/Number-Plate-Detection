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

function Home() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (status === 'processing') {
      interval = setInterval(() => {
        setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
      }, 900);
    } else {
      setStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  function handleFileSelect(file) {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
  }

  function handleClear() {
    setSelectedFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
  }

  async function handleAnalyze() {
    if (!selectedFile) return;
    setStatus('processing');
    try {
      const data = await analyzeImage(selectedFile);
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
    <div className="page">
      <div className="page-header">
        <div className="badge">🇮🇳 Indian Vehicle Registry</div>
        <h1>Number Plate Detection</h1>
        <p>
          Upload any vehicle photo. The system uses OCR to read the plate, then identifies
          the state, RTO, vehicle type, and fuel type from the plate color.
          {user && (
            <> Results are saved to your <strong>history</strong> automatically.</>
          )}
        </p>
      </div>

      {status !== 'done' && (
        <>
          <UploadZone onFileSelect={handleFileSelect} />

          {selectedFile && status !== 'processing' && (
            <div className="preview-card">
              <div className="preview-card-header">
                <span>Selected Image</span>
                <button className="btn btn-danger" style={{ border: 'none' }} onClick={handleClear}>
                  ✕ Remove
                </button>
              </div>
              <div className="preview-card-body">
                <img src={previewUrl} alt="Selected vehicle" />
              </div>
              <div className="preview-card-footer">
                <button className="btn btn-primary-lg" onClick={handleAnalyze}>
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
          <div className="steps-list">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className={`step-row ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`}
              >
                <span className="step-dot" />
                {i < stepIndex ? '✓ ' : ''}{step}
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="error-card">
          <h3>⚠️ Detection Failed</h3>
          <p>{errorMsg}</p>
          <button className="btn btn-ghost" onClick={handleClear}>↩ Try Again</button>
        </div>
      )}

      {status === 'done' && result && (
        <ResultCard result={result} onReset={handleClear} />
      )}
    </div>
  );
}

export default Home;

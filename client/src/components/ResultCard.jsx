export default function ResultCard({ result, onReset }) {
  const {
    detectedPlate, isValid, confidence,
    state, rto, plateColor, plateType,
    fuelType, vehicleCategory, bodyTypes, rawText,
  } = result;

  function confClass() {
    if (confidence >= 70) return 'high';
    if (confidence >= 40) return 'medium';
    return 'low';
  }

  function confColor() {
    if (confidence >= 70) return '#34d399';
    if (confidence >= 40) return '#fbbf24';
    return '#fb7185';
  }

  function fuelDotClass() {
    const f = (fuelType || '').toLowerCase();
    if (f.includes('electric')) return 'electric';
    if (f.includes('diesel'))   return 'diesel';
    return 'petrol';
  }

  function bodyTag(type) {
    const t = type.toLowerCase();
    if (t.includes('electric') || t.includes('ev')) return 'tag-green';
    if (t.includes('bus') || t.includes('truck'))   return 'tag-orange';
    if (t.includes('taxi'))                         return 'tag-purple';
    return 'tag-cyan';
  }

  function bodyEmoji(type) {
    const t = type.toLowerCase();
    if (t.includes('bus'))   return '🚌';
    if (t.includes('truck')) return '🚛';
    if (t.includes('taxi'))  return '🚕';
    if (t.includes('bike') || t.includes('scoot')) return '🏍️';
    if (t.includes('electric')) return '⚡';
    return '🚗';
  }

  function plateStyle() {
  switch ((plateColor || "").toLowerCase()) {
    case "white":
      return {
        background: "#ffffff",
        color: "#111827",
        border: "3px solid #111827",
      };

    case "yellow":
      return {
        background: "#facc15",
        color: "#111827",
        border: "3px solid #111827",
      };

    case "green":
      return {
        background: "#22c55e",
        color: "#ffffff",
        border: "3px solid #14532d",
      };

    case "blue":
      return {
        background: "#2563eb",
        color: "#ffffff",
        border: "3px solid #0f172a",
      };

    case "black":
      return {
        background: "#111827",
        color: "#ffffff",
        border: "3px solid #374151",
      };

    default:
      return {
        background: "#ffffff",
        color: "#111827",
        border: "3px solid #111827",
      };
  }
}

  return (
    <div className="result-card">
      <div className="result-header">
        <h2>Detection Result</h2>
        {detectedPlate && (
          <span className={`status-badge ${isValid ? 'valid' : 'invalid'}`}>
            {isValid ? '✓ Valid Format' : '✗ Invalid Format'}
          </span>
        )}
      </div>

      <div className="plate-section">
        {detectedPlate
          ? <div
  className="result-plate"
  style={plateStyle()}
>
  {detectedPlate}
</div>
          : <div className="result-plate no-plate">No plate detected</div>}
      </div>

      {detectedPlate && (
        <>
          <div className="info-grid">
            <div className="info-cell">
              <div className="info-label">State</div>
              <div className="info-value">{state?.found ? state.name : 'Unknown'}</div>
              <div className="info-sub">Code: {state?.code || '—'}</div>
            </div>
            <div className="info-cell">
              <div className="info-label">RTO District</div>
              <div className="info-value">{rto?.description || '—'}</div>
              <div className="info-sub">Code: {rto?.code || '—'}</div>
            </div>
            <div className="info-cell">
              <div className="info-label">Plate Type</div>
              <div className="info-value">{plateType || '—'}</div>
              <div className="info-sub">Color: {plateColor || 'White'}</div>
            </div>
            <div className="info-cell">
              <div className="info-label">Format</div>
              <div className="info-value">{isValid ? 'Standard' : 'Non-standard'}</div>
              <div className="info-sub">Indian MoRTH</div>
            </div>
          </div>

          <div className="tag-row">
            <div className="tag-row-label">Category</div>
            <div className="tags">
              <span className="tag tag-cyan">🚗 {vehicleCategory || 'Private Vehicle'}</span>
            </div>
          </div>

          <div className="tag-row">
            <div className="tag-row-label">Body Type</div>
            <div className="tags">
              {(bodyTypes || ['Car']).map((t) => (
                <span key={t} className={`tag ${bodyTag(t)}`}>
                  {bodyEmoji(t)} {t}
                </span>
              ))}
            </div>
          </div>

          <div className="fuel-row">
            <div className="tag-row-label" style={{ minWidth: 'unset', paddingTop: 0 }}>Fuel Type</div>
            <div className={`fuel-dot ${fuelDotClass()}`} />
            <span className="fuel-label">{fuelType || 'Petrol / CNG'}</span>
          </div>
        </>
      )}

      <div className="conf-row">
        <div className="conf-top">
          <span>OCR Confidence</span>
          <span style={{ color: confColor() }}>{confidence}%</span>
        </div>
        <div className="conf-bar">
          <div className={`conf-fill ${confClass()}`} style={{ width: `${confidence}%` }} />
        </div>
      </div>

      {rawText && (
        <div className="raw-row">
          <div className="raw-label">Raw OCR Output</div>
          <div className="raw-box">{rawText}</div>
        </div>
      )}

      <div className="result-actions">
        <button className="btn-ghost-sm" onClick={onReset}>↩ Analyze Another</button>
      </div>
    </div>
  );
}

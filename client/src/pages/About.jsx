export default function About() {
  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-badge">📋 Project Info</div>
        <h1 className="page-title">About PlateDetect</h1>
        <p className="page-subtitle">
          Automatic Indian vehicle number plate detection using OCR and image color analysis.
        </p>
      </div>

      <div className="about-section">
        <h2>Overview</h2>
        <p>
          This system uses Tesseract.js — an open-source OCR engine — to extract text from vehicle
          images. The text is matched against Indian number plate patterns to validate the plate,
          look up the registered state and RTO district, and classify the vehicle type.
        </p>
        <p>
          Sharp performs image color analysis by sampling the plate region to detect its background
          color. Indian plates use standardized colors to indicate vehicle class and fuel type —
          white for private, yellow for commercial, green for electric, and black for rental vehicles.
        </p>
      </div>

      <div className="about-section">
        <h2>How it works</h2>
        <ol className="steps-ol">
          <li>User uploads a vehicle image (JPEG, PNG, WEBP, or BMP)</li>
          <li>Image is sent to the Express.js backend via REST API</li>
          <li>Tesseract.js performs OCR to extract all visible text</li>
          <li>Sharp samples the plate region to detect its background color</li>
          <li>Regex matching isolates the plate number from the OCR text</li>
          <li>Plate is validated against Indian MoRTH format (XX00XX0000)</li>
          <li>State code is looked up from all 36 Indian states and UTs</li>
          <li>Fuel type and vehicle category are inferred from plate color</li>
          <li>If logged in, the result is saved to the user's personal history</li>
        </ol>
      </div>

      <div className="about-section">
        <h2>Plate Color Reference</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { bg: '#fff',    border: '#bbb',    text: '#111',     label: 'White Plate',  desc: 'Private vehicle · Petrol / CNG · Car, Bike, Scooter' },
            { bg: '#fde047', border: '#ca8a04', text: '#111',     label: 'Yellow Plate', desc: 'Commercial vehicle · Diesel · Bus, Truck, Taxi' },
            { bg: '#4ade80', border: '#16a34a', text: '#111',     label: 'Green Plate',  desc: 'Electric vehicle (EV) · Electric · Car, Bus, Auto' },
            { bg: '#18181b', border: '#444',    text: '#fde047',  label: 'Black Plate',  desc: 'Private hire / Rental · Petrol/Diesel · Car, SUV' },
            { bg: '#60a5fa', border: '#2563eb', text: '#111',     label: 'Blue Plate',   desc: 'Diplomatic vehicle · Petrol/Diesel · Car, SUV' },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--glass-border)',
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  width: 56, height: 28, flexShrink: 0,
                  background: row.bg, border: `2px solid ${row.border}`,
                  borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 800, fontSize: '0.65rem', color: row.text,
                }}
              >
                XX 00
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{row.label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="about-section">
        <h2>Tech Stack</h2>
        <div className="tech-grid">
          {[
            { icon: '⚛️', name: 'React 18',       desc: 'Frontend UI library' },
            { icon: '⚡', name: 'Vite',            desc: 'Dev server & bundler' },
            { icon: '🟩', name: 'Express.js',      desc: 'REST API backend' },
            { icon: '🔍', name: 'Tesseract.js',    desc: 'OCR text extraction' },
            { icon: '🖼️', name: 'Sharp',           desc: 'Image color analysis' },
            { icon: '📦', name: 'Multer',          desc: 'Image upload handling' },
            { icon: '🔐', name: 'JWT + bcrypt',    desc: 'Auth & sessions' },
            { icon: '🗄️', name: 'JSON Store',      desc: 'User & history data' },
          ].map((t) => (
            <div className="tech-item" key={t.name}>
              <div className="ti">{t.icon}</div>
              <h4>{t.name}</h4>
              <p>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="about-section" style={{ marginBottom: 0 }}>
        <h2>Tips for best results</h2>
        <ol className="steps-ol">
          <li>Use a clear, well-lit photo with the plate clearly visible</li>
          <li>Frontal or near-frontal angle gives the highest OCR accuracy</li>
          <li>Avoid shadows, glare, or reflections on the plate surface</li>
          <li>Clean plates free from mud, stickers, or damage work best</li>
        </ol>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: '🔍', title: 'OCR Text Extraction', description: 'Tesseract.js reads plate characters with high accuracy from any vehicle photo.' },
  { icon: '🎨', title: 'Plate Color Analysis', description: 'Sharp library samples the image to detect plate color and classify fuel type.' },
  { icon: '🏛️', title: 'State & RTO Lookup', description: 'Instantly identifies the registered state and RTO district from the plate code.' },
  { icon: '🚗', title: 'Vehicle Classification', description: 'Determines vehicle category and body type from plate color and series letters.' },
  { icon: '📋', title: 'Personal History', description: 'Every scan is saved to your account so you can review past detections anytime.' },
  { icon: '🔐', title: 'Secure Accounts', description: 'JWT authentication with bcrypt-hashed passwords keeps your data private.' },
];

const STEPS = [
  { title: 'Upload a photo', desc: 'Drop any vehicle image — car, bike, bus, or truck — on the detection page.' },
  { title: 'OCR + analysis', desc: 'Our engine reads the plate, detects its color, and looks up all registration data.' },
  { title: 'Instant results', desc: 'Get the plate number, state, RTO, vehicle type, fuel type, and OCR confidence.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="landing">
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="brand-icon">🔍</div>
            <span>PlateDetect</span>
          </div>
          <div className="landing-nav-links">
            {user ? (
              <button className="btn-gradient" onClick={() => navigate('/detect')}>
                Open Detection →
              </button>
            ) : (
              <>
                <button className="btn-glass" onClick={() => navigate('/login')}>Sign In</button>
                <button className="btn-gradient" onClick={() => navigate('/signup')}>Sign Up Free</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">✦ Powered by Tesseract OCR</div>
          <h1 className="hero-title">
            Detect Indian<br />
            Vehicle Plates{' '}
            <span className="gradient-text">Instantly</span>
          </h1>
          <p className="hero-subtitle">
            Upload any vehicle photo and get the number plate, registered state,
            RTO district, vehicle category, and fuel type — all within seconds.
          </p>
          <div className="hero-actions">
            {user ? (
              <button className="btn-gradient-lg" onClick={() => navigate('/detect')}>
                Open Detection →
              </button>
            ) : (
              <>
                <button className="btn-gradient-lg" onClick={() => navigate('/signup')}>
                  Sign Up to Start Detecting →
                </button>
                <button className="btn-glass-lg" onClick={() => navigate('/login')}>
                  Sign In
                </button>
              </>
            )}
          </div>

          <div className="hero-stats">
            <div>
              <div className="hero-stat-num">36+</div>
              <div className="hero-stat-label">States & UTs</div>
            </div>
            <div>
              <div className="hero-stat-num">5</div>
              <div className="hero-stat-label">Plate Types</div>
            </div>
            <div>
              <div className="hero-stat-num">100%</div>
              <div className="hero-stat-label">Free to use</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="plate-demo">
            <div className="plate-frame">
              <div className="plate-text">MH 12 AB 1234</div>
            </div>
            <div className="plate-bubbles">
              <div className="plate-bubble">🏛️ Maharashtra</div>
              <div className="plate-bubble">⛽ Petrol / CNG</div>
              <div className="plate-bubble">🚗 Private Car</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section">
        <div className="section-label">Features</div>
        <h2 className="section-title">Everything in one place</h2>
        <p className="section-subtitle">
          From OCR text extraction to fuel type detection — all the data you need
          from a single vehicle image.
        </p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div
              className="feature-card"
              key={f.title}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="section-label">Process</div>
        <h2 className="section-title">How it works</h2>
        <p className="section-subtitle">Three simple steps from photo to full vehicle data.</p>
        <div className="steps-row">
          {STEPS.map((step, i) => (
            <div className="step-card" key={step.title} style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="step-num">{i + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plate Color Guide */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="section-label">Detection Logic</div>
        <h2 className="section-title">Plate Color → Vehicle Type</h2>
        <p className="section-subtitle">Indian plates use standardized colors to indicate vehicle class and fuel.</p>
        <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {[
            { color: '#fff', border: '#999', text: '#111', label: 'White', sub: 'Private · Petrol/CNG' },
            { color: '#fde047', border: '#ca8a04', text: '#111', label: 'Yellow', sub: 'Commercial · Diesel' },
            { color: '#4ade80', border: '#16a34a', text: '#111', label: 'Green', sub: 'Electric Vehicle' },
            { color: '#1a1a2e', border: '#444', text: '#fde047', label: 'Black', sub: 'Rental · Private Hire' },
            { color: '#60a5fa', border: '#2563eb', text: '#111', label: 'Blue', sub: 'Diplomatic' },
          ].map((p) => (
            <div className="feature-card" key={p.label} style={{ textAlign: 'center' }}>
              <div style={{
                width: 70, height: 36,
                background: p.color, border: `2.5px solid ${p.border}`,
                borderRadius: 6, margin: '0 auto 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
                fontSize: '0.7rem', color: p.text,
              }}>
                XX 00
              </div>
              <h3 style={{ fontSize: '0.9rem' }}>{p.label} Plate</h3>
              <p style={{ fontSize: '0.8rem' }}>{p.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <h2>Ready to detect?</h2>
          <p>
            Create a free account and start scanning vehicle number plates in seconds.
            Your history is saved automatically.
          </p>
          {user ? (
            <button className="btn-gradient-lg" onClick={() => navigate('/detect')}>
              Open Detection App →
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-gradient-lg" onClick={() => navigate('/signup')}>
                Sign Up Free →
              </button>
              <button className="btn-glass-lg" onClick={() => navigate('/login')}>
                Sign In
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

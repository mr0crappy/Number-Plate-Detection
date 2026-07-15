import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      authLogin(data.user, data.token);
      navigate('/detect');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="bg-orbs">
        <div className="orb orb-1" /><div className="orb orb-2" />
        <div className="orb orb-3" /><div className="orb orb-4" />
      </div>
      <div className="auth-page">
        <div className="auth-brand" onClick={() => navigate('/')}>
          <div className="brand-icon">🔍</div>
          <span>PlateDetect</span>
        </div>

        <div className="auth-card">
          <h2>Welcome back</h2>
          <p>Log in to access your detection history</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" name="email" className="form-input"
                placeholder="you@example.com" value={form.email}
                onChange={handleChange} autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-input"
                placeholder="Enter your password" value={form.password}
                onChange={handleChange} autoComplete="current-password" />
            </div>
            {error && <p className="form-error">⚠ {error}</p>}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/signup')}>
            Create one free
          </span>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const data = await signup(form.name, form.email, form.password);
      authLogin(data.user, data.token);
      navigate('/detect');
    } catch (err) {
      setError(err.response?.data?.message || 'Sign up failed. Please try again.');
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
          <h2>Create account</h2>
          <p>Sign up free to save your detection history</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input type="text" name="name" className="form-input"
                placeholder="Rahul Sharma" value={form.name}
                onChange={handleChange} autoComplete="name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" name="email" className="form-input"
                placeholder="you@example.com" value={form.email}
                onChange={handleChange} autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-input"
                placeholder="Min. 6 characters" value={form.password}
                onChange={handleChange} autoComplete="new-password" />
            </div>
            {error && <p className="form-error">⚠ {error}</p>}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          Already have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/login')}>Log in</span>
        </div>
      </div>
    </>
  );
}

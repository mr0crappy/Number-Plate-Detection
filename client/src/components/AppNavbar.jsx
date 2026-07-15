import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '';

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="app-navbar">
      <div className="app-navbar-inner">
        <NavLink to="/" className="landing-brand" style={{ textDecoration: 'none' }}>
          <div className="brand-icon">🔍</div>
          <span>PlateDetect</span>
        </NavLink>

        <div className="app-nav-links">
          <NavLink
            to="/detect"
            className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
          >
            Detection
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
          >
            History
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
          >
            About
          </NavLink>

          {user && (
            <>
              <div className="nav-divider" />
              <div className="nav-user">
                <div className="nav-avatar">{initials}</div>
                <span className="nav-name">{user.name}</span>
                <button className="btn-sign-out" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

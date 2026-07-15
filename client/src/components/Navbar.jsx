import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const initials = user ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <div className="brand-icon">🔍</div>
          <span>PlateDetect</span>
        </NavLink>

        <div className="navbar-right">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Detection
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            About
          </NavLink>

          {user ? (
            <>
              <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                History
              </NavLink>
              <div className="navbar-divider" />
              <div className="nav-user">
                <div className="nav-user-avatar">{initials}</div>
                <span className="nav-user-name">{user.name}</span>
                <button className="btn-nav-logout" onClick={handleLogout} title="Log out">
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="navbar-divider" />
              <NavLink to="/login" className="nav-link">Log in</NavLink>
              <NavLink to="/signup">
                <button className="btn-nav-primary">Sign up</button>
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

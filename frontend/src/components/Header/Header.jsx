import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { authService } from '../../services/authService';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(authService.getUser());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(authService.getUser());
      setMenuOpen(false);
    };

    const unsubscribe = authService.subscribe(handleAuthChange);
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleAuthChange);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleAuthChange);
      }
    };
  }, []);

  useEffect(() => {
    // Close menu when navigating to a new route
    setMenuOpen(false);
  }, [location.pathname]);

  const isAuthenticated = !!currentUser;

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/auth');
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const renderAuthButton = () =>
    isAuthenticated ? (
      <button type="button" className="header-action-button" onClick={handleLogout}>
        Logout
      </button>
    ) : (
      <button type="button" className="header-action-button" onClick={handleLogin}>
        Login
      </button>
    );

  return (
    <header className="header">
      <div className="header-container">
        <button type="button" className="header-logo" onClick={handleLogoClick}>
          CryptoPal
        </button>
        <div className="header-actions">
          <div className={`header-buttons ${menuOpen ? 'open' : ''}`}>
            <ThemeToggle />
            {renderAuthButton()}
          </div>
          <button
            type="button"
            className={`header-hamburger ${menuOpen ? 'open' : ''}`}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={toggleMenu}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;


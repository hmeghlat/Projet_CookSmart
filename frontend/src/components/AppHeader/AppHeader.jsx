import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./AppHeader.css";

function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(Boolean(localStorage.getItem("token")));
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const activePath = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/");
  };

  const shouldShowNav = isLoggedIn;

  return (
    <header className="app-header">
      <div
        className={`app-header-content ${shouldShowNav ? "app-header-content--with-nav" : ""}`}
      >
        <Link to="/" className="app-logo">
          <div className="app-logo-icon">
            <span>C</span>
          </div>
          <span className="app-logo-text">
            ook<span>Smart</span>
          </span>
        </Link>

        {shouldShowNav && (
          <>
            <button
              type="button"
              className="app-nav-toggle"
              aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="app-nav"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
            >
              <span className="app-nav-toggle-icon" aria-hidden="true">
                {isMobileMenuOpen ? "✕" : "☰"}
              </span>
            </button>

            <nav
              id="app-nav"
              className={`app-nav-menu ${isMobileMenuOpen ? "app-nav-menu--open" : ""}`}
            >
            <Link
              to="/"
              className={`app-nav-link ${activePath === "/" ? "active" : ""}`}
            >
              Accueil
            </Link>

            <Link
              to="/mon-frigo"
              className={`app-nav-link ${activePath.startsWith("/mon-frigo") ? "active" : ""}`}
            >
              Mon Frigo
            </Link>
            <Link
              to="/recettes"
              className={`app-nav-link ${activePath.startsWith("/recettes") ? "active" : ""}`}
            >
              Recettes
            </Link>
            <Link
              to="/mes-matchs"
              className={`app-nav-link ${activePath.startsWith("/mes-matchs") ? "active" : ""}`}
            >
              Mes Matchs
            </Link>
            <button
              type="button"
              data-testid="logout-button"
              className="app-nav-link app-nav-link-button"
              onClick={handleLogout}
            >
              Déconnexion
            </button>
            </nav>
          </>
        )}
      </div>
    </header>
  );
}

export default AppHeader;

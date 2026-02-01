import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./AppHeader.css";

function AppHeader({ showNavWhenLoggedOut = false }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(Boolean(localStorage.getItem("token")));
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const activePath = useMemo(() => location.pathname, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  const shouldShowNav = isLoggedIn || showNavWhenLoggedOut;

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
          <nav className="app-nav-menu">
            <Link
              to="/"
              className={`app-nav-link ${activePath === "/" ? "active" : ""}`}
            >
              Accueil
            </Link>

            {isLoggedIn ? (
              <>
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
                  className="app-nav-link app-nav-link-button"
                  onClick={handleLogout}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`app-nav-link ${activePath.startsWith("/login") ? "active" : ""}`}
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className={`app-nav-link ${activePath.startsWith("/register") ? "active" : ""}`}
                >
                  Inscription
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

export default AppHeader;

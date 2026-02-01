import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../../components/AppHeader/AppHeader.jsx";
import "./HomePage.css";

function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(Boolean(localStorage.getItem("token")));
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  return (
    <div className="home-page">
      <AppHeader showNavWhenLoggedOut={false} />

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Arrêtez de jeter,
            <br />
            commencez à vous <span className="highlight">régaler</span>
          </h1>
          <p>
            Rejoignez la communauté anti-gaspi. Cuisinez intelligemment avec ce
            que vous avez déjà et réduisez vos déchets alimentaires.
          </p>
          {!isLoggedIn ? (
            <div className="hero-cta">
              <Link to="/register" className="btn btn-hero-primary">
                Inscription
              </Link>
              <Link to="/login" className="btn btn-hero-secondary">
                Connexion
              </Link>
            </div>
          ) : (
            <div className="hero-cta">
              <Link to="/mon-frigo" className="btn btn-hero-primary">
                Aller à mon frigo
              </Link>
              <Link to="/mes-matchs" className="btn btn-hero-secondary">
                Voir mes matchs
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="how-it-works">
        <div className="section-header">
          <h2 className="section-title">Comment ça marche ?</h2>
          <p className="section-subtitle">
            Trois étapes pour cuisiner sans gaspiller
          </p>
        </div>
        <div className="steps-container">
          <div className="step-card">
            <span className="step-number">1</span>
            <span className="step-icon">📋</span>
            <h3 className="step-title">Enregistrez vos ingrédients</h3>
            <p className="step-description">
              Ajoutez les aliments de votre frigo avec leurs dates d'expiration
              pour un suivi précis.
            </p>
          </div>
          <div className="step-card">
            <span className="step-number">2</span>
            <span className="step-icon">🎯</span>
            <h3 className="step-title">Découvrez les recettes</h3>
            <p className="step-description">
              Notre algorithme analyse votre inventaire et vous propose des
              recettes adaptées.
            </p>
          </div>
          <div className="step-card">
            <span className="step-number">3</span>
            <span className="step-icon">✨</span>
            <h3 className="step-title">Cuisinez et économisez</h3>
            <p className="step-description">
              Utilisez vos ingrédients avant qu'ils ne périment et réduisez
              votre gaspillage.
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="stats-content">
          <div className="stat-item">
            <div className="stat-number">19kg</div>
            <div className="stat-label">
              de nourriture comestible
              <br />
              jetés par foyer/an
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-number">20%</div>
            <div className="stat-label">
              du gaspillage lié au
              <br />
              manque d'inspiration
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">
              gratuit et sans
              <br />
              engagement
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Prêt à révolutionner votre cuisine ?</h2>
          <p>
            Rejoignez des milliers d'utilisateurs qui ont dit stop au
            gaspillage.
          </p>
          {!isLoggedIn ? (
            <Link to="/register" className="btn btn-cta-white">
              Créer mon compte
            </Link>
          ) : (
            <Link to="/recettes" className="btn btn-cta-white">
              Découvrir les recettes
            </Link>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2025 CookSmart. Tous droits réservés.</p>
      </footer>
    </div>
  );
}

export default HomePage;
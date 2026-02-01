import { useApiPost } from "../../services/useApiPost.jsx";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AppHeader from "../../components/AppHeader/AppHeader.jsx";
import "./LoginPage.css";

function LoginPage() {
  const { postData, data, loading, error } = useApiPost();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting form data:", formData);
      const result = await postData(
        "https://127.0.0.1:8000/api/login_check",
        formData
      );
      console.log("Connexion réussie:", result.token);

      // Stocker le token si présent
      if (result.token) {
        localStorage.setItem("token", result.token);
      }

      // Rediriger vers la page d'accueil
      navigate("/");
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  return (
    <div className="login-page">
      <AppHeader showNavWhenLoggedOut={false} />

      {/* LOGIN CONTAINER */}
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Connexion</h1>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mot de passe *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>

            <p className="signup-link">
              Vous n'avez pas de compte ?{" "}
              <Link to="/register" className="link">
                Inscrivez-vous
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
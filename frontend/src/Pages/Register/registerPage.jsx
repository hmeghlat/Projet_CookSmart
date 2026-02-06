import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./RegisterPage.css";
import { useApiPost } from "../../services/useApiPost.jsx";
import AppHeader from "../../components/AppHeader/AppHeader.jsx";

function RegisterPage() {
  const { postData, data, loading, error } = useApiPost();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pseudo: "",
    email: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Effacer l'erreur du champ modifié
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: "",
      });
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Réinitialiser les erreurs
    setValidationErrors({});

    const errors = {};

    // Validation pseudo
    if (!formData.pseudo || formData.pseudo.length < 3) {
      errors.pseudo =
        "Le nom d'utilisateur doit contenir au moins 3 caractères";
    }

    // Validation email
    if (!validateEmail(formData.email)) {
      errors.email = "Format d'email invalide (xxx@xxx.xxx)";
    }

    // Validation mot de passe
    if (!validatePassword(formData.password)) {
      errors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }

    // Si des erreurs existent, les afficher et arrêter
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      console.log("Submitting form data:", formData);
      const result = await postData(
        "https://127.0.0.1:8000/api/register",
        formData
      );
      console.log("Inscription réussie:", result);

      // Rediriger vers la page de connexion après inscription
      navigate("/login");
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  return (
    <div className="register-page">
      <AppHeader />

      {/* REGISTER CONTAINER */}
      <div className="register-container">
        <div className="register-card">
          <h1 className="register-title">Inscription</h1>
          <p className="register-subtitle">
            Rejoignez la communauté anti-gaspi
          </p>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="pseudo" className="form-label">
                Nom d'utilisateur *
              </label>
              <input
                type="text"
                id="pseudo"
                name="pseudo"
                placeholder="JohnDoe"
                value={formData.pseudo}
                onChange={handleChange}
                className={`form-input ${
                  validationErrors.pseudo ? "input-error" : ""
                }`}
                required
              />
              {validationErrors.pseudo && (
                <span className="error-text">{validationErrors.pseudo}</span>
              )}
            </div>

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
                className={`form-input ${
                  validationErrors.email ? "input-error" : ""
                }`}
                required
              />
              {validationErrors.email && (
                <span className="error-text">{validationErrors.email}</span>
              )}
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
                className={`form-input ${
                  validationErrors.password ? "input-error" : ""
                }`}
                required
              />
              {validationErrors.password && (
                <span className="error-text">{validationErrors.password}</span>
              )}
              <span className="helper-text">
                Minimum 8 caractères
              </span>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? "Inscription en cours..." : "S'inscrire"}
            </button>

            <p className="login-link">
              Vous avez déjà un compte ?{" "}
              <Link to="/login" className="link">
                Connectez-vous
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
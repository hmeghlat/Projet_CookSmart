import { useParams, useNavigate } from "react-router-dom";
import { useApiFetch } from "../../services/useApiFetch.jsx";
import AppHeader from "../AppHeader/AppHeader.jsx";
import "./RecetteDetailPage.css";

function RecetteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: recipe, loading, error } = useApiFetch(
    `https://127.0.0.1:8000/api/recipes/${id}`
  );

  const formatPrepTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  // Séparer la description en étapes si elle contient des numéros ou des retours à la ligne
  const parseSteps = (description) => {
    if (!description) return [];
    
    // Si la description contient des numéros suivis d'un point ou d'une parenthèse
    const numberedSteps = description.match(/\d+[\.\)]\s*[^\d]+/g);
    if (numberedSteps && numberedSteps.length > 1) {
      return numberedSteps.map((step, index) => ({
        number: index + 1,
        text: step.replace(/^\d+[\.\)]\s*/, "").trim(),
      }));
    }
    
    // Sinon, séparer par les retours à la ligne
    const lines = description.split(/\n+/).filter((line) => line.trim());
    if (lines.length > 1) {
      return lines.map((line, index) => ({
        number: index + 1,
        text: line.trim(),
      }));
    }
    
    // Sinon, retourner la description complète comme une seule étape
    return [{ number: 1, text: description }];
  };

  const steps = recipe ? parseSteps(recipe.description) : [];

  return (
    <div className="recipe-detail-page">
      <AppHeader />

      {/* MAIN CONTENT */}
      <main className="main-content">
        {loading && <p className="loading-text">Chargement...</p>}
        {error && (
          <div className="error-container">
            <p className="error-text">Erreur: {error}</p>
            <button onClick={() => navigate("/recettes")} className="btn-back">
              Retour aux recettes
            </button>
          </div>
        )}

        {!loading && !error && recipe && (
          <div className="recipe-detail-wrapper">
            {/* Back Button */}
            <button onClick={() => navigate("/recettes")} className="btn-back">
              ← Retour aux recettes
            </button>

            {/* Recipe Header */}
            <div className="recipe-header">
              <h1 className="recipe-title">{recipe.title}</h1>
              <div className="recipe-meta">
                <span className="recipe-time">
                  ⏱️ {formatPrepTime(recipe.prepTime)}
                </span>
              </div>
            </div>

            {/* Recipe Image */}
            <div className="recipe-image-large">
              {recipe.imageUrl ? (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="recipe-image"
                />
              ) : (
                <div className="recipe-image-placeholder-large">
                  <span>🍽️</span>
                </div>
              )}
            </div>

            {/* Ingredients Section */}
            {recipe.recipeIngredients && recipe.recipeIngredients.length > 0 && (
              <section className="recipe-section">
                <h2 className="section-title">Ingrédients</h2>
                <ul className="ingredients-list">
                  {recipe.recipeIngredients.map((recipeIngredient, index) => (
                    <li key={index} className="ingredient-item">
                      <span className="ingredient-icon">
                        {recipeIngredient.ingredient.icon || "🍽️"}
                      </span>
                      <span className="ingredient-name">{recipeIngredient.ingredient.name}</span>
                      {recipeIngredient.quantity !== null && (
                        <span className="ingredient-quantity">
                           {recipeIngredient.quantity}
                        </span>
                      )}
                      {recipeIngredient.unit && (
                        <span className="ingredient-unit">
                          ({recipeIngredient.unit})
                        </span>
                      )}
                     
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Preparation Steps */}
            <section className="recipe-section">
              <h2 className="section-title">Préparation</h2>
              <ol className="preparation-steps">
                {steps.map((step) => (
                  <li key={step.number} className="step-item">
                    <span className="step-number">{step.number}</span>
                    <span className="step-text">{step.text}</span>
                  </li>
                ))}
              </ol>
            </section>

            {/* Back Button Bottom */}
            <div className="recipe-footer">
              <button onClick={() => navigate("/recettes")} className="btn-back-large">
                ← Retour aux recettes
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default RecetteDetailPage;

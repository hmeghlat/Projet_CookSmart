import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApiFetch } from "../../services/useApiFetch.jsx";
import AppHeader from "../../components/AppHeader/AppHeader.jsx";
import "./MatchPage.css";

function MatchPage() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApiFetch(
    "https://127.0.0.1:8000/api/matching",
  );

  const [expandedByRecipeId, setExpandedByRecipeId] = useState({});

  const results = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return Array.isArray(data.results) ? data.results : [];
  }, [data]);

  const toggleExpanded = (recipeId) => {
    setExpandedByRecipeId((prev) => ({
      ...prev,
      [recipeId]: !prev[recipeId],
    }));
  };

  const formatPrepTime = (minutes) => {
    if (minutes === null || minutes === undefined) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  const humanizeReason = (reason) => {
    switch (reason) {
      case "absent":
        return "Absent de votre frigo";
      case "quantite_insuffisante":
        return "Quantité insuffisante";
      case "unite_differente":
        return "Unité différente";
      default:
        return reason || "Manquant";
    }
  };

  const isUnauthorized = (error || "").toLowerCase().includes("401");

  return (
    <div className="match-page">
      <AppHeader />

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="content-wrapper">
          <div className="page-header">
            <div className="page-header-left">
              <h1 className="page-title">Mes Matchs</h1>
              {!loading && !error && (
                <p className="match-count">
                  {results.length} recette{results.length > 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div className="page-header-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={refetch}
                disabled={loading}
                data-testid="refresh-matches-button"
              >
                Rafraîchir
              </button>
            </div>
          </div>

          {loading && <p className="loading-text">Chargement...</p>}

          {error && (
            <div className="error-container">
              <p className="error-text">Erreur: {error}</p>
              <div className="error-actions">
                {isUnauthorized && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => navigate("/login")}
                  >
                    Se connecter
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={refetch}
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="empty-state">
              <p className="empty-icon">🎯</p>
              <p className="empty-text">Aucun match pour le moment</p>
              <p className="empty-subtext">
                Ajoutez des ingrédients dans votre frigo pour obtenir des
                suggestions.
              </p>
              <Link className="btn-primary" to="/mon-frigo">
                Aller à Mon Frigo
              </Link>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="match-grid">
              {results.map((item) => {
                const recipe = item.recipe || {};
                const recipeId = recipe.id;
                const expanded = Boolean(expandedByRecipeId[recipeId]);

                const total = item.totalIngredients ?? 0;
                const matched = item.matchedIngredients ?? 0;
                const score = item.score ?? 0;
                const label = item.label ?? "";

                return (
                  <div
                    key={recipeId}
                    className="match-card"
                    data-testid="match-card"
                  >
                    <div className="match-card-top">
                      <div className="match-image-container">
                        {recipe.imageUrl ? (
                          <img
                            src={recipe.imageUrl}
                            alt={recipe.title}
                            className="match-image"
                          />
                        ) : (
                          <div className="match-image-placeholder">🍽️</div>
                        )}
                      </div>

                      <div className="match-card-content">
                        <div className="match-card-header">
                          <h3 className="match-title">{recipe.title}</h3>
                          <span className="match-score">{score}%</span>
                        </div>

                        <div className="match-meta">
                          {recipe.prepTime !== null &&
                            recipe.prepTime !== undefined && (
                              <span className="match-time">
                                ⏱️ {formatPrepTime(recipe.prepTime)}
                              </span>
                            )}
                          <span className="match-ingredients">
                            🧺 {matched}/{total} ingrédients
                          </span>
                        </div>

                        <div className="match-label">{label}</div>

                        <div className="match-progress">
                          <div className="match-progress-track">
                            <div
                              className="match-progress-fill"
                              style={{
                                width: `${Math.max(0, Math.min(100, score))}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="match-actions">
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => navigate(`/recettes/${recipeId}`)}
							data-testid="view-matched-recipe-button"
                          >
                            Voir la recette
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => toggleExpanded(recipeId)}
                            data-testid="match-details-button"
                          >
                            {expanded ? "Masquer le détail" : "Voir le détail"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {expanded && (
                      <div className="match-details">
                        <div className="match-details-column">
                          <h4 className="details-title">✅ Déjà disponible</h4>
                          {Array.isArray(item.have) && item.have.length > 0 ? (
                            <ul className="details-list">
                              {item.have.map((h) => (
                                <li
                                  key={`have-${recipeId}-${h.ingredientId}`}
                                  className="details-item"
                                >
                                  <span className="details-name">{h.name}</span>
                                  <span className="details-qty">
                                    {h.inventoryQuantity} {h.inventoryUnit}
                                    {h.requiredQuantity !== null &&
                                      h.requiredQuantity !== undefined && (
                                        <>
                                          {" "}
                                          / requis: {h.requiredQuantity}{" "}
                                          {h.requiredUnit || h.inventoryUnit}
                                        </>
                                      )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="details-empty">
                              Aucun ingrédient reconnu.
                            </p>
                          )}
                        </div>

                        <div className="match-details-column">
                          <h4 className="details-title">
                            ❌ Manquant / à compléter
                          </h4>
                          {Array.isArray(item.missing) &&
                          item.missing.length > 0 ? (
                            <ul className="details-list">
                              {item.missing.map((m) => (
                                <li
                                  key={`missing-${recipeId}-${m.ingredientId}`}
                                  className="details-item"
                                >
                                  <span className="details-name">{m.name}</span>
                                  <span className="details-qty">
                                    {m.requiredQuantity !== null &&
                                    m.requiredQuantity !== undefined
                                      ? `Requis: ${m.requiredQuantity} ${m.requiredUnit || ""}`
                                      : "Quantité requise non renseignée"}
                                  </span>
                                  <span className="details-reason">
                                    {humanizeReason(m.reason)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="details-empty">Rien ne manque 🎉</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MatchPage;

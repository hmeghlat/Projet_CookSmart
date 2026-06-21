import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApiFetch } from "../../services/useApiFetch.jsx";
import AppHeader from "../../components/AppHeader/AppHeader.jsx";
import "./RecettesPage.css";

function RecettesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les filtres depuis localStorage
  useEffect(() => {
    const savedDifficulty = localStorage.getItem("recipeDifficulty");
    const savedTimeFilter = localStorage.getItem("recipeTimeFilter");
    if (savedDifficulty) setDifficulty(savedDifficulty);
    if (savedTimeFilter) setTimeFilter(savedTimeFilter);
  }, []);

  // Construire l'URL avec les filtres
  const buildApiUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (difficulty) params.append("difficulty", difficulty);
    
    // Filtres de temps
    if (timeFilter === "15") {
      params.append("timeMax", 15);
    } else if (timeFilter === "15-30") {
      params.append("timeMin", 15);
      params.append("timeMax", 30);
    } else if (timeFilter === "30-60") {
      params.append("timeMin", 30);
      params.append("timeMax", 60);
    } else if (timeFilter === "60+") {
      params.append("timeMin", 60);
    }

    return `https://127.0.0.1:8000/api/recipes?${params.toString()}`;
  };

  const apiUrl = buildApiUrl();
  const { data, loading: apiLoading, error, refetch } = useApiFetch(apiUrl);

  useEffect(() => {
    if (data?.recipes) {
      setRecipes(data.recipes);
      setFilteredRecipes(data.recipes);
    }
    setLoading(apiLoading);
  }, [data, apiLoading]);

  // Sauvegarder les filtres dans localStorage
  useEffect(() => {
    if (difficulty) {
      localStorage.setItem("recipeDifficulty", difficulty);
    } else {
      localStorage.removeItem("recipeDifficulty");
    }
  }, [difficulty]);

  useEffect(() => {
    if (timeFilter) {
      localStorage.setItem("recipeTimeFilter", timeFilter);
    } else {
      localStorage.removeItem("recipeTimeFilter");
    }
  }, [timeFilter]);

  const formatPrepTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  const handleRecipeClick = (recipeId) => {
    navigate(`/recettes/${recipeId}`);
  };

  return (
    <div className="recettes-page">
      <AppHeader />

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="content-wrapper">
          {/* PAGE HEADER */}
          <div className="page-header">
            <h1 className="page-title">Recettes</h1>
            {filteredRecipes.length > 0 && (
              <p className="recipe-count">
                {filteredRecipes.length} recette{filteredRecipes.length > 1 ? "s" : ""} disponible{filteredRecipes.length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* SEARCH AND FILTERS */}
          <div className="search-filters-section">
            {/* Search Bar */}
            <div className="search-container">
              <input data-testid="recipe-search"
                type="text"
                className="search-input"
                placeholder="Rechercher une recette..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="filters-container">
              <div className="filter-group">
                <label className="filter-label">Difficulté</label>
                <select
                  className="filter-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="">Toutes</option>
                  <option value="facile">Facile</option>
                  <option value="moyen">Moyen</option>
                  <option value="difficile">Difficile</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Temps</label>
                <select
                  className="filter-select"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option value="">Tous</option>
                  <option value="15">&lt; 15 min</option>
                  <option value="15-30">15-30 min</option>
                  <option value="30-60">30-60 min</option>
                  <option value="60+">&gt; 1h</option>
                </select>
              </div>
            </div>
          </div>

          {/* RECIPES GRID */}
          {loading && <p className="loading-text">Chargement...</p>}
          {error && <p className="error-text">Erreur: {error}</p>}

          {!loading && !error && filteredRecipes.length === 0 && (
            <div className="empty-state">
              <p className="empty-icon">🍳</p>
              <p className="empty-text">Aucune recette trouvée</p>
              <p className="empty-subtext">
                {searchQuery || difficulty || timeFilter
                  ? "Essayez de modifier vos critères de recherche"
                  : "Aucune recette disponible pour le moment"}
              </p>
            </div>
          )}

          {!loading && !error && filteredRecipes.length > 0 && (
            <div className="recipes-grid">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="recipe-card"
                  onClick={() => handleRecipeClick(recipe.id)}
                >
                  <div className="recipe-image-container">
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        className="recipe-image"
                      />
                    ) : (
                      <div className="recipe-image-placeholder">
                        <span>🍽️</span>
                      </div>
                    )}
                  </div>
                  <div className="recipe-card-content">
                    <h3 className="recipe-card-title">{recipe.title}</h3>
                    <div className="recipe-card-meta">
                      <span className="recipe-time">
                        ⏱️ {formatPrepTime(recipe.prepTime)}
                      </span>
                    </div>
                    <button className="recipe-card-button">
                      Voir la recette
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default RecettesPage;

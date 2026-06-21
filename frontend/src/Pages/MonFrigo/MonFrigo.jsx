import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useApiFetch } from "../../services/useApiFetch.jsx";
import { useApiPost } from "../../services/useApiPost.jsx";
import AppHeader from "../../components/AppHeader/AppHeader.jsx";
import "./MonFrigo.css";
import IngredientCard from "../../components/IngredientCard.jsx";

function MonFrigo() {
  const { data, loading, error, refetch } = useApiFetch(
    "https://127.0.0.1:8000/api/inventories",
  );
  const { postData, putData, deleteData } = useApiPost();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const inventories = Array.isArray(data) ? data : [];

  const [formData, setFormData] = useState({
    ingredient_id: "",
    ingredient_name: "",
    quantity: "",
    unit: "",
    exp_date: "",
  });

  // États pour l'autocomplete
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [ingredientSuggestions, setIngredientSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Formater la date d'expiration pour l'affichage
  const formatExpDate = (expDate) => {
    if (!expDate) return null;
    try {
      return new Date(expDate).toLocaleDateString("fr-FR");
    } catch {
      return null;
    }
  };

  // Trier les ingrédients par date d'expiration
  const sortedData = [...inventories].sort((a, b) => {
    if (!a.expDate) return 1;
    if (!b.expDate) return -1;
    return new Date(a.expDate) - new Date(b.expDate);
  });

  // Recherche d'ingrédients avec debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (ingredientSearch.length < 2) {
      setIngredientSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          `https://127.0.0.1:8000/api/ingredients/search?q=${encodeURIComponent(ingredientSearch)}`,
          { headers },
        );

        if (response.ok) {
          const result = await response.json();
          setIngredientSuggestions(result.ingredients || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Erreur lors de la recherche:", err);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [ingredientSearch]);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleIngredientSelect = (ingredient) => {
    setFormData({
      ...formData,
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name,
      unit: ingredient.unit || "",
    });
    setIngredientSearch(ingredient.name);
    setShowSuggestions(false);
  };

  const handleIngredientSearchChange = (e) => {
    setIngredientSearch(e.target.value);
    setFormData({
      ...formData,
      ingredient_id: "",
      ingredient_name: e.target.value,
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setSuccessMessage(null);
    setFormData({
      ingredient_id: "",
      ingredient_name: "",
      quantity: "",
      unit: "",
      exp_date: "",
    });
    setIngredientSearch("");
    setShowSuggestions(false);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setIsEditMode(true);
    setSelectedItem(item);
    setSuccessMessage(null);
    setFormData({
      ingredient_id: item.ingredient?.id || "",
      ingredient_name: item.ingredient?.name || "",
      quantity: item.quantity,
      unit: item.unit,
      exp_date: item.expDate
        ? new Date(item.expDate).toISOString().split("T")[0]
        : "",
    });
    setIngredientSearch(item.ingredient?.name || "");
    setShowSuggestions(false);
    setShowModal(true);
  };

  const openDeleteConfirm = (item) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation : vérifier qu'un ingrédient est sélectionné
    if (!isEditMode && !formData.ingredient_id) {
      alert("Veuillez sélectionner un ingrédient dans la liste de suggestions");
      return;
    }

    try {
      if (isEditMode) {
        // Modifier l'ingrédient
        const result = await putData(
          `https://127.0.0.1:8000/api/inventory/update/${selectedItem.id}`,
          {
            ingredient_id: formData.ingredient_id,
            quantity: formData.quantity,
            unit: formData.unit,
            exp_date: formData.exp_date || null,
          },
        );

        // Afficher le message de succès
        if (result && result.ingredient_icon) {
          setSuccessMessage(
            `${result.ingredient_icon} ${result.message || "Ingrédient modifié avec succès!"}`,
          );
          setTimeout(() => {
            setSuccessMessage(null);
            setShowModal(false);
            refetch();
          }, 2000);
        } else {
          setShowModal(false);
          refetch();
        }
      } else {
        // Ajouter un ingrédient
        const result = await postData(
          "https://127.0.0.1:8000/api/inventory/add",
          {
            ingredient_id: formData.ingredient_id,
            quantity: formData.quantity,
            unit: formData.unit,
            exp_date: formData.exp_date || null,
          },
        );

        // Afficher le message de succès avec l'emoji
        if (result && result.ingredient_icon) {
          setSuccessMessage(
            `${result.ingredient_icon} ${result.message || "Ingrédient ajouté avec succès!"}`,
          );
          setTimeout(() => {
            setSuccessMessage(null);
            setShowModal(false);
            refetch();
          }, 2000);
        } else {
          setShowModal(false);
          refetch();
        }
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert(
        err.message ||
          "Une erreur est survenue lors de l'ajout de l'ingrédient",
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteData(
        `https://127.0.0.1:8000/api/inventory/delete/${selectedItem.id}`,
      );
      setShowDeleteConfirm(false);
      refetch(); // Recharger la liste
    } catch (err) {
      console.error("Erreur:", err);
      alert(err.message || "Une erreur est survenue lors de la suppression");
    }
  };

  return (
    <div className="mon-frigo-page">
      <AppHeader />

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="content-wrapper">
          {/* HEADER SECTION */}
          <div className="page-header">
            <h1 className="page-title">Mon Frigo</h1>
            <button
              onClick={openAddModal}
              className="btn-add"
              data-testid="add-ingredient-button"
            >
              + Ajouter
            </button>
          </div>

          {/* LISTE DES INGRÉDIENTS */}
          <div className="ingredients-list">
            {loading && <p className="loading-text">Chargement...</p>}
            {error && <p className="error-text">Erreur: {error}</p>}

            {sortedData && sortedData.length === 0 && (
              <div className="empty-state">
                <p className="empty-icon">🍽️</p>
                <p className="empty-text">Votre frigo est vide</p>
                <p className="empty-subtext">
                  Commencez par ajouter vos premiers ingrédients
                </p>
              </div>
            )}

            {sortedData &&
              sortedData.map((item) => {
                const expDateFormatted = formatExpDate(item.expDate);
                return (
                  <IngredientCard
                    item={item}
                    expDateFormatted={expDateFormatted}
                    openEditModal={() => openEditModal(item)}
                    openDeleteConfirm={() => openDeleteConfirm(item)}
                    key={item.id}
                  ></IngredientCard>
                  // <div key={item.id} className="ingredient-card">
                  //   <div className="card-left">
                  //     <div className="card-info">
                  //       <div className="card-header-inline">
                  //         <span className="ingredient-name">
                  //           {item.ingredient?.icon && (
                  //             <span style={{ marginRight: "8px" }}>
                  //               {item.ingredient.icon}
                  //             </span>
                  //           )}
                  //           {item.ingredient?.name || "Ingrédient"}
                  //         </span>
                  //         {badge && (
                  //           <span className={`badge badge-${badge.type}`}>
                  //             {badge.label}
                  //           </span>
                  //         )}
                  //       </div>
                  //       <span className="ingredient-details">
                  //         {item.quantity} {item.unit}
                  //         {expDateFormatted ? (
                  //           <> • Expire le {expDateFormatted}</>
                  //         ) : (
                  //           <> • Aucune date</>
                  //         )}
                  //       </span>
                  //     </div>
                  //   </div>

                  //   <div className="card-actions">
                  //     <button
                  //       onClick={() => openEditModal(item)}
                  //       className="btn-action btn-edit"
                  //     >
                  //       Modifier
                  //     </button>
                  //     <button
                  //       onClick={() => openDeleteConfirm(item)}
                  //       className="btn-action btn-delete"
                  //     >
                  //       Supprimer
                  //     </button>
                  //   </div>
                  // </div>
                );
              })}
          </div>
        </div>
      </main>

      {/* MODAL AJOUTER/MODIFIER */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            data-testid="ingredient-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {isEditMode ? "Modifier l'ingrédient" : "Mon ingrédient"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {successMessage && (
                <div
                  className="success-message"
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#d1fae5",
                    color: "#065f46",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {successMessage}
                </div>
              )}

              <div
                className="form-group"
                style={{ position: "relative" }}
                ref={suggestionsRef}
              >
                <label className="form-label">Ingrédient *</label>
                <input
                  type="text"
                  name="ingredient_name"
                  value={ingredientSearch}
                  data-testid="ingredient-search"
                  onChange={handleIngredientSearchChange}
                  className="form-input"
                  placeholder="Rechercher un ingrédient..."
                  required
                  autoComplete="off"
                />
                {showSuggestions && ingredientSuggestions.length > 0 && (
                  <div
                    className="suggestions-dropdown"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      zIndex: 1000,
                      maxHeight: "200px",
                      overflowY: "auto",
                      marginTop: "4px",
                    }}
                  >
                    {ingredientSuggestions.map((ingredient) => (
                      <div
                        key={ingredient.id}
                        onClick={() => handleIngredientSelect(ingredient)}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.backgroundColor = "#f3f4f6")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.backgroundColor = "transparent")
                        }
                      >
                        <span>{ingredient.icon || "🍽️"}</span>
                        <span style={{ fontWeight: "500" }}>
                          {ingredient.name}
                        </span>
                        {ingredient.category && (
                          <span
                            style={{
                              marginLeft: "auto",
                              color: "#6b7280",
                              fontSize: "12px",
                            }}
                          >
                            {ingredient.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {showSuggestions &&
                  ingredientSuggestions.length === 0 &&
                  ingredientSearch.length >= 2 && (
                    <div
                      className="suggestions-dropdown"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        zIndex: 1000,
                        padding: "12px 16px",
                        color: "#6b7280",
                        fontSize: "14px",
                        marginTop: "4px",
                      }}
                    >
                      Aucun ingrédient trouvé
                    </div>
                  )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantité *</label>
                  <input
                    type="number"
                    name="quantity"
                    data-testid="ingredient-quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="2"
                    step="0.1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unité *</label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="kg"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Date d'expiration</label>
                <input
                  type="date"
                  name="exp_date"
                  value={formData.exp_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cancel"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-submit-modal"
                  data-testid="submit-ingredient-button"
                >
                  {isEditMode ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION SUPPRESSION */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-content modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Confirmer la suppression</h2>
            </div>

            <p className="modal-text">
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong>{selectedItem?.ingredient?.name}</strong> ?
            </p>

            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-cancel"
              >
                Annuler
              </button>
              <button onClick={handleDelete} className="btn-delete-confirm"  data-testid="confirm-delete-ingredient-button"  >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonFrigo;

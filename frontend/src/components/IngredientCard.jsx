import { getDaysBetweenDateAndNow } from "../services/utlis";

function IngredientCard({ item, expDateFormatted, openEditModal, openDeleteConfirm })  {
  const ingredient = item?.ingredient || {};


  // Fonction pour obtenir le badge
  const getBadge = (expDate) => {
    const days = getDaysBetweenDateAndNow(expDate);
    if (days === null) return null;
    if (days < 5) return { type: "danger", label: "🔴" };
    return { type: "success", label: "✅" };
  };
  const badge = getBadge(item.expDate);
  return (
    <div className="ingredient-card" data-testid="ingredient-card">
      <div className="card-left">
        <div className="card-info">
          <div className="card-header-inline">
            <span className="ingredient-name">
              {ingredient?.icon && (
                <span style={{ marginRight: "8px" }}>
                  {ingredient.icon}
                </span>
              )}
              {ingredient?.name || "Ingrédient"}
            </span>
            {badge && (
              <span className={`badge badge-${badge.type}`}>{badge.label}</span>
            )}
          </div>
          <span className="ingredient-details">
            {ingredient?.quantity} {ingredient?.unit}
            {expDateFormatted ? (
              <> • Expire le {expDateFormatted}</>
            ) : (
              <> • Aucune date</>
            )}
          </span>
        </div>
      </div>

      <div className="card-actions">
        <button
          onClick={openEditModal}
          className="btn-action btn-edit"
          data-testid="edit-ingredient-button"
        >
          Modifier
        </button>
        <button
          onClick={() => openDeleteConfirm(item)}
          className="btn-action btn-delete"
          data-testid="delete-ingredient-button"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
export default IngredientCard;

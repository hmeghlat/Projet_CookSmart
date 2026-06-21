
// Fonction pour calculer les jours restants
const getDaysBetweenDateAndNow = (date) => {
  if (!date) return null;
  const today = new Date();
  const exp = new Date(date);
  const diffTime = exp - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
export { getDaysBetweenDateAndNow };
import { useState } from "react";

export function useApiPost() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = async (url, method, body = null) => {
    setLoading(true);
    setData(null);
    setError(null);

    try {

      // Préparer les headers
      const headers = {
        "Content-Type": "application/json",
      };

      // Ne PAS ajouter le token pour /api/register ou /api/login
      const isAuthRoute = url.includes("/api/register") || url.includes("/api/login_check");
      if (!isAuthRoute) {
        const token = localStorage.getItem("token");
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      const fetchOptions = {
        method,
        headers,
      };

      // Ajouter le body seulement pour POST, PUT, PATCH
      if (body !== null && ['POST', 'PUT', 'PATCH'].includes(method)) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      let result = null;
      try {
        // On essaie toujours de parser le JSON pour récupérer un éventuel message d'erreur
        result = await response.json();
      } catch (e) {
        // pas de body JSON
      }

      if (!response.ok) {
        const message =
          result?.error ||
          result?.message ||
          `Erreur serveur (${response.status})`;
        setError(message);
        throw new Error(message);
      }

      setData(result);
      return result;
    } catch (err) {
      if (!error) {
        setError(err.message || "Une erreur est survenue");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const postData = async (url, body) => {
    return makeRequest(url, 'POST', body);
  };

  const putData = async (url, body) => {
    return makeRequest(url, 'PUT', body);
  };

  const deleteData = async (url) => {
    return makeRequest(url, 'DELETE', null);
  };

  return { postData, putData, deleteData, data, loading, error };
}

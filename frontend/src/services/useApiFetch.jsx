import { useEffect, useState, useCallback } from "react";

export function useApiFetch(url) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        setData(null);
        setError(null);
        
        // Récupérer le token JWT du localStorage
        const token = localStorage.getItem('token');
        
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // Ajouter le token s'il existe
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        fetch(url, { headers })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => setData(data))
            .catch((error) => setError(error.message))
            .finally(() => setLoading(false));
    }, [url]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}

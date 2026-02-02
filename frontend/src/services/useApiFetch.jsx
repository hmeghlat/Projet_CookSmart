import { useEffect, useState, useCallback, useRef } from "react";

// Déduplication des requêtes en cours (utile notamment en dev avec React 18 + StrictMode)
// Clé = url + token courant (pour éviter de partager une requête entre deux auth différentes).
const inFlightRequests = new Map();

export function useApiFetch(url) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isMountedRef = useRef(true);

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
        
        const requestKey = `${url}::${token || ''}`;
        let requestPromise = inFlightRequests.get(requestKey);

        if (!requestPromise) {
            requestPromise = fetch(url, { headers })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .finally(() => {
                    inFlightRequests.delete(requestKey);
                });

            inFlightRequests.set(requestKey, requestPromise);
        }

        requestPromise
            .then((json) => {
                if (isMountedRef.current) setData(json);
            })
            .catch((err) => {
                if (isMountedRef.current) setError(err?.message ?? String(err));
            })
            .finally(() => {
                if (isMountedRef.current) setLoading(false);
            });
    }, [url]);

    useEffect(() => {
        isMountedRef.current = true;
        fetchData();
        return () => {
            isMountedRef.current = false;
        };
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}

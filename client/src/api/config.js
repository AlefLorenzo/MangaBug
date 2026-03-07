// Em produção: VITE_API_URL='' (mesma origem, sem CORS)
// Em dev: VITE_API_URL='http://localhost:5000'
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';


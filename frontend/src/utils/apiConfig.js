/**
 * Configuração centralizada de API
 * Usa variáveis de ambiente, com fallback para localhost
 */

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
export const API_AUTH_URL = `${API_BASE_URL}/auth`;

export default API_BASE_URL;

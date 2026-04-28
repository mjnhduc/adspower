import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const fetchProfiles = () => api.get('/profiles');
export const checkProxies = (profiles) => api.post('/profiles/check-proxies', { profiles });
export const bulkReplaceProxies = (assignments) => api.post('/proxies/bulk-replace', { assignments });
export const replaceProxy = (userId, proxyData) => api.post(`/profiles/${userId}/proxy`, proxyData);

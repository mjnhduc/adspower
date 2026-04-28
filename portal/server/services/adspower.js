const axios = require('axios');

const BASE = process.env.ADSPOWER_BASE_URL || 'http://local.adspower.net:50325';

async function getProfiles(page = 1, pageSize = 100) {
  const res = await axios.get(`${BASE}/api/v1/user/list`, {
    params: { page, page_size: pageSize },
  });
  return res.data;
}

async function updateProfile(userId, data) {
  const res = await axios.post(`${BASE}/api/v1/user/update`, {
    user_id: userId,
    ...data,
  });
  return res.data;
}

async function startBrowser(userId) {
  const res = await axios.get(`${BASE}/api/v1/browser/start`, {
    params: { user_id: userId },
  });
  return res.data;
}

async function stopBrowser(userId) {
  const res = await axios.get(`${BASE}/api/v1/browser/stop`, {
    params: { user_id: userId },
  });
  return res.data;
}

async function getBrowserStatus(userId) {
  const res = await axios.get(`${BASE}/api/v1/browser/active`, {
    params: { user_id: userId },
  });
  return res.data;
}

module.exports = { getProfiles, updateProfile, startBrowser, stopBrowser, getBrowserStatus };

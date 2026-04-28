const express = require('express');
const router = express.Router();
const adspower = require('../services/adspower');
const { checkProxiesBatch } = require('../services/proxyChecker');

// GET /api/profiles — list all profiles with proxy status
router.get('/', async (req, res) => {
  try {
    const data = await adspower.getProfiles();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profiles/check-proxies — check proxy health for given profile list
router.post('/check-proxies', async (req, res) => {
  try {
    const { profiles } = req.body;
    const results = await checkProxiesBatch(profiles);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profiles/:userId/proxy — replace proxy for a single profile
router.post('/:userId/proxy', async (req, res) => {
  try {
    const { userId } = req.params;
    const { proxy_host, proxy_port, proxy_user, proxy_password, proxy_type = 'http' } = req.body;

    const result = await adspower.updateProfile(userId, {
      user_proxy_config: {
        proxy_soft: 'other',
        proxy_type,
        proxy_host,
        proxy_port: String(proxy_port),
        proxy_user,
        proxy_password,
      },
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { checkProxy } = require('../services/proxyChecker');
const adspower = require('../services/adspower');

// POST /api/proxies/check — check a single proxy
router.post('/check', async (req, res) => {
  try {
    const { proxy_host, proxy_port, proxy_user, proxy_password, proxy_type = 'http' } = req.body;
    const result = await checkProxy({
      proxy_soft: 'other',
      proxy_type,
      proxy_host,
      proxy_port,
      proxy_user,
      proxy_password,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/proxies/bulk-replace — assign new proxies to multiple profiles
// Body: { assignments: [{ userId, proxy_host, proxy_port, proxy_user, proxy_password }] }
router.post('/bulk-replace', async (req, res) => {
  try {
    const { assignments } = req.body;
    const results = await Promise.all(
      assignments.map(async ({ userId, proxy_host, proxy_port, proxy_user, proxy_password, proxy_type = 'http' }) => {
        try {
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
          return { userId, success: result.code === 0, msg: result.msg };
        } catch (err) {
          return { userId, success: false, msg: err.message };
        }
      })
    );
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

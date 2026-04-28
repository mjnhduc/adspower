const express = require('express');
const router = express.Router();
const scheduler = require('../services/scheduler');

// GET /api/scheduler/status
router.get('/status', (req, res) => {
  res.json(scheduler.getStatus());
});

// POST /api/scheduler/run — manual trigger
router.post('/run', async (req, res) => {
  try {
    const result = await scheduler.runCheck();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scheduler/start
router.post('/start', (req, res) => {
  scheduler.start();
  res.json({ ok: true, status: scheduler.getStatus() });
});

// POST /api/scheduler/stop
router.post('/stop', (req, res) => {
  scheduler.stop();
  res.json({ ok: true });
});

module.exports = router;

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const profileRoutes = require('./routes/profiles');
const proxyRoutes = require('./routes/proxies');
const schedulerRoutes = require('./routes/scheduler');
const scheduler = require('./services/scheduler');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/profiles', profileRoutes);
app.use('/api/proxies', proxyRoutes);
app.use('/api/scheduler', schedulerRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`AdsPower Portal server running on http://localhost:${PORT}`);
  scheduler.start();
});

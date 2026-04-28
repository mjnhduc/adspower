const cron = require('node-cron');
const { getProfiles, updateProfile } = require('./adspower');
const { checkProxiesBatch } = require('./proxyChecker');
const { getAvailableProxies, markProxiesInUse, parseHostPort } = require('./proxyPool');
const { send, buildReport } = require('./telegram');

let schedulerTask = null;
let lastRunResult = null;
let isRunning = false;

async function runCheck() {
  if (isRunning) return { skipped: true, reason: 'Already running' };
  isRunning = true;

  console.log('[Scheduler] Starting proxy check...');
  const checkedAt = new Date().toISOString();

  try {
    // 1. Fetch all profiles
    const profilesRes = await getProfiles();
    const profiles = profilesRes?.data?.list || [];

    // Exclude M01 — it runs without proxy intentionally
    const managedProfiles = profiles.filter(p => p.name !== 'M01');

    // 2. Check all proxies
    const results = await checkProxiesBatch(managedProfiles);

    const aliveProfiles = results.filter(r => r.alive);
    const deadResults = results.filter(r => !r.alive && !r.direct);

    console.log(`[Scheduler] Alive: ${aliveProfiles.length}, Dead: ${deadResults.length}`);

    const replaced = [];
    const skipped = [];

    if (deadResults.length > 0) {
      // Collect host:port strings currently in use by alive profiles (to avoid duplicates)
      const usedHostPorts = managedProfiles
        .filter(p => p.user_proxy_config?.proxy_host)
        .map(p => `${p.user_proxy_config.proxy_host}:${p.user_proxy_config.proxy_port}`);

      // 3. Fetch available proxies from Supabase (VN residential, not duplicated)
      const available = await getAvailableProxies(deadResults.length, usedHostPorts);

      for (let i = 0; i < deadResults.length; i++) {
        const dead = deadResults[i];
        const newProxyRow = available[i];

        if (!newProxyRow) {
          const profile = profiles.find(p => p.user_id === dead.user_id);
          skipped.push({ name: profile?.name || dead.user_id, user_id: dead.user_id });
          continue;
        }

        const { proxy_host, proxy_port, proxy_user, proxy_password } = parseHostPort(newProxyRow.host_port);

        try {
          await updateProfile(dead.user_id, {
            user_proxy_config: {
              proxy_soft: 'other',
              proxy_type: (newProxyRow.type || 'HTTP').toLowerCase(),
              proxy_host,
              proxy_port: String(proxy_port),
              proxy_user,
              proxy_password,
            },
          });

          const profile = profiles.find(p => p.user_id === dead.user_id);
          replaced.push({
            name: profile?.name || dead.user_id,
            user_id: dead.user_id,
            newProxy: `${proxy_host}:${proxy_port}`,
          });

          await markProxiesInUse([newProxyRow.id]);
        } catch (err) {
          console.error(`[Scheduler] Failed to replace proxy for ${dead.user_id}:`, err.message);
          skipped.push({ name: dead.user_id, user_id: dead.user_id });
        }
      }
    }

    const report = {
      checkedAt,
      total: managedProfiles.length,
      alive: aliveProfiles.length,
      dead: deadResults.length,
      replaced,
      skipped,
    };

    lastRunResult = report;

    // 4. Send Telegram report
    const message = buildReport(report);
    await send(message);
    console.log('[Scheduler] Done. Telegram report sent.');

    return report;
  } catch (err) {
    console.error('[Scheduler] Error during run:', err.message);
    await send(`❌ <b>AdsPower Scheduler Error</b>\n${err.message}`);
    throw err;
  } finally {
    isRunning = false;
  }
}

function start() {
  const interval = process.env.SCHEDULE_INTERVAL || '0 */6 * * *';
  if (schedulerTask) schedulerTask.stop();

  schedulerTask = cron.schedule(interval, () => {
    runCheck().catch(console.error);
  });

  console.log(`[Scheduler] Started — cron: "${interval}"`);
}

function stop() {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    console.log('[Scheduler] Stopped.');
  }
}

function getStatus() {
  return {
    running: !!schedulerTask,
    interval: process.env.SCHEDULE_INTERVAL || '0 */6 * * *',
    lastRun: lastRunResult,
    isRunning,
  };
}

module.exports = { start, stop, runCheck, getStatus };

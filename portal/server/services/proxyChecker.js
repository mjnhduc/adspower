const { HttpProxyAgent } = require('http-proxy-agent');
const axios = require('axios');

const CHECK_URL = 'http://ip-api.com/json?fields=query,country,city,status';
const TIMEOUT = 10000;

async function checkProxy(proxyConfig) {
  if (!proxyConfig || proxyConfig.proxy_soft === 'no_proxy') {
    return { alive: true, direct: true };
  }

  const { proxy_host, proxy_port, proxy_user, proxy_password, proxy_type } = proxyConfig;
  if (!proxy_host || !proxy_port) return { alive: false };

  const auth = proxy_user ? `${proxy_user}:${proxy_password}@` : '';
  const proxyUrl = `http://${auth}${proxy_host}:${proxy_port}`;

  try {
    const agent = new HttpProxyAgent(proxyUrl);
    const res = await axios.get(CHECK_URL, {
      httpAgent: agent,
      timeout: TIMEOUT,
      proxy: false,
    });
    if (res.data?.status === 'success') {
      return { alive: true, ip: res.data.query, country: res.data.country, city: res.data.city };
    }
    return { alive: false };
  } catch {
    return { alive: false };
  }
}

async function checkProxiesBatch(profiles) {
  const results = await Promise.all(
    profiles.map(async (profile) => {
      const result = await checkProxy(profile.user_proxy_config);
      return { user_id: profile.user_id, name: profile.name, ...result };
    })
  );
  return results;
}

module.exports = { checkProxy, checkProxiesBatch };

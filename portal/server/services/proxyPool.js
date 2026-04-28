const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse "host:port:user:pass" or "host:port"
function parseHostPort(hostPort) {
  const parts = hostPort.split(':');
  return {
    proxy_host: parts[0],
    proxy_port: parts[1],
    proxy_user: parts[2] || '',
    proxy_password: parts[3] || '',
  };
}

// Fetch N available proxies: VN residential, not archived, not already in use by any profile
// usedHostPorts = array of "host:port" strings currently assigned to profiles
async function getAvailableProxies(count, usedHostPorts = []) {
  const { data, error } = await supabase
    .from('proxies')
    .select('id, host_port, type')
    .eq('is_archived', false)
    .eq('country', 'vn')
    .eq('category', 'residential')
    .in('status', ['UNKNOWN', 'ACTIVE'])
    .limit(count + usedHostPorts.length); // fetch extra to account for filtering

  if (error) throw new Error(`Supabase fetch error: ${error.message}`);

  // Exclude proxies whose host:port is already assigned to a live profile
  const usedSet = new Set(usedHostPorts.map(hp => hp.split(':').slice(0, 2).join(':')));
  const filtered = (data || []).filter(row => {
    const hostPort = row.host_port.split(':').slice(0, 2).join(':');
    return !usedSet.has(hostPort);
  });

  return filtered.slice(0, count);
}

// Mark proxies as ACTIVE (in use) after assigning to a profile
async function markProxiesInUse(ids) {
  if (!ids.length) return;
  const { error } = await supabase
    .from('proxies')
    .update({ status: 'ACTIVE', last_checked: new Date().toISOString() })
    .in('id', ids);
  if (error) throw new Error(`Supabase update error: ${error.message}`);
}

// Mark proxies as DEAD
async function markProxiesDead(ids) {
  if (!ids.length) return;
  const { error } = await supabase
    .from('proxies')
    .update({ status: 'DEAD', last_checked: new Date().toISOString() })
    .in('id', ids);
  if (error) throw new Error(`Supabase update error: ${error.message}`);
}

module.exports = { getAvailableProxies, markProxiesInUse, markProxiesDead, parseHostPort };

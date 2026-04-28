import React, { useEffect, useState, useCallback } from 'react';
import { fetchProfiles, checkProxies, bulkReplaceProxies } from '../api';

function StatusBadge({ status }) {
  if (status === 'alive') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-900 text-green-300">ALIVE</span>;
  if (status === 'dead') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-900 text-red-300">DEAD</span>;
  if (status === 'direct') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900 text-blue-300">DIRECT</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-700 text-gray-400">—</span>;
}

function parseProxyLine(line) {
  const parts = line.trim().split(':');
  if (parts.length < 2) return null;
  return {
    proxy_host: parts[0],
    proxy_port: parts[1],
    proxy_user: parts[2] || '',
    proxy_password: parts[3] || '',
    proxy_type: 'http',
  };
}

export default function Profiles() {
  const [profiles, setProfiles] = useState([]);
  const [proxyStatus, setProxyStatus] = useState({});
  const [checking, setChecking] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [filter, setFilter] = useState('all'); // 'all' | 'alive' | 'dead'
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [proxyInput, setProxyInput] = useState('');
  const [replacing, setReplacing] = useState(false);
  const [replaceResult, setReplaceResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchProfiles();
      setProfiles(res.data?.data?.list || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const runCheckProxies = async () => {
    setChecking(true);
    setProxyStatus({});
    try {
      const res = await checkProxies(profiles);
      const map = {};
      for (const r of res.data.results) {
        map[r.user_id] = r;
      }
      setProxyStatus(map);
    } finally {
      setChecking(false);
    }
  };

  const deadProfiles = profiles.filter(p => {
    const s = proxyStatus[p.user_id];
    return s && !s.alive && !s.direct;
  });

  const filteredProfiles = profiles.filter(p => {
    if (filter === 'all') return true;
    const s = proxyStatus[p.user_id];
    if (filter === 'alive') return s && (s.alive || s.direct);
    if (filter === 'dead') return s && !s.alive && !s.direct;
    return true;
  });

  const toggleSelect = (userId) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected(new Set(filteredProfiles.map(p => p.user_id)));
  };

  const openReplaceModal = () => {
    setProxyInput('');
    setReplaceResult(null);
    setShowReplaceModal(true);
  };

  const handleBulkReplace = async () => {
    const lines = proxyInput.trim().split('\n').filter(Boolean);
    const selectedList = profiles.filter(p => selected.has(p.user_id));

    if (lines.length < selectedList.length) {
      alert(`You selected ${selectedList.length} profiles but only provided ${lines.length} proxy lines.`);
      return;
    }

    const assignments = selectedList.map((profile, i) => {
      const proxy = parseProxyLine(lines[i]);
      return { userId: profile.user_id, ...proxy };
    });

    setReplacing(true);
    try {
      const res = await bulkReplaceProxies(assignments);
      setReplaceResult(res.data.results);
      await loadProfiles();
      setSelected(new Set());
    } finally {
      setReplacing(false);
    }
  };

  const getRowStatus = (profile) => {
    const s = proxyStatus[profile.user_id];
    if (!s) return null;
    if (s.direct) return 'direct';
    return s.alive ? 'alive' : 'dead';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Profiles</h1>
          <p className="text-sm text-gray-400 mt-0.5">{profiles.length} profiles loaded</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter tabs — only shown after a proxy check */}
          {Object.keys(proxyStatus).length > 0 && (
            <div className="flex rounded-lg overflow-hidden border border-gray-700 text-sm">
              {[
                { key: 'all', label: `All (${profiles.length})` },
                { key: 'alive', label: `Alive (${profiles.filter(p => { const s = proxyStatus[p.user_id]; return s && (s.alive || s.direct); }).length})` },
                { key: 'dead', label: `Dead (${deadProfiles.length})` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 transition-colors ${filter === key ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {/* Select all visible */}
          {filteredProfiles.length > 0 && (
            <button
              onClick={selectAllVisible}
              className="px-3 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors"
            >
              Select all {filter !== 'all' ? filter : ''}
            </button>
          )}
          {selected.size > 0 && (
            <button
              onClick={openReplaceModal}
              className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Replace proxies ({selected.size})
            </button>
          )}
          <button
            onClick={runCheckProxies}
            disabled={checking || profiles.length === 0}
            className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {checking && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {checking ? 'Checking...' : 'Check Proxies'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {Object.keys(proxyStatus).length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Alive', count: Object.values(proxyStatus).filter(s => s.alive).length, color: 'green' },
            { label: 'Dead', count: Object.values(proxyStatus).filter(s => !s.alive && !s.direct).length, color: 'red' },
            { label: 'Direct', count: Object.values(proxyStatus).filter(s => s.direct).length, color: 'blue' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`bg-gray-900 border border-gray-800 rounded-xl px-5 py-4`}>
              <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
              <p className={`text-3xl font-bold mt-1 text-${color}-400`}>{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={filteredProfiles.length > 0 && filteredProfiles.every(p => selected.has(p.user_id))}
                  onChange={(e) => setSelected(e.target.checked ? new Set(filteredProfiles.map(p => p.user_id)) : new Set())}
                />
              </th>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Proxy</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">IP / Location</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500">Loading profiles...</td></tr>
            ) : filteredProfiles.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500">No profiles match this filter</td></tr>
            ) : (
              filteredProfiles.map((profile) => {
                const status = getRowStatus(profile);
                const ps = proxyStatus[profile.user_id];
                const proxy = profile.user_proxy_config;
                const isDead = status === 'dead';
                return (
                  <tr
                    key={profile.user_id}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors ${isDead ? 'bg-red-950/10' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selected.has(profile.user_id)}
                        onChange={() => toggleSelect(profile.user_id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{profile.serial_number}</td>
                    <td className="px-4 py-3 font-medium text-white">{profile.name}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                      {proxy?.proxy_soft === 'no_proxy'
                        ? <span className="text-gray-600">No proxy</span>
                        : `${proxy?.proxy_host}:${proxy?.proxy_port}`}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {ps?.alive && !ps?.direct ? `${ps.ip} — ${ps.city}, ${ps.country}` : ''}
                      {ps?.direct ? 'Local machine IP' : ''}
                      {ps && !ps.alive && !ps.direct ? <span className="text-red-500">Unreachable</span> : ''}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Replace Proxy Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Replace Proxies</h2>
              <button onClick={() => setShowReplaceModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-400 mb-1">
                Enter <span className="text-white font-medium">{selected.size}</span> proxy line(s) — one per selected profile, in order:
              </p>
              <p className="text-xs text-gray-600 mb-3 font-mono">host:port:username:password</p>
              <textarea
                className="w-full h-40 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
                placeholder={`103.114.104.190:51603:user:pass\n103.171.1.96:43738:user2:pass2`}
                value={proxyInput}
                onChange={(e) => setProxyInput(e.target.value)}
              />
              {replaceResult && (
                <div className="mt-3 space-y-1">
                  {replaceResult.map((r) => (
                    <div key={r.userId} className={`text-xs px-3 py-1.5 rounded ${r.success ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
                      {r.userId}: {r.success ? 'Updated successfully' : `Failed — ${r.msg}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowReplaceModal(false)}
                className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkReplace}
                disabled={replacing || !proxyInput.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {replacing ? 'Applying...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

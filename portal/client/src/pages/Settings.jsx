import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Settings() {
  const [status, setStatus] = useState(null);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await axios.get('/api/scheduler/status');
      setStatus(res.data);
      if (res.data.lastRun) setLastRun(res.data.lastRun);
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerRun = async () => {
    setRunning(true);
    try {
      const res = await axios.post('/api/scheduler/run');
      setLastRun(res.data);
      await fetchStatus();
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Scheduler and automation configuration</p>

      {/* Scheduler Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Auto Proxy Check</h2>
            <p className="text-xs text-gray-500 mt-0.5">Runs every 6 hours — checks all profiles and replaces dead proxies automatically</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status?.running ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
            {status?.running ? 'Active' : 'Stopped'}
          </span>
        </div>

        <div className="text-xs text-gray-500 mb-4 font-mono bg-gray-800 px-3 py-2 rounded-lg">
          Cron: <span className="text-indigo-400">{status?.interval || '0 */6 * * *'}</span>
        </div>

        <button
          onClick={triggerRun}
          disabled={running || status?.isRunning}
          className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {(running || status?.isRunning) && (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {(running || status?.isRunning) ? 'Running check...' : 'Run Now'}
        </button>
      </div>

      {/* Last Run Report */}
      {lastRun && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Last Run Report</h2>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Total', value: lastRun.total, color: 'text-white' },
              { label: 'Alive', value: lastRun.alive, color: 'text-green-400' },
              { label: 'Dead', value: lastRun.dead, color: 'text-red-400' },
              { label: 'Replaced', value: lastRun.replaced?.length ?? 0, color: 'text-indigo-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-800 rounded-lg px-3 py-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {lastRun.replaced?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Replaced</p>
              <div className="space-y-1">
                {lastRun.replaced.map((r) => (
                  <div key={r.user_id} className="flex items-center justify-between text-xs bg-green-900/20 border border-green-900/40 rounded px-3 py-1.5">
                    <span className="text-white font-medium">{r.name}</span>
                    <span className="text-green-400 font-mono">{r.newProxy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lastRun.skipped?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Skipped — no proxy available</p>
              <div className="space-y-1">
                {lastRun.skipped.map((s) => (
                  <div key={s.user_id} className="text-xs bg-yellow-900/20 border border-yellow-900/40 rounded px-3 py-1.5 text-yellow-400">
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-600 mt-4">
            Last checked: {new Date(lastRun.checkedAt).toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' })} (GMT+7)
          </p>
        </div>
      )}
    </div>
  );
}

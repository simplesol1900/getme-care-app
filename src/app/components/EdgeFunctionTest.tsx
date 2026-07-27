import { useState } from 'react';
import { supabase } from '../supabase';

// ⚠️ REPLACE WITH YOUR ACTUAL SUPABASE PROJECT REF
const EDGE_URL = 'https://byjjcosogvygegjnmunv.supabase.co/functions/v1/make-server-f62a5d52';

export function EdgeFunctionTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  const testHealth = async () => {
    setLoading(true);
    addLog('Testing /health endpoint...');
    try {
      const res = await fetch(`${EDGE_URL}/health`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const data = await res.json();
      addLog(`✅ Health check: ${JSON.stringify(data)}`);
    } catch (err: any) {
      addLog(`❌ Health check failed: ${err.message}`);
    }
    setLoading(false);
  };

  const testSetupDB = async () => {
    setLoading(true);
    addLog('Testing /setup-db endpoint...');
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      
      const res = await fetch(`${EDGE_URL}/setup-db`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      addLog(`✅ Setup DB: ${JSON.stringify(data)}`);
    } catch (err: any) {
      addLog(`❌ Setup DB failed: ${err.message}`);
    }
    setLoading(false);
  };

  const testCaregivers = async () => {
    setLoading(true);
    addLog('Testing /caregivers endpoint...');
    try {
      const res = await fetch(`${EDGE_URL}/caregivers?city=Toronto&verified_only=true`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const data = await res.json();
      addLog(`✅ Caregivers: Found ${data.caregivers?.length || 0} caregivers`);
    } catch (err: any) {
      addLog(`❌ Caregivers failed: ${err.message}`);
    }
    setLoading(false);
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4">Edge Function Test Panel</h2>
      
      <div className="space-y-2 mb-4">
        <button 
          onClick={testHealth}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mr-2"
        >
          Test Health
        </button>
        <button 
          onClick={testSetupDB}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 mr-2"
        >
          Test Setup DB
        </button>
        <button 
          onClick={testCaregivers}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 mr-2"
        >
          Test Caregivers
        </button>
        <button 
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500">Click a test button to see results...</p>
        ) : (
          logs.map((log, i) => <div key={i}>{log}</div>)
        )}
      </div>
    </div>
  );
}
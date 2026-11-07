"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Copy, Plus, Trash2, Key, Terminal } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  status: string;
  rateLimit: number;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function ApiKeysPage() {
  const { data: session } = useSession();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchApiKeys();
      fetchUsageStats();
    }
  }, [session]);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${BACKEND_URL}/api/mcp/keys`, {
        headers: {
          "x-user-id": session?.user?.id || "",
        },
      });
      const data = await res.json();
      if (data.status === "success") {
        setApiKeys(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
      setError("Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${BACKEND_URL}/api/mcp/usage`, {
        headers: {
          "x-user-id": session?.user?.id || "",
        },
      });
      const data = await res.json();
      if (data.status === "success") {
        setUsageStats(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch API usage stats:", err);
    }
  };

  const generateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    try {
      setGenerating(true);
      setError(null);
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${BACKEND_URL}/api/mcp/keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
        },
        body: JSON.stringify({ name: keyName }),
      });

      const data = await res.json();
      if (data.status === "success") {
        setNewKey(data.data.key);
        setKeyName("");
        fetchApiKeys();
      } else {
        setError(data.error || "Failed to generate key.");
      }
    } catch (err) {
      console.error("Failed to generate key:", err);
      setError("Failed to generate API key.");
    } finally {
      setGenerating(false);
    }
  };

  const revokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone and any integrations using this key will immediately stop working.")) {
      return;
    }

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${BACKEND_URL}/api/mcp/keys/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": session?.user?.id || "",
        },
      });

      const data = await res.json();
      if (data.status === "success") {
        fetchApiKeys();
      }
    } catch (err) {
      console.error("Failed to revoke key:", err);
      setError("Failed to revoke API key.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-white">Loading API Keys...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 text-white space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Terminal className="w-8 h-8 text-blue-400" />
          Developer API & MCP
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Connect NxtGen Captions to Claude Desktop, Cursor, or your own custom applications using the Model Context Protocol (MCP).
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl">
          {error}
        </div>
      )}

      {newKey && (
        <div className="bg-green-500/10 border border-green-500/50 p-6 rounded-xl space-y-4">
          <h2 className="text-xl font-bold text-green-400">Your New API Key</h2>
          <p className="text-gray-300">
            Please copy this key and store it securely. For your protection, you will <strong>never be able to see it again</strong>.
          </p>
          <div className="flex gap-2 items-center bg-black/50 p-3 rounded-lg border border-gray-700">
            <code className="text-green-300 font-mono text-lg flex-1 overflow-x-auto">{newKey}</code>
            <button
              onClick={() => copyToClipboard(newKey)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Copy className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
          >
            I have saved it securely
          </button>
        </div>
      )}

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">Create New API Key</h2>
        <form onSubmit={generateKey} className="flex gap-4">
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Key Name (e.g., Claude Desktop, Cursor)"
            className="flex-1 bg-black/50 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white"
            required
            maxLength={50}
          />
          <button
            type="submit"
            disabled={generating || !keyName.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {generating ? (
              "Generating..."
            ) : (
              <>
                <Plus className="w-5 h-5" /> Generate Key
              </>
            )}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Active API Keys</h2>
        {apiKeys.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>You haven't generated any API keys yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl flex items-center justify-between group hover:border-gray-700 transition-all"
              >
                <div>
                  <h3 className="font-semibold text-lg">{key.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                    <span className="font-mono bg-black/50 px-2 py-0.5 rounded border border-gray-800">
                      {key.keyPrefix}••••••••••••
                    </span>
                    <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                    {key.lastUsedAt && (
                      <span>• Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => revokeKey(key.id)}
                  className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Revoke API Key"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mt-8">
        <h3 className="font-bold text-blue-400 mb-2">Usage Limits (Development Phase)</h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          During the current development phase, API access is free but strictly rate-limited to <strong>100 requests per day</strong> per key to prevent abuse. 
          When we launch to production, you will be able to upgrade your API access limits and pay-per-use via Razorpay.
        </p>
      </div>

      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold">API Usage Metrics</h2>
        {usageStats.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center text-gray-500 text-sm">
            No API usage recorded yet. Connect a client like Claude Desktop to see metrics here.
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-black/40 text-gray-400 text-sm border-b border-gray-800">
                <tr>
                  <th className="p-4 font-medium">Tool Name</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Calls</th>
                  <th className="p-4 font-medium">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {usageStats.map((stat, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-sm text-blue-400">{stat.tool}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        stat.status === "success" ? "bg-green-500/10 text-green-400" :
                        stat.status === "rate_limited" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        {stat.status}
                      </span>
                    </td>
                    <td className="p-4">{stat._count.id}</td>
                    <td className="p-4">
                      {Math.round(stat._sum.latencyMs / stat._count.id)} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

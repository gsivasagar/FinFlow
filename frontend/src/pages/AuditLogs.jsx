import { useState, useEffect } from 'react';
import API from '../api/axios';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await API.get('/audit-logs', {
        params: { page: pagination.page, limit: pagination.limit },
      });
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }

  const actionColors = {
    CREATE_RECORD: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    UPDATE_RECORD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    DELETE_RECORD: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    UPDATE_ROLE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    UPDATE_STATUS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Audit Logs</h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p className="text-lg">No audit logs yet</p>
            <p className="text-sm mt-1">Actions will appear here as users interact with the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Timestamp</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Target</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 dark:text-blue-400 font-semibold text-xs">
                            {log.user_name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{log.user_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {log.target_type} #{log.target_id}
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

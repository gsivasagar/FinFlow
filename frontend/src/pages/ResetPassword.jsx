import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';

export default function ResetPassword() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If user hit /reset-password?token=xyz, extract it
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [location]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setLoading(true);

    try {
      const res = await API.post('/auth/reset-password', { token, password });
      setStatus({ type: 'success', message: res.data.message });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const details = err.response?.data?.details;
      setStatus({ 
        type: 'error', 
        message: details ? details.join(', ') : err.response?.data?.error || 'Failed to reset password.' 
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Create New Password</h1>
          <p className="text-blue-200 mt-2">Enter your reset token and new password</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-5">
          {status.message && (
            <div className={`px-4 py-3 rounded-lg text-sm border ${
              status.type === 'error' 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' 
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
            }`}>
              {status.message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reset Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
              placeholder="Paste your reset token here"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Min 8 chars, must include uppercase, lowercase, and a digit.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-2.5 rounded-lg font-medium hover:from-blue-600 hover:to-blue-800 transition-all text-sm shadow-lg shadow-blue-500/30 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
              Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

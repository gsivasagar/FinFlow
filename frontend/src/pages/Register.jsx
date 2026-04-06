import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await API.post('/auth/register', form);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const details = err.response?.data?.details;
      setError(details ? details.join(', ') : err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-blue-200 mt-2">Join FinanceApp to manage your finances</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-5">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">{success}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required className={inputCls} placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputCls} placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required className={inputCls} placeholder="••••••••" />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Min 8 chars, must include uppercase, lowercase, and a digit.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
            <select name="role" value={form.role} onChange={handleChange} className={inputCls}>
              <option value="viewer">Viewer</option>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-2.5 rounded-lg font-medium hover:from-blue-600 hover:to-blue-800 text-sm shadow-lg shadow-blue-500/30 disabled:opacity-50 cursor-pointer">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

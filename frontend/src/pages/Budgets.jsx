import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';

export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ category: '', amount: '' });
  const [error, setError] = useState('');
  
  // Hardcoded categories as seen in records usually, or could be dynamic
  const categories = ['Salary', 'Freelance', 'Food', 'Rent', 'Utilities', 'Entertainment', 'Transport', 'Healthcare', 'Other'];

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  async function fetchBudgets() {
    try {
      const res = await API.get(`/budgets?month=${currentMonth}&year=${currentYear}`);
      setBudgets(res.data.budgets);
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBudgets();
  }, [currentMonth, currentYear]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      await API.post('/budgets', {
        category: formData.category,
        amount: parseFloat(formData.amount),
        month: currentMonth,
        year: currentYear
      });
      setFormData({ category: '', amount: '' });
      toast.success('Budget saved successfully');
      fetchBudgets();
    } catch (err) {
      const details = err.response?.data?.details;
      const msg = details ? details.join(', ') : err.response?.data?.error || 'Failed to set budget.';
      setError(msg);
      toast.error(msg);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    try {
      await API.delete(`/budgets/${id}`);
      toast.success('Budget deleted successfully');
      fetchBudgets();
    } catch (err) {
      toast.error('Error deleting budget');
      console.error('Error deleting budget', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Monthly Budgets</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your spending limits for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Set Budget Goal</h3>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent dark:text-gray-200"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Budget Limit ($)</label>
                <input
                  type="number"
                  required
                  min="0.01" step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent dark:text-gray-200"
                  placeholder="e.g. 500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Save Budget
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {budgets.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      No budgets set for this month.
                    </td>
                  </tr>
                ) : (
                  budgets.map(budget => (
                    <tr key={budget.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 font-medium dark:text-gray-300">{budget.category}</td>
                      <td className="px-6 py-4">{formatCurrency(budget.amount, user?.currency)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="text-red-500 hover:text-red-700 font-medium cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

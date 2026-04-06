import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';

export default function RecurringTransactions() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    notes: '',
    frequency: 'monthly',
    next_run_date: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');

  const categories = ['Salary', 'Freelance', 'Food', 'Rent', 'Utilities', 'Entertainment', 'Transport', 'Healthcare', 'Other'];

  async function fetchRecords() {
    try {
      const res = await API.get('/recurring');
      setRecords(res.data.records);
    } catch (err) {
      console.error('Error fetching recurring transactions:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecords();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      await API.post('/recurring', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setFormData({
        amount: '',
        type: 'expense',
        category: '',
        notes: '',
        frequency: 'monthly',
        next_run_date: new Date().toISOString().split('T')[0]
      });
      toast.success('Recurring transaction scheduled');
      fetchRecords();
    } catch (err) {
      const details = err.response?.data?.details;
      const msg = details ? details.join(', ') : err.response?.data?.error || 'Failed to create recurring transaction.';
      setError(msg);
      toast.error(msg);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) return;
    try {
      await API.delete(`/recurring/${id}`);
      toast.success('Transaction deleted');
      fetchRecords();
    } catch (err) {
      toast.error('Error deleting transaction');
      console.error('Error deleting recurring transaction', err);
    }
  }

  async function handleToggle(id) {
    try {
      const res = await API.patch(`/recurring/${id}/toggle`);
      toast.success(res.data.message || 'Status updated');
      fetchRecords();
    } catch (err) {
      toast.error('Error updating status');
      console.error('Error toggling recurring transaction', err);
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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Recurring Transactions</h2>
        <p className="text-gray-600 dark:text-gray-400">Automate your regular income and expenses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Create New Template</h3>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      formData.type === 'expense' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      formData.type === 'income' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ($)</label>
                <input
                  type="number" required min="0.01" step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent dark:text-gray-200"
                  placeholder="0.00"
                />
              </div>

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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                <select
                  required
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent dark:text-gray-200"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Run Date</label>
                <input
                  type="date"
                  required
                  value={formData.next_run_date}
                  onChange={(e) => setFormData({ ...formData, next_run_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent dark:text-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent dark:text-gray-200"
                  placeholder="e.g. Netflix Subscription"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Schedule Transaction
              </button>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase font-medium">
                  <tr>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Schedule</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No recurring transactions configured.
                      </td>
                    </tr>
                  ) : (
                    records.map(record => (
                      <tr key={record.id} className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${!record.is_active ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-4">
                          <p className="font-medium dark:text-gray-200">{record.category}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{record.notes}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(record.amount, user?.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="capitalize font-medium">{record.frequency}</p>
                          <p className="text-xs">Next: {record.next_run_date}</p>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button
                            onClick={() => handleToggle(record.id)}
                            className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer"
                          >
                            {record.is_active ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
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
    </div>
  );
}

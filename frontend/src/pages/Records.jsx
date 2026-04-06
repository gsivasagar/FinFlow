import { useState, useEffect, useMemo } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';

const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This year', days: 'year' },
];

function getPresetDates(preset) {
  const to = new Date().toISOString().split('T')[0];
  let fromDate;
  if (preset.days === 'year') {
    fromDate = new Date(new Date().getFullYear(), 0, 1);
  } else {
    fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - preset.days);
  }
  return { from: fromDate.toISOString().split('T')[0], to };
}

export default function Records() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canExport = ['analyst', 'admin'].includes(user?.role);

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ type: '', category: '', from: '', to: '' });
  const [activePreset, setActivePreset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({ amount: '', type: 'income', category: '', date: '', notes: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [pagination.page, filters]);

  async function fetchRecords() {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const res = await API.get('/records', { params });
      setRecords(res.data.records);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPagination((prev) => ({ ...prev, page: 1 }));
    setActivePreset(null);
  }

  function handlePreset(preset, index) {
    const { from, to } = getPresetDates(preset);
    setFilters((prev) => ({ ...prev, from, to }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    setActivePreset(index);
  }

  function clearPresets() {
    setFilters((prev) => ({ ...prev, from: '', to: '' }));
    setActivePreset(null);
  }

  async function handleExportCSV() {
    setExporting(true);
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const res = await API.get('/records/export', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'financial_records.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export CSV.');
    } finally {
      setExporting(false);
    }
  }

  function openAddModal() {
    setEditingRecord(null);
    setFormData({ amount: '', type: 'income', category: '', date: '', notes: '' });
    setFormError('');
    setShowModal(true);
  }

  function openEditModal(record) {
    setEditingRecord(record);
    setFormData({
      amount: record.amount,
      type: record.type,
      category: record.category,
      date: record.date,
      notes: record.notes || '',
    });
    setFormError('');
    setShowModal(true);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const payload = { ...formData, amount: parseFloat(formData.amount) };
      if (editingRecord) {
        await API.put(`/records/${editingRecord.id}`, payload);
        toast.success('Record updated successfully');
      } else {
        await API.post('/records', payload);
        toast.success('Record created successfully');
      }
      setShowModal(false);
      fetchRecords();
    } catch (err) {
      const details = err.response?.data?.details;
      const msg = details ? details.join(', ') : err.response?.data?.error || 'Failed to save record.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      await API.delete(`/records/${id}`);
      toast.success('Record deleted successfully');
      fetchRecords();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete record.';
      setError(msg);
      toast.error(msg);
    }
  }

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRecords = useMemo(() => {
    let sortableItems = [...records];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [records, sortConfig]);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="ml-1 opacity-20">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="ml-1 text-blue-500">↑</span> : <span className="ml-1 text-blue-500">↓</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Financial Records</h2>
        <div className="flex items-center gap-2">
          {canExport && (
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : '↓ Export CSV'}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              + Add Record
            </button>
          )}
        </div>
      </div>

      {/* Date Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {DATE_PRESETS.map((preset, idx) => (
          <button
            key={preset.label}
            onClick={() => handlePreset(preset, idx)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activePreset === idx
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
        {activePreset !== null && (
          <button
            onClick={clearPresets}
            className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            type="text"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            placeholder="Filter by category..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <input
            type="date"
            name="from"
            value={filters.from}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <input
            type="date"
            name="to"
            value={filters.to}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-4 animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded w-full"></div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p className="text-lg">No records found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => requestSort('date')}>Date <SortIcon columnKey="date" /></th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => requestSort('type')}>Type <SortIcon columnKey="type" /></th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => requestSort('category')}>Category <SortIcon columnKey="category" /></th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => requestSort('amount')}>Amount <SortIcon columnKey="amount" /></th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Notes</th>
                  {isAdmin && <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((record) => (
                  <tr key={record.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{record.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.type === 'income'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{record.category}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${
                      record.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(record.amount, user?.currency)}
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">{record.notes || '—'}</td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(record)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
              {editingRecord ? 'Edit Record' : 'Add Record'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  placeholder="e.g., Salary, Food, Rent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-800 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? 'Saving...' : editingRecord ? 'Update Record' : 'Add Record'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSummary();
  }, []);

  async function fetchSummary() {
    try {
      const res = await API.get('/dashboard/summary');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-xl w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-xl">
        {error}
      </div>
    );
  }

  // Transform monthly trends for bar chart
  const monthlyMap = {};
  (data?.monthlyTrends || []).forEach(({ month, type, total }) => {
    if (!monthlyMap[month]) monthlyMap[month] = { month };
    monthlyMap[month][type] = total;
  });
  const barData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)).map(d => ({
    ...d,
    net: (d.income || 0) - (d.expense || 0)
  }));

  // Transform category totals for pie chart
  const pieData = (data?.categoryTotals || []).map((item) => ({
    name: `${item.category} (${item.type})`,
    value: item.total,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <SummaryCard
          label="Total Income"
          value={data?.totalIncome || 0}
          currency={user?.currency}
          color="bg-gradient-to-br from-emerald-400 to-emerald-600"
          icon={
            <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          }
        />
        <SummaryCard
          label="Total Expenses"
          value={data?.totalExpenses || 0}
          currency={user?.currency}
          color="bg-gradient-to-br from-red-400 to-red-600"
          icon={
            <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          }
        />
        <SummaryCard
          label="Net Balance"
          value={data?.netBalance || 0}
          currency={user?.currency}
          color="bg-gradient-to-br from-blue-400 to-blue-600"
          icon={
            <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Trends Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Monthly Trends</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(value) => formatCurrency(value, user?.currency)}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
                  }}
                />
                <Legend />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={3} name="Net Balance" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-center py-12">No monthly data available yet.</p>
          )}
        </div>

        {/* Category Totals Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Category Breakdown</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value, user?.currency)}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-center py-12">No category data available yet.</p>
          )}
        </div>
      </div>

      {/* Budget Progress */}
      {data?.budgetProgress?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Budget Progress (This Month)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.budgetProgress.map((budget) => {
              const percent = Math.min((budget.spentAmount / budget.budgetAmount) * 100, 100);
              const isOver = budget.spentAmount > budget.budgetAmount;
              const isWarning = percent > 80 && !isOver;
              
              let barColor = 'bg-blue-500';
              if (isWarning) barColor = 'bg-amber-500';
              if (isOver) barColor = 'bg-red-500';

              return (
                <div key={budget.category} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{budget.category}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      <span className={isOver ? 'text-red-600 dark:text-red-400' : ''}>
                        {formatCurrency(budget.spentAmount, user?.currency)}
                      </span>
                      {' / '}{formatCurrency(budget.budgetAmount, user?.currency)}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-2.5 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${percent}%` }} />
                  </div>
                  {isOver && <p className="text-xs text-red-500 mt-1 font-medium">Over budget!</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Recent Activity</h3>
        {data?.recentActivity?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Category</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActivity.map((record) => (
                  <tr key={record.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{record.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.type === 'income'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{record.category}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${record.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                      {formatCurrency(record.amount, user?.currency)}
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{record.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 text-center py-8">No recent activity.</p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, currency, color, icon }) {
  return (
    <div className={`${color} rounded-xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(value, currency)}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

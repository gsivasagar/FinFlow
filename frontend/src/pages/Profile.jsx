import { useState } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();
  
  const [profileData, setProfileData] = useState({ 
    name: user?.name || '',
    currency: user?.currency || 'USD'
  });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleProfileUpdate(e) {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await API.put('/auth/profile', profileData);
      toast.success(res.data.message || 'Profile updated');
      // In a more complex app, we might update AuthContext via a generic action here 
      // but since the top right badge uses user?.name, 
      // a full page refresh or context method call would be needed. 
      // A full page reload is a simple workaround or we just mutate state if the context exposes it.
      // Easiest is to force a reload given our simple AuthContext provider logic.
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.details?.join(', ') || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      const res = await API.put('/auth/password', passwordData);
      toast.success(res.data.message || 'Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.details?.join(', ') || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Profile</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your personal information and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Personal Details</h3>
          
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                id="email"
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <input
                id="role"
                type="text"
                disabled
                value={user?.role || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed capitalize"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                id="name"
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Currency</label>
              <select
                id="currency"
                value={profileData.currency}
                onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {profileLoading ? 'Saving...' : 'Update Details'}
            </button>
          </form>
        </div>

        {/* Security Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <input
                id="newPassword"
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be at least 8 characters, include uppercase, lowercase, and a number.</p>
            </div>
            
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-slate-800 dark:bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition disabled:opacity-50 mt-2"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

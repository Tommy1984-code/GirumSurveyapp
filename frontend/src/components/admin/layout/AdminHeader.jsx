import React from 'react';
import { Bell, MessageSquare, Power, X } from 'lucide-react';

function getActiveTabLabel(activeTab) {
  if (activeTab === 'dashboard') return 'Dashboard';
  if (activeTab === 'doctor-report') return 'Doctor Report';
  if (activeTab === 'general-report') return 'General Report';
  if (activeTab === 'survey-report') return 'Survey Report';
  if (activeTab === 'doctor-ratings') return 'Doctor Ratings';
  return activeTab;
}

export default function AdminHeader({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  handleOpenNotifications,
  showNotifications,
  handleCloseNotifications,
  hasNewNotifications,
  notifications,
  currentUser,
  onLogout
}) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div>
        <h2 className="text-lg font-semibold text-gray-800 capitalize">{getActiveTabLabel(activeTab)}</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={handleOpenNotifications}
            className={`relative p-3 rounded-xl transition-all ${hasNewNotifications ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-100'}`}
          >
            <Bell className={`w-6 h-6 ${hasNewNotifications ? 'text-red-500' : 'text-gray-600'}`} />
            {hasNewNotifications && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="fixed inset-0 z-40" onClick={handleCloseNotifications}></div>
          )}
          {showNotifications && hasNewNotifications && (
            <div className="fixed left-4 right-4 top-20 sm:!absolute sm:!top-full sm:!right-0 sm:!left-auto sm:!mt-0 sm:!w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">New Responses</h3>
                  <p className="text-slate-400 text-sm">{notifications.length} new response{notifications.length > 1 ? 's' : ''}</p>
                </div>
                <button onClick={handleCloseNotifications} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((r, idx) => (
                  <div
                    key={r.submission_id}
                    className={`p-4 border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all cursor-pointer ${idx === 0 ? 'bg-blue-50' : ''}`}
                    onClick={() => { setActiveTab('responses'); handleCloseNotifications(); }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-red-500' : 'bg-emerald-500'}`}>
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">{r.patient_name}</p>
                        <p className="text-sm text-gray-600 truncate font-medium">{r.doctor_names || 'No doctor assigned'}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(r.submitted_at).toLocaleString()}</p>
                      </div>
                      {idx === 0 && <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">NEW</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => { setActiveTab('responses'); handleCloseNotifications(); }}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                >
                  View All Responses
                </button>
              </div>
            </div>
          )}
          {showNotifications && !hasNewNotifications && (
            <div className="fixed left-4 right-4 top-20 sm:!absolute sm:!top-full sm:!right-0 sm:!left-auto sm:!mt-0 sm:!w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-between">
                <h3 className="font-bold text-white">Notifications</h3>
                <button onClick={handleCloseNotifications} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No new notifications</p>
                <p className="text-gray-400 text-sm mt-1">New responses will appear here</p>
              </div>
            </div>
          )}
        </div>
        <div className="h-8 w-px bg-gray-200"></div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
            {currentUser?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800">{currentUser?.username || 'Admin'}</p>
            <p className="text-xs text-gray-500">{currentUser?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-red-500"
          title="Sign Out"
        >
          <Power className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

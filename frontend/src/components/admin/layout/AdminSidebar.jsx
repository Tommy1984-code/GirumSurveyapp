import React from 'react';
import { Activity, ChevronDown, ChevronRight, RefreshCw, X } from 'lucide-react';

export default function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  menuItems,
  activeTab,
  setActiveTab
}) {
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`w-64 bg-gradient-to-b from-slate-800 via-slate-800 to-slate-900 text-white flex flex-col fixed h-full z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span>Feedback Admin</span>
              <p className="text-xs text-slate-400 font-normal">Patient Survey</p>
            </div>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.filteredChildren) {
                    setActiveTab(item.filteredChildren[0].id);
                  } else {
                    setActiveTab(item.id);
                  }
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                  activeTab === item.id || (item.filteredChildren && item.filteredChildren.some(c => activeTab === c.id))
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 font-semibold shadow-lg shadow-blue-500/30'
                    : 'hover:bg-white/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {item.filteredChildren && <ChevronDown className="w-4 h-4 ml-auto" />}
                {activeTab === item.id && !item.filteredChildren && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
              {item.filteredChildren && (
                <div className={`ml-4 mt-1 space-y-1 ${activeTab === item.id || item.filteredChildren.some(c => activeTab === c.id) ? 'block' : 'hidden'}`}>
                  {item.filteredChildren.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setActiveTab(child.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                        activeTab === child.id
                          ? 'bg-white/20 font-semibold'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <child.icon className="w-4 h-4" />
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-slate-300 hover:text-white"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh Data
          </button>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </aside>
    </>
  );
}

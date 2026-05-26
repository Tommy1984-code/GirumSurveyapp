import React from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import ClipLoader from 'react-spinners/ClipLoader';

export default function ActivitySection({
  activityLogs,
  activityFilters,
  activityPagination,
  loadingActivity,
  onActivityFilterChange,
  onRefresh,
  onChangePage,
  onChangeLimit
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Activity Log</h2>
          <p className="text-gray-500">Track all admin actions and changes</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loadingActivity}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loadingActivity ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={activityFilters.date_from}
              onChange={(e) => onActivityFilterChange('date_from', e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={activityFilters.date_to}
              onChange={(e) => onActivityFilterChange('date_to', e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loadingActivity ? (
          <div className="flex justify-center py-16">
            <ClipLoader size={40} color="#3B82F6" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Action</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Details</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">{log.username?.[0]?.toUpperCase() || '?'}</span>
                          </div>
                          <span className="font-medium text-gray-800">{log.username || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          log.action.includes('create') ? 'bg-emerald-100 text-emerald-700' :
                          log.action.includes('update') ? 'bg-blue-100 text-blue-700' :
                          log.action.includes('delete') ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {activityLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No activity logs yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {activityPagination.total > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((activityPagination.page - 1) * activityPagination.limit) + 1} to {Math.min(activityPagination.page * activityPagination.limit, activityPagination.total)} of {activityPagination.total} entries
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={activityPagination.limit}
                    onChange={(e) => onChangeLimit(Number(e.target.value))}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                  <button
                    onClick={() => onChangePage(activityPagination.page - 1)}
                    disabled={activityPagination.page <= 1}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: activityPagination.total_pages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => onChangePage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                          page === activityPagination.page
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => onChangePage(activityPagination.page + 1)}
                    disabled={activityPagination.page >= activityPagination.total_pages}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

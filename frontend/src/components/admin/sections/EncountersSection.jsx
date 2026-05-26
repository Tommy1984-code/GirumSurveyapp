import React from 'react';
import {
  Activity,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Plus,
  Search,
  Send,
  Trash2,
  X
} from 'lucide-react';
import ClipLoader from 'react-spinners/ClipLoader';

export default function EncountersSection({
  encounters,
  encountersPagination,
  sendingAllSms,
  onSendAllSurveySms,
  onOpenCreateEncounter,
  encountersSearchInput,
  setEncountersSearchInput,
  onSearchEncounters,
  encountersDateFrom,
  onChangeDateFrom,
  encountersDateTo,
  onChangeDateTo,
  encounterSurveyStatus,
  onChangeSurveyStatus,
  onClearFilters,
  encounterSelectedIds,
  onToggleSelectAll,
  onClearSelected,
  exportEncountersToCSV,
  exportEncountersToExcel,
  onDeleteSelected,
  encounterLoading,
  onToggleEncounterSelect,
  sendingSms,
  onSendSurveySms,
  onViewEncounter,
  onFinishEncounter,
  onDeleteEncounter,
  onChangeLimit,
  onChangePage
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Encounters</h2>
          <p className="text-gray-500 mt-1">Manage patient encounters and surveys</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onSendAllSurveySms}
            disabled={sendingAllSms}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {sendingAllSms ? 'Sending...' : 'Send Survey All'}
          </button>
          <button
            onClick={onOpenCreateEncounter}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-200 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Encounter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Total</p>
              <p className="text-2xl font-bold text-gray-800">{encountersPagination.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">In Progress</p>
              <p className="text-2xl font-bold text-gray-800">{encountersPagination.in_progress || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Finished</p>
              <p className="text-2xl font-bold text-gray-800">{encountersPagination.finished || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Survey Filled</p>
              <p className="text-2xl font-bold text-gray-800">{encountersPagination.survey_filled || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <X className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Not Filled</p>
              <p className="text-2xl font-bold text-gray-800">{encountersPagination.survey_not_filled || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-col gap-1 max-w-[200px]">
              <span className="text-xs text-gray-500 font-medium">Doctor/Patient Name</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={encountersSearchInput}
                  onChange={(e) => setEncountersSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSearchEncounters();
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium">From:</span>
              <input
                type="date"
                value={encountersDateFrom}
                onChange={(e) => onChangeDateFrom(e.target.value)}
                className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-400 text-sm bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium">To:</span>
              <input
                type="date"
                value={encountersDateTo}
                onChange={(e) => onChangeDateTo(e.target.value)}
                className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-400 text-sm bg-white"
              />
            </div>
            <select
              value={encounterSurveyStatus}
              onChange={(e) => onChangeSurveyStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm bg-white max-w-[140px]"
            >
              <option value="">All Surveys</option>
              <option value="filled">Survey Filled</option>
              <option value="not_filled">Survey Not Filled</option>
            </select>
            <button
              onClick={onSearchEncounters}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm text-sm"
            >
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </button>
            <button
              onClick={onClearFilters}
              className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
            >
              <Filter className="w-4 h-4 inline mr-1" />
              Clear
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {encounterSelectedIds.size > 0 && (
            <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <span className="font-semibold text-blue-700 flex items-center gap-2"><Check className="w-4 h-4" /> {encounterSelectedIds.size} encounters selected</span>
              <div className="flex items-center gap-3">
                <button onClick={onToggleSelectAll} className="px-3 py-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm">
                  {encounterSelectedIds.size === encounters.length ? 'Deselect All' : 'Select All'}
                </button>
                <button onClick={onClearSelected} className="px-3 py-1.5 text-gray-600 hover:text-gray-800 font-medium text-sm">Clear</button>
                <div className="relative group">
                  <button className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium flex items-center gap-1.5 text-sm">
                    <Download className="w-4 h-4" /> Download <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button onClick={exportEncountersToCSV} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Download CSV
                    </button>
                    <button onClick={exportEncountersToExcel} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 border-t border-gray-100">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Download Excel
                    </button>
                  </div>
                </div>
                <button onClick={onDeleteSelected} className="px-4 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium flex items-center gap-1.5 text-sm">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          )}

          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={encounters.length > 0 && encounterSelectedIds.size === encounters.length}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate = encounterSelectedIds.size > 0 && encounterSelectedIds.size < encounters.length;
                      }
                    }}
                    onChange={onToggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Doctors</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Survey</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Filled</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {encounterLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="flex justify-center">
                      <ClipLoader size={36} color="#3B82F6" />
                    </div>
                  </td>
                </tr>
              ) : encounters.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No encounters found</p>
                    <button
                      onClick={onOpenCreateEncounter}
                      className="mt-4 text-emerald-600 hover:text-emerald-800 font-medium text-sm"
                    >
                      Create your first encounter
                    </button>
                  </td>
                </tr>
              ) : (
                encounters.map((encounter) => (
                  <tr key={encounter.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${encounterSelectedIds.has(encounter.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={encounterSelectedIds.has(encounter.id)}
                        onChange={() => onToggleEncounterSelect(encounter.id)}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-gray-800">{encounter.patient_name}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm whitespace-nowrap">{encounter.patient_phone || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm whitespace-nowrap">
                      <div className="flex gap-1">
                        {encounter.doctors?.map((doctor) => (
                          <span key={doctor.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
                            {doctor.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${
                        encounter.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {encounter.status === 'in_progress' ? (
                          <><Clock className="w-3.5 h-3.5 mr-1" /> In Progress</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Finished</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {encounter.status === 'finished' && encounter.survey_link ? (
                        encounter.survey_sent ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => onSendSurveySms(encounter.id)}
                            disabled={sendingSms.has(encounter.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingSms.has(encounter.id) ? 'Sending...' : 'Send Survey'}
                          </button>
                        )
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {encounter.survey_filled ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold whitespace-nowrap">
                          <X className="w-3.5 h-3.5" />
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm whitespace-nowrap">
                      {encounter.created_at ? new Date(encounter.created_at).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewEncounter(encounter)}
                          className="p-2.5 hover:bg-blue-50 rounded-xl transition-colors text-blue-600"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {encounter.status === 'in_progress' && (
                          <button
                            onClick={() => onFinishEncounter(encounter.id)}
                            className="p-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-emerald-600"
                            title="Mark Finished"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteEncounter(encounter)}
                          className="p-2.5 hover:bg-red-50 rounded-xl transition-colors text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {encounters.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {Math.min((encountersPagination.page - 1) * encountersPagination.limit + 1, encountersPagination.total)} - {Math.min(encountersPagination.page * encountersPagination.limit, encountersPagination.total)} of {encountersPagination.total} encounters
            </p>
            <div className="flex items-center gap-2">
              <select
                value={encountersPagination.limit}
                onChange={(e) => onChangeLimit(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
              <button
                onClick={() => onChangePage(encountersPagination.page - 1)}
                disabled={encountersPagination.page <= 1}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: encountersPagination.total_pages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => onChangePage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      page === encountersPagination.page
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onChangePage(encountersPagination.page + 1)}
                disabled={encountersPagination.page >= encountersPagination.total_pages}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

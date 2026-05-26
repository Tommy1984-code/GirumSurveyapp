import React from 'react';
import { ChevronLeft, ChevronRight, Edit3, Plus, Search, Smartphone, Trash2, Users, X } from 'lucide-react';
import ClipLoader from 'react-spinners/ClipLoader';

export default function PatientsSection({
  patients,
  patientsSearch,
  patientsSearchInput,
  setPatientsSearchInput,
  handlePatientsSearch,
  clearPatientsSearch,
  patientLoading,
  onOpenCreatePatient,
  onOpenEditPatient,
  onDeletePatient,
  patientsPagination,
  changePatientsPage,
  fetchPatientsWithLimit
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Patients</h2>
          <p className="text-gray-500">Manage patients who can be registered in the system</p>
        </div>
        <button
          onClick={onOpenCreatePatient}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Patient
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <form onSubmit={handlePatientsSearch} className="flex items-center gap-3">
            <div className="w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, ID or mobile..."
                value={patientsSearchInput}
                onChange={(e) => setPatientsSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm flex items-center gap-2 text-sm"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            {patientsSearch && (
              <button
                type="button"
                onClick={clearPatientsSearch}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center gap-2 text-sm"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </form>
        </div>

        {patientLoading ? (
          <div className="flex justify-center py-16"><ClipLoader size={40} color="#3B82F6" /></div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {patientsSearch ? 'No Patients Found' : 'No Patients Yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {patientsSearch ? 'Try a different search term' : 'Add patients to register them in the system'}
            </p>
            {patientsSearch ? (
              <button
                onClick={clearPatientsSearch}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={onOpenCreatePatient}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all"
              >
                Add Your First Patient
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Mobile</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{patient.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{patient.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {patient.phone ? (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Smartphone className="w-4 h-4" />
                            {patient.phone}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          patient.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {patient.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onOpenEditPatient(patient)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          <Edit3 className="w-5 h-5 inline" />
                        </button>
                        <button
                          onClick={() => onDeletePatient(patient)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {patientsPagination.total > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <p className="text-sm text-gray-500">
                  Showing {Math.min((patientsPagination.page - 1) * patientsPagination.limit + 1, patientsPagination.total)} - {Math.min(patientsPagination.page * patientsPagination.limit, patientsPagination.total)} of {patientsPagination.total} patients
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={patientsPagination.limit}
                    onChange={(e) => fetchPatientsWithLimit(1, patientsSearch, Number(e.target.value))}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                  <button
                    onClick={() => changePatientsPage(patientsPagination.page - 1)}
                    disabled={patientsPagination.page <= 1}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: patientsPagination.total_pages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => changePatientsPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                          page === patientsPagination.page
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => changePatientsPage(patientsPagination.page + 1)}
                    disabled={patientsPagination.page >= patientsPagination.total_pages}
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

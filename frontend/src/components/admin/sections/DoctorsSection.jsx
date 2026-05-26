import React from 'react';
import { ChevronLeft, ChevronRight, Edit3, Mail, Plus, Search, Trash2, Users, X } from 'lucide-react';
import ClipLoader from 'react-spinners/ClipLoader';

export default function DoctorsSection({
  doctors,
  doctorsFilter,
  doctorsSearch,
  doctorsSearchInput,
  setDoctorsSearchInput,
  handleDoctorsFilter,
  handleDoctorsSearch,
  clearDoctorsSearch,
  doctorLoading,
  onOpenCreateDoctor,
  onOpenEditDoctor,
  onDeleteDoctor,
  onReactivateDoctor,
  doctorsPagination,
  changeDoctorsPage,
  fetchDoctorsWithLimit
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Doctors</h2>
          <p className="text-gray-500">Manage doctors who can be selected by patients</p>
        </div>
        <button
          onClick={onOpenCreateDoctor}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Doctor
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {['active', 'inactive'].map(f => (
              <button
                key={f}
                onClick={() => handleDoctorsFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  doctorsFilter === f
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {f === 'active' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
          <form onSubmit={handleDoctorsSearch} className="flex items-center gap-3 flex-1 justify-end">
            <div className="w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or ID..."
                value={doctorsSearchInput}
                onChange={(e) => setDoctorsSearchInput(e.target.value)}
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
            {doctorsSearch && (
              <button
                type="button"
                onClick={clearDoctorsSearch}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center gap-2 text-sm"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </form>
        </div>

        {doctorLoading ? (
          <div className="flex justify-center py-16"><ClipLoader size={40} color="#3B82F6" /></div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {doctorsSearch ? 'No Doctors Found' : 'No Doctors Yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {doctorsSearch ? 'Try a different search term' : 'Add doctors so patients can select them in the survey'}
            </p>
            {doctorsSearch ? (
              <button
                onClick={clearDoctorsSearch}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={onOpenCreateDoctor}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200"
              >
                Add Your First Doctor
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
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Department</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {doctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {doctor.image_url ? (
                            <img src={doctor.image_url} alt={doctor.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {doctor.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{doctor.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{doctor.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{doctor.department || '-'}</td>
                      <td className="px-6 py-4">
                        {doctor.email ? (
                          <a href={'mailto:' + doctor.email} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {doctor.email}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          doctor.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {doctor.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {!doctor.is_active && (
                          <button
                            onClick={() => onReactivateDoctor(doctor.id)}
                            className="text-green-600 hover:text-green-800 mr-3 font-medium text-sm"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => onOpenEditDoctor(doctor)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          <Edit3 className="w-5 h-5 inline" />
                        </button>
                        <button
                          onClick={() => onDeleteDoctor(doctor)}
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

            {doctorsPagination.total > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <p className="text-sm text-gray-500">
                  Showing {Math.min((doctorsPagination.page - 1) * doctorsPagination.limit + 1, doctorsPagination.total)} - {Math.min(doctorsPagination.page * doctorsPagination.limit, doctorsPagination.total)} of {doctorsPagination.total} doctors
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={doctorsPagination.limit}
                    onChange={(e) => fetchDoctorsWithLimit(1, doctorsSearch, Number(e.target.value))}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                  <button
                    onClick={() => changeDoctorsPage(doctorsPagination.page - 1)}
                    disabled={doctorsPagination.page <= 1}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: doctorsPagination.total_pages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => changeDoctorsPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                          page === doctorsPagination.page
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => changeDoctorsPage(doctorsPagination.page + 1)}
                    disabled={doctorsPagination.page >= doctorsPagination.total_pages}
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

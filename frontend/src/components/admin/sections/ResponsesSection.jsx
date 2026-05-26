import React from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Filter,
  Search,
  Trash2
} from 'lucide-react';
import ClipLoader from 'react-spinners/ClipLoader';

export default function ResponsesSection({
  responses,
  downloadDropdown,
  setDownloadDropdown,
  exportToCSV,
  exportToExcel,
  searchInput,
  setSearchInput,
  handleFilterChange,
  filters,
  clearFilters,
  someSelected,
  selectedIds,
  setSelectedIds,
  allSelected,
  toggleSelectAll,
  exportSelectedToCSV,
  exportSelectedToExcel,
  deleteSelected,
  questions,
  loadingResponses,
  toggleSelect,
  formatDoctorNames,
  formatAnswerValue,
  pagination,
  setPageLimit,
  setPagination,
  fetchResponsesWithFilters,
  changePage
}) {
  const doctorQuestions = questions.filter((question) => question.category === 'doctor');
  const generalQuestions = questions.filter((question) => question.category === 'general');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Responses</h2>
          <p className="text-gray-500">View and manage patient feedback submissions</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setDownloadDropdown(!downloadDropdown)}
            disabled={responses.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
          >
            <Download className="w-5 h-5" /> Export <ChevronDown className="w-4 h-4" />
          </button>
          {downloadDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
              <button
                onClick={() => {
                  exportToCSV(responses);
                  setDownloadDropdown(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" /> Download as CSV
              </button>
              <button
                onClick={() => {
                  exportToExcel();
                  setDownloadDropdown(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
              >
                <FileSpreadsheet className="w-5 h-5 text-green-500" /> Download as Excel
              </button>
            </div>
          )}
        </div>
        {downloadDropdown && <div className="fixed inset-0 z-40" onClick={() => setDownloadDropdown(false)}></div>}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] max-w-[400px]">
              <div className="relative flex">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patient name or doctor name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleFilterChange({ ...filters, search: searchInput });
                    }
                  }}
                  className="w-full pl-10 pr-14 py-2.5 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200 text-sm transition-all"
                />
                <button
                  onClick={() => handleFilterChange({ ...filters, search: searchInput })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                >
                  Search
                </button>
              </div>
            </div>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange({ ...filters, date_from: e.target.value })}
              className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange({ ...filters, date_to: e.target.value })}
              className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={clearFilters} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium flex items-center gap-2 text-sm transition-colors">
              <Filter className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>

        {someSelected && (
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="font-semibold text-blue-700 flex items-center gap-2"><Check className="w-4 h-4" /> {selectedIds.size} responses selected</span>
            <div className="flex items-center gap-3">
              <button onClick={toggleSelectAll} className="px-3 py-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm">{allSelected ? 'Deselect All' : 'Select All'}</button>
              <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-gray-600 hover:text-gray-800 font-medium text-sm">Clear</button>
              <div className="relative group">
                <button className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium flex items-center gap-1.5 text-sm">
                  <Download className="w-4 h-4" /> Download <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button onClick={() => exportSelectedToCSV()} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Download CSV
                  </button>
                  <button onClick={() => exportSelectedToExcel()} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 border-t border-gray-100">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Download Excel
                  </button>
                </div>
              </div>
              <button onClick={deleteSelected} className="px-4 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium flex items-center gap-1.5 text-sm">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        )}

        {loadingResponses ? (
          <div className="flex justify-center py-16">
            <ClipLoader size={40} color="#3B82F6" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate = !allSelected && someSelected;
                          }
                        }}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Visit</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Doctors</th>
                    {doctorQuestions.map((question) => (
                      <th key={question.id} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[150px]">{question.key}</th>
                    ))}
                    {generalQuestions.map((question) => (
                      <th key={question.id} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[150px]">{question.key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.length === 0 ? (
                    <tr>
                      <td colSpan={5 + questions.length} className="px-4 py-12 text-center text-gray-500">No responses found</td>
                    </tr>
                  ) : (
                    responses.map((response) => (
                      <tr
                        key={response.submission_id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedIds.has(response.submission_id) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(response.submission_id)}
                            onChange={() => toggleSelect(response.submission_id)}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {response.submitted_at ? new Date(response.submitted_at).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono whitespace-nowrap">{response.visit_id}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">{response.patient_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {formatDoctorNames(response.question_answers, response.doctor_names)}
                        </td>
                        {doctorQuestions.map((question) => {
                          const answers = [];
                          const questionAnswers = response.question_answers || {};
                          const optionsObject = question.options || {};
                          const optionsEn = Array.isArray(optionsObject) ? optionsObject : (optionsObject.en || []);
                          const optionsAm = optionsObject.am || [];
                          const matchKey = question.key || String(question.id);
                          const doctorIds = response.selected_doctor_ids || [];

                          doctorIds.forEach((doctorId) => {
                            const answerKey = `doctor_${doctorId}_${matchKey}`;
                            const rawAnswer = questionAnswers[answerKey];
                            let displayAnswer = rawAnswer;

                            if (rawAnswer !== undefined) {
                              if (question.type === 'text') {
                                displayAnswer = rawAnswer;
                              } else if (Array.isArray(rawAnswer)) {
                                const translated = rawAnswer.map((answer) => {
                                  const amharicIndex = optionsAm.indexOf(String(answer));
                                  return amharicIndex !== -1 && optionsEn[amharicIndex] ? optionsEn[amharicIndex] : answer;
                                });
                                displayAnswer = translated.join(', ');
                              } else {
                                const amharicIndex = optionsAm.indexOf(String(rawAnswer));
                                if (amharicIndex !== -1 && optionsEn[amharicIndex]) {
                                  displayAnswer = optionsEn[amharicIndex];
                                }
                              }
                              answers.push(displayAnswer);
                            }
                          });

                          return (
                            <td key={question.id} className="px-4 py-3 text-sm text-gray-700 whitespace-normal max-w-[200px]">
                              <span className="line-clamp-2">{formatAnswerValue(answers.length > 0 ? answers.join(', ') : '-')}</span>
                            </td>
                          );
                        })}
                        {generalQuestions.map((question) => {
                          const rawAnswer = (response.question_answers || {})[question.key];
                          let displayAnswer = rawAnswer;

                          if (question.type === 'text') {
                            displayAnswer = rawAnswer;
                          } else {
                            const optionsObject = question.options || {};
                            const optionsEn = Array.isArray(optionsObject) ? optionsObject : (optionsObject.en || []);
                            const optionsAm = optionsObject.am || [];

                            if (Array.isArray(rawAnswer)) {
                              const translated = rawAnswer.map((answer) => {
                                const amharicIndex = optionsAm.indexOf(String(answer));
                                return amharicIndex !== -1 && optionsEn[amharicIndex] ? optionsEn[amharicIndex] : answer;
                              });
                              displayAnswer = translated.join(', ');
                            } else if (typeof rawAnswer === 'string') {
                              const amharicIndex = optionsAm.indexOf(rawAnswer);
                              if (amharicIndex !== -1 && optionsEn[amharicIndex]) {
                                displayAnswer = optionsEn[amharicIndex];
                              }
                            }
                          }

                          return (
                            <td key={question.id} className="px-4 py-3 text-sm text-gray-700 whitespace-normal max-w-[200px]">
                              <span className="line-clamp-2">{formatAnswerValue(displayAnswer)}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.total > 0 && (
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <p className="text-sm text-gray-500">
                  Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={pagination.limit}
                    onChange={(e) => {
                      const newLimit = Number(e.target.value);
                      setPageLimit(newLimit);
                      setPagination((previous) => ({ ...previous, limit: newLimit, page: 1 }));
                      fetchResponsesWithFilters(1, filters, newLimit);
                    }}
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                  <button
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">{pagination.page} / {pagination.total_pages || 1}</span>
                  <button
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.total_pages}
                    className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
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

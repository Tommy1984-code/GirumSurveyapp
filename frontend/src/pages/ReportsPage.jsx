import React from 'react';
import { Download } from 'lucide-react';

export default function ReportsPage({ showMessage, reportType = 'doctor' }) {
  const [loading, setLoading] = React.useState(false);
  const [reportData, setReportData] = React.useState(null);
  const [searchInput, setSearchInput] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [dateTo, setDateTo] = React.useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
  });
  const [exporting, setExporting] = React.useState(null);
  const authToken = localStorage.getItem('admin_session_token');

  function headers() {
    return authToken ? { 'x-session-token': authToken } : {};
  }

  async function fetchReport(doctorName, fromDate, toDate) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (doctorName) params.set('doctor_name', doctorName);
      if (fromDate) params.set('date_from', fromDate);
      if (toDate) params.set('date_to', toDate);

      const res = await fetch('/api/report?' + params.toString(), { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setReportData(data);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchReport(searchInput, dateFrom, dateTo);
  }

  function handleClear() {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setSearchInput('');
    setDateFrom(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
    setDateTo(`${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`);
    setReportData(null);
  }

  async function handleExport(format) {
    setExporting(format);
    try {
      const params = new URLSearchParams();
      params.set('format', format);
      params.set('report_type', reportType);
      if (searchInput) params.set('doctor_name', searchInput);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const res = await fetch('/api/report/export?' + params.toString(), { headers: headers() });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Export failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showMessage('Export successful!', 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setExporting(null);
    }
  }

  function getRatingColor(rating) {
    if (rating >= 4.5) return 'text-emerald-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-amber-600';
    return 'text-red-600';
  }

  React.useEffect(() => {
    fetchReport('', dateFrom, dateTo);
  }, []);

  const doctorQuestionKeys = reportData?.doctors?.[0]?.question_ratings?.map(qr => qr.question_key) || [];
  const generalQuestionKeys = reportData?.general_survey?.map(g => g.question_key) || [];

  const getDoctorColumnValue = (doctor, questionKey) => {
    const qr = doctor.question_ratings?.find(q => q.question_key === questionKey);
    if (!qr) return '-';
    if (qr.type === 'yes_no') {
      return `Yes: ${qr.yes_count}, No: ${qr.no_count}`;
    }
    return qr.average ? qr.average.toFixed(1) : '-';
  };

  const getGeneralColumnValue = (item, questionKey) => {
    const q = reportData?.general_survey?.find(g => g.question_key === questionKey);
    if (!q) return '-';
    if (q.type === 'yes_no') {
      return `Yes: ${q.yes_count}, No: ${q.no_count}`;
    }
    return q.average || '-';
  };

  const calculateGeneralAverage = () => {
    const numericValues = reportData?.general_survey
      ?.filter(g => g.type !== 'yes_no' && g.average)
      ?.map(g => g.average) || [];
    if (numericValues.length === 0) return '-';
    return (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
          <p className="text-gray-500">View performance reports and export data</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={!reportData || exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            disabled={!reportData || exporting}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!reportData || exporting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex items-center gap-3 flex-wrap">
          {reportType === 'doctor' && (
            <div className="w-48">
              <label className="block text-xs font-medium text-gray-500 mb-1">Doctor Name</label>
              <input
                type="text"
                placeholder="Filter by name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading report...</p>
        </div>
      ) : reportData ? (
        reportType === 'doctor' ? (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-lg font-semibold text-gray-800">Doctor Performance</h3>
              <p className="text-sm text-gray-500">{reportData.doctors?.length || 0} doctors found</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Doctor Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Patients</th>
                    {doctorQuestionKeys.map((key, idx) => (
                      <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{key}</th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Average Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.doctors?.length === 0 ? (
                    <tr>
                      <td colSpan={doctorQuestionKeys.length + 3} className="px-4 py-8 text-center text-gray-500">No doctor data found</td>
                    </tr>
                  ) : reportData.doctors?.filter(d => !searchInput || d.doctor_name.toLowerCase().includes(searchInput.toLowerCase())).map((doctor, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{doctor.doctor_name}</td>
                      <td className="px-4 py-3 text-gray-600">{doctor.patient_count}</td>
                      {doctorQuestionKeys.map((key, qidx) => (
                        <td key={qidx} className="px-4 py-3 text-gray-600">
                          {getDoctorColumnValue(doctor, key)}
                        </td>
                      ))}
                      <td className={`px-4 py-3 font-semibold ${getRatingColor(doctor.average_rating)}`}>
                        {doctor.average_rating ? doctor.average_rating.toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
              <h3 className="text-lg font-semibold text-gray-800">General Survey Results</h3>
              <p className="text-sm text-gray-500">{generalQuestionKeys.length} questions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Submissions</th>
                    {generalQuestionKeys.map((key, idx) => (
                      <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{key}</th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Average</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {generalQuestionKeys.length === 0 ? (
                    <tr>
                      <td colSpan={generalQuestionKeys.length + 2} className="px-4 py-8 text-center text-gray-500">No general survey data found</td>
                    </tr>
                  ) : (
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-purple-600">{reportData?.total_submissions || 0}</td>
                      {generalQuestionKeys.map((key, idx) => (
                        <td key={idx} className="px-4 py-3 font-semibold text-gray-800">
                          {getGeneralColumnValue(null, key)}
                        </td>
                      ))}
                      <td className="px-4 py-3 font-bold text-blue-600">{calculateGeneralAverage()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-12 text-gray-500">Enter search criteria and click Search to view reports</div>
      )}
    </div>
  );
}

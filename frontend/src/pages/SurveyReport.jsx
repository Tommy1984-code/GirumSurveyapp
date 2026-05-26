import React from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

export default function SurveyReport() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [exporting, setExporting] = React.useState(null);
  const [dateFrom, setDateFrom] = React.useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [dateTo, setDateTo] = React.useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
  });
  const authToken = localStorage.getItem('admin_session_token');

  function headers() {
    return authToken ? { 'x-session-token': authToken } : {};
  }

  async function fetchStats(from, to) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('date_from', from);
      if (to) params.set('date_to', to);
      const res = await fetch('/api/reports/survey-stats?' + params.toString(), { headers: headers() });
      const d = await res.json();
      if (res.ok) setData(d);
    } catch (e) {
      console.error('Failed to fetch survey stats:', e);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchStats(dateFrom, dateTo); }, []);

  function handleSearch(e) {
    e.preventDefault();
    fetchStats(dateFrom, dateTo);
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async function handleExport(format) {
    if (!data) return;
    setExporting(format);
    try {
      const rows = [{ 'Total Sent': data.total_sent, 'Filled': data.filled, 'Not Filled': data.not_filled }];
      if (format === 'csv') {
        const csv = 'Total Sent,Filled,Not Filled\n' + data.total_sent + ',' + data.filled + ',' + data.not_filled;
        downloadFile(csv, 'survey_report.csv', 'text/csv');
      } else if (format === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Survey Report');
        XLSX.writeFile(wb, 'survey_report.xlsx');
      } else if (format === 'pdf') {
        const res = await fetch('/api/report/export?format=pdf&report_type=survey', { headers: headers() });
        if (!res.ok) throw new Error('Export failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'survey_report.pdf';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Survey Report</h2>
          <p className="text-gray-500">Track survey completion rates</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport('csv')} disabled={!data || exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => handleExport('xlsx')} disabled={!data || exporting}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button onClick={() => handleExport('pdf')} disabled={!data || exporting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm text-sm">
            Search
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : data ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-center px-6 py-4 font-semibold text-gray-700 text-lg">Total Sent</th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-700 text-lg">Filled</th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-700 text-lg">Not Filled</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center px-6 py-6 font-bold text-3xl text-gray-800">{data.total_sent}</td>
                  <td className="text-center px-6 py-6 font-bold text-3xl text-green-600">{data.filled}</td>
                  <td className="text-center px-6 py-6 font-bold text-3xl text-gray-500">{data.not_filled}</td>
                </tr>
              </tbody>
            </table>
          </div>

        ) : (
          <div className="p-12 text-center text-gray-400">No data available</div>
        )}
      </div>
    </div>
  );
}

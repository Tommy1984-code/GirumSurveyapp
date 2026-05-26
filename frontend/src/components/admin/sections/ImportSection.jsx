import React from 'react';
import { Upload } from 'lucide-react';

export default function ImportSection({
  importModule,
  onImportModuleChange,
  importFile,
  setImportFile,
  importResults,
  importLoading,
  onStartImport
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Import Data</h2>
          <p className="text-gray-500">Import doctors or patients from CSV or Excel files</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-6">
          <div>
            <label className="block font-medium text-gray-700 mb-2">Module</label>
            <select
              value={importModule}
              onChange={(e) => onImportModuleChange(e.target.value)}
              className="w-full max-w-xs px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="doctors">Doctors</option>
              <option value="patients">Patients</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-2">File (CSV or Excel)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">Drop your file here or click to browse</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files[0] || null)}
                className="block mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-600 file:font-medium hover:file:bg-blue-100"
              />
              {importFile && (
                <p className="mt-2 text-sm text-gray-600">Selected: {importFile.name}</p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium text-gray-700 mb-2">Expected columns for {importModule === 'doctors' ? 'Doctors' : 'Patients'}:</h4>
            {importModule === 'doctors' ? (
              <ul className="text-sm text-gray-500 space-y-1">
                <li><span className="font-mono text-blue-600">name</span> <span className="text-red-500">*</span> - Doctor&apos;s full name</li>
                <li><span className="font-mono text-blue-600">department</span> - Department name</li>
                <li><span className="font-mono text-blue-600">email</span> - Email address</li>
              </ul>
            ) : (
              <ul className="text-sm text-gray-500 space-y-1">
                <li><span className="font-mono text-blue-600">name</span> <span className="text-red-500">*</span> - Patient&apos;s full name</li>
                <li><span className="font-mono text-blue-600">phone</span> - Phone number (used for deduplication)</li>
              </ul>
            )}
          </div>

          <button
            onClick={onStartImport}
            disabled={importLoading || !importFile}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
          >
            {importLoading ? 'Importing...' : 'Start Import'}
          </button>
        </div>
      </div>

      {importResults && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Import Results</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{importResults.total}</p>
              <p className="text-sm text-gray-500">Total Rows</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{importResults.created}</p>
              <p className="text-sm text-gray-500">Created</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{importResults.updated}</p>
              <p className="text-sm text-gray-500">Updated</p>
            </div>
          </div>
          {importResults.errors?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-600 mb-2">Errors ({importResults.errors.length})</h4>
              <div className="bg-red-50 rounded-xl p-4 max-h-40 overflow-y-auto">
                {importResults.errors.map((err, i) => (
                  <p key={i} className="text-sm text-red-600">Row {err.row}: {err.error}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

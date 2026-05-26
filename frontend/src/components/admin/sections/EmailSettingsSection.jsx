import React from 'react';
import { Eye, EyeOff, Save, Send } from 'lucide-react';
import ClipLoader from 'react-spinners/ClipLoader';

export default function EmailSettingsSection({
  emailSettings,
  loadingEmailSettings,
  setEmailSettings,
  showSmtpPass,
  setShowSmtpPass,
  emailSaving,
  emailTesting,
  onSave,
  onTest
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Email Settings</h2>
          <p className="text-gray-500">Configure SMTP email server for sending survey links and reports</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {loadingEmailSettings ? (
          <div className="flex justify-center py-16">
            <ClipLoader size={40} color="#3B82F6" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium text-gray-700 mb-2">SMTP Host</label>
                <input
                  type="text"
                  value={emailSettings.smtp_host}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                  placeholder="mail.girumhospital.com.et"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">SMTP Port</label>
                <input
                  type="number"
                  value={emailSettings.smtp_port}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtp_port: e.target.value })}
                  placeholder="587"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">SMTP User</label>
                <input
                  type="text"
                  value={emailSettings.smtp_user}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtp_user: e.target.value })}
                  placeholder="survey@girumhospital.com.et"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">SMTP Password</label>
                <div className="relative">
                  <input
                    type={showSmtpPass ? 'text' : 'password'}
                    value={emailSettings.smtp_pass}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_pass: e.target.value })}
                    placeholder="Enter SMTP password"
                    className="w-full px-4 py-2.5 pr-10 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">Secure (TLS)</label>
                <select
                  value={emailSettings.smtp_secure}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtp_secure: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value="false">False (Port 587)</option>
                  <option value="true">True (Port 465)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">From Address</label>
                <input
                  type="text"
                  value={emailSettings.smtp_from}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtp_from: e.target.value })}
                  placeholder='"Patient Feedback System" <survey@girumhospital.com.et>'
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={onSave}
                disabled={emailSaving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {emailSaving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={onTest}
                disabled={emailTesting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {emailTesting ? 'Sending...' : 'Test Email'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

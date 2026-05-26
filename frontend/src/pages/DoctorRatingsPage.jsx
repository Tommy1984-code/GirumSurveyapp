import React from 'react';
import { Star, Search, Mail, X } from 'lucide-react';
import StarRating from '../components/ui/StarRating';

export default function DoctorRatingsPage({ showMessage }) {
  const [doctorRatings, setDoctorRatings] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [sendingEmail, setSendingEmail] = React.useState(null);
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
  const [emailModal, setEmailModal] = React.useState({ isOpen: false, doctor: null });
  const [emailForm, setEmailForm] = React.useState({ email: '' });
  const authToken = localStorage.getItem('admin_session_token');

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  function parseInputDate(str) {
    const parts = str.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return str;
  }

  function headers() {
    return authToken ? { 'x-session-token': authToken } : {};
  }

  async function fetchRatings(doctorName, fromDate, toDate) {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (doctorName) params.set('doctor_name', doctorName);
      if (fromDate) params.set('date_from', fromDate);
      if (toDate) params.set('date_to', toDate);

      const res = await fetch('/api/doctor-ratings?' + params.toString(), { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDoctorRatings(data.ratings || []);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchRatings(searchInput, dateFrom, dateTo);
  }

  function handleClear() {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setSearchInput('');
    setDateFrom(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
    setDateTo(`${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`);
    setDoctorRatings([]);
    setHasSearched(false);
  }

  function getRatingBg(rating) {
    if (rating >= 4.5) return 'bg-emerald-100 text-emerald-700';
    if (rating >= 3.5) return 'bg-blue-100 text-blue-700';
    if (rating >= 2.5) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  }

  async function openEmailModal(doctor) {
    setEmailForm({ email: doctor.email || '' });
    setEmailModal({ isOpen: true, doctor });
  }

  async function handleSendToAll() {
    const doctorsWithEmail = doctorRatings.filter(d => d.email);
    const doctorsWithoutEmail = doctorRatings.filter(d => !d.email);
    
    if (doctorsWithEmail.length === 0) {
      showMessage('No doctors have email addresses configured', 'error');
      return;
    }

    if (doctorsWithoutEmail.length > 0) {
      showMessage(`${doctorsWithoutEmail.length} doctor(s) skipped (no email): ${doctorsWithoutEmail.map(d => d.doctor_name).join(', ')}`, 'info');
    }

    setSendingEmail('all');
    try {
      const res = await fetch('/api/doctor-ratings/send-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({
          ratings: doctorsWithEmail,
          date_from: dateFrom,
          date_to: dateTo
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showMessage(data.message || `Sent ${doctorsWithEmail.length} emails successfully!`, 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSendingEmail(null);
    }
  }

  async function handleSendEmail(e) {
    e.preventDefault();
    if (!emailForm.email) {
      showMessage('Email is required', 'error');
      return;
    }

    setSendingEmail(emailModal.doctor.doctor_id);
    try {
      const res = await fetch('/api/doctor-ratings/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({
          ...emailModal.doctor,
          email: emailForm.email,
          date_from: dateFrom,
          date_to: dateTo
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showMessage('Email sent successfully!', 'success');
      setEmailModal({ isOpen: false, doctor: null });
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSendingEmail(null);
    }
  }

  function getStarColor(rating) {
    if (rating >= 4.5) return 'text-emerald-500';
    if (rating >= 3.5) return 'text-blue-500';
    if (rating >= 2.5) return 'text-amber-500';
    if (rating >= 1.5) return 'text-orange-500';
    return 'text-red-500';
  }

  function renderStars(rating, size = 'w-5 h-5') {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`${size} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Doctor Ratings Report</h2>
        <p className="text-gray-500">Search for a doctor to view their ratings</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-600 mb-1">Doctor Name / ID</label>
            <input
              type="text"
              placeholder="e.g., Dr Dawit or D0001..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
          >
            <Search className="w-5 h-5 inline mr-2" />
            Search
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            Clear
          </button>
        </form>
      </div>

      {!hasSearched && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Search for a doctor</p>
          <p className="text-gray-400 text-sm mt-2">Enter a doctor name or date range and click Search</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {!loading && hasSearched && doctorRatings.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No ratings found</p>
          <p className="text-gray-400 text-sm mt-2">Try a different doctor name or date range</p>
        </div>
      )}

      {!loading && doctorRatings.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-lg px-3 py-1.5">
                  <span className="text-white font-bold">{doctorRatings.length}</span>
                  <span className="text-emerald-100 ml-1">doctors found</span>
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-1.5">
                  <span className="text-white font-bold">{doctorRatings.filter(d => d.email).length}</span>
                  <span className="text-emerald-100 ml-1">with email</span>
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-1.5">
                  <span className="text-white font-bold">{doctorRatings.filter(d => !d.email).length}</span>
                  <span className="text-emerald-100 ml-1">no email</span>
                </div>
              </div>
              <button
                onClick={handleSendToAll}
                disabled={sendingEmail === 'all' || doctorRatings.filter(d => d.email).length === 0}
                className="px-6 py-2.5 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendingEmail === 'all' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send to All ({doctorRatings.filter(d => d.email).length})
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-8">
          {doctorRatings.map((doctor) => {
            const rating = Number(doctor.average_rating || 0);
            const totalPatients = doctor.total_patients || 0;
            const questionRatings = doctor.question_ratings || [];
            
            const getRatingStatus = () => {
              if (rating >= 4.5) return { text: 'Excellent', label: 'Outstanding performance', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
              if (rating >= 4.0) return { text: 'Very Good', label: 'Strong performance', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
              if (rating >= 3.5) return { text: 'Good', label: 'Good performance', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
              if (rating >= 3.0) return { text: 'Average', label: 'Moderate performance', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
              if (rating >= 2.0) return { text: 'Below Average', label: 'Needs improvement', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' };
              return { text: 'Poor', label: 'Requires urgent attention', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
            };
            
            const status = getRatingStatus();
            
            return (
              <div key={doctor.doctor_id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Patient Feedback Report</h2>
                      <p className="text-blue-100 mt-1">Confidential - For Doctor's Review</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-100">Report Period</p>
                      <p className="font-semibold">{dateFrom ? formatDisplayDate(dateFrom) : 'All Time'} - {dateTo ? formatDisplayDate(dateTo) : 'Present'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Doctor Info */}
                <div className="px-8 py-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                      {doctor.doctor_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-800">{doctor.doctor_name}</h3>
                      <p className="text-gray-500">Doctor ID: {doctor.doctor_id} | Department: {doctor.department || 'General'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Summary Box */}
                <div className="px-8 py-6 bg-gray-50">
                  <p className="text-gray-600 leading-relaxed">
                    Dear <span className="font-semibold text-gray-800">{doctor.doctor_name}</span>,
                  </p>
                  <p className="text-gray-600 leading-relaxed mt-3">
                    We are pleased to present your patient feedback report for the period of <span className="font-semibold">{dateFrom ? formatDisplayDate(dateFrom) : 'all available time'}</span> to <span className="font-semibold">{dateTo ? formatDisplayDate(dateTo) : 'present'}</span>. 
                    This report summarizes the feedback collected from <span className="font-semibold">{totalPatients} patient{totalPatients !== 1 ? 's' : ''}</span> who completed our patient satisfaction survey during their visit.
                  </p>
                </div>
                
                {/* Main Rating */}
                <div className="px-8 py-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-gray-500 text-sm uppercase tracking-wide">Overall Rating</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-5xl font-bold text-gray-800">{rating.toFixed(1)}</span>
                        <span className="text-xl text-gray-400">/ 5.0</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <StarRating value={rating} size="md" />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Based on {totalPatients} patient{totalPatients !== 1 ? 's' : ''}</p>
                    </div>
                    <div className={`px-6 py-4 rounded-xl border-2 ${status.bg}`}>
                      <p className={`text-xl font-bold ${status.color}`}>{status.text}</p>
                      <p className="text-sm text-gray-600 mt-1">{status.label}</p>
                    </div>
                  </div>
                  
                  {/* Rating Scale Legend */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Rating Scale:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs text-gray-600">
                      <div className="text-center"><span className="font-bold">5</span> = Excellent</div>
                      <div className="text-center"><span className="font-bold">4</span> = Very Good</div>
                      <div className="text-center"><span className="font-bold">3</span> = Average</div>
                      <div className="text-center"><span className="font-bold">2</span> = Not Good</div>
                      <div className="text-center"><span className="font-bold">1</span> = Very Bad</div>
                    </div>
                  </div>
                  
                  {/* Question Ratings */}
                  {questionRatings.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Detailed Ratings by Category</h4>
                      <div className="space-y-4">
                        {questionRatings.map((qr, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 text-lg">{qr.question_key}</p>
                                {qr.type === 'yes_no' ? (
                                  <div className="flex gap-4 mt-2">
                                    <span className="text-sm text-emerald-600 font-medium">Yes: {qr.yes_count}</span>
                                    <span className="text-sm text-red-600 font-medium">No: {qr.no_count}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 mt-1">
                                    <StarRating value={qr.average} size="sm" />
                                    <span className="text-sm text-gray-500">({qr.average.toFixed(1)} / 5.0)</span>
                                  </div>
                                )}
                                <p className="text-sm text-gray-500 mt-1">{qr.count} patient{qr.count !== 1 ? 's' : ''} rated this aspect</p>
                              </div>
                              {qr.type === 'yes_no' ? (
                                <div className="text-right">
                                  <span className="text-3xl font-bold text-gray-800">{qr.yes_count}</span>
                                  <p className="text-xs text-gray-500">Yes answers</p>
                                </div>
                              ) : (
                                <div className="text-right">
                                  <div className="flex items-center gap-2">
                                    <span className="text-3xl font-bold text-gray-800">{qr.average.toFixed(1)}</span>
                                    <div className="flex flex-col items-center">
                                      <StarRating value={qr.average} size="sm" />
                                      <span className="text-xs text-gray-500 mt-1">out of 5</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            {qr.type !== 'yes_no' && (
                              <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full ${
                                    qr.average >= 4.5 ? 'bg-emerald-500' :
                                    qr.average >= 4.0 ? 'bg-emerald-400' :
                                    qr.average >= 3.5 ? 'bg-blue-500' :
                                    qr.average >= 3.0 ? 'bg-blue-400' :
                                    qr.average >= 2.0 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${(qr.average / 5) * 100}%` }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Feedback */}
                <div className="px-8 py-6 bg-blue-50 border-t border-blue-100">
                  <h4 className="font-bold text-gray-800 mb-2">Performance Summary</h4>
                  <p className="text-gray-600">
                    {rating >= 4.0 
                      ? 'Outstanding performance! Patients consistently rate you at the highest levels across all aspects of care. Your dedication to patient satisfaction is evident. Continue providing this exceptional level of care.'
                      : rating >= 3.5 
                      ? 'Good performance. Patients appreciate your care and service. While you are performing well, there are specific areas where focused improvement could elevate patient satisfaction even further.'
                      : rating >= 3.0
                      ? 'Average performance indicates that there is room for improvement. Consider reviewing the detailed feedback below to identify specific areas where you can enhance patient experience.'
                      : 'Below average ratings suggest that improvements are needed. We recommend reviewing the feedback carefully and working with your supervisors to develop an improvement plan.'}
                  </p>
                </div>
                
                {/* Footer */}
                <div className="px-8 py-4 bg-gray-100 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-500">
                      This is an automated report from the Patient Feedback System.
                    </p>
                    {doctor.email ? (
                      <span className="flex items-center gap-1 text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        <Mail className="w-4 h-4" />
                        {doctor.email}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                        <Mail className="w-4 h-4" />
                        No email configured
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => openEmailModal(doctor)}
                    disabled={sendingEmail === doctor.doctor_id || !doctor.email}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sendingEmail === doctor.doctor_id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {emailModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEmailModal({ isOpen: false, doctor: null })}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-modal shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Send Rating Report</h3>
                <p className="text-gray-500 text-sm">Dr. {emailModal.doctor?.doctor_name}</p>
              </div>
              <button onClick={() => setEmailModal({ isOpen: false, doctor: null })} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className={`text-3xl font-bold ${getStarColor(emailModal.doctor?.average_rating)}`}>
                  {emailModal.doctor?.average_rating?.toFixed(1)} / 5
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Based on {emailModal.doctor?.total_patients} reviews
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor's Email</label>
                <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  {emailForm.email || 'No email configured'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Email is auto-fetched from doctor profile</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEmailModal({ isOpen: false, doctor: null })}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50"
                >
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

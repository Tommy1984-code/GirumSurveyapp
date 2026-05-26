import React from 'react';
import ClipLoader from 'react-spinners/ClipLoader';
import { AlertCircle, Sparkles, Check, MessageSquare, Heart, TrendingUp, Shield, Users, ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown, Clock, ClipboardList } from 'lucide-react';
import StarRating from '../components/ui/StarRating';
import { loadSurvey, submitFeedback } from '../services/api';
import { t, getQuestionLabel, getQuestionOptions, getQuestionLabelWithDoctorName, getDoctorQuestionKey, translations } from '../utils/translations';

export default function SurveyPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || params.get('t');

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [isFinished, setIsFinished] = React.useState(false);
  const [finishReason, setFinishReason] = React.useState('');
  const [patientName, setPatientName] = React.useState('');
  const [doctors, setDoctors] = React.useState([]);
  const [doctorQuestions, setDoctorQuestions] = React.useState([]);
  const [generalQuestions, setGeneralQuestions] = React.useState([]);
  const [questionAnswers, setQuestionAnswers] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [selectedLang, setSelectedLang] = React.useState('am');
  const [notFound, setNotFound] = React.useState(false);
  const [expired, setExpired] = React.useState(false);

  const totalPages = doctors.length + (generalQuestions.length > 0 ? 1 : 0);

  React.useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }

      const completedKey = 'survey_completed_' + token;
      const savedCompletion = localStorage.getItem(completedKey);
      if (savedCompletion) {
        const completionData = JSON.parse(savedCompletion);
        setIsFinished(true);
        setFinishReason('submitted');
        if (completionData.language) {
          setSelectedLang(completionData.language);
        }
        setLoading(false);
        return;
      }

      try {
        const data = await loadSurvey(token);
        setPatientName(data.patient_name || '');
        setDoctors(data.doctors || []);
        setDoctorQuestions(data.doctor_questions || []);
        setGeneralQuestions(data.general_questions || []);
      } catch (err) {
        if (err.message === 'token_expired') {
          setExpired(true);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  React.useEffect(() => {
    setError('');
  }, [currentPage]);

  function setQuestionValue(key, value) {
    setQuestionAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMultiChoice(key, option) {
    setQuestionAnswers((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const exists = current.includes(option);
      const next = exists ? current.filter((x) => x !== option) : [...current, option];
      return { ...prev, [key]: next };
    });
  }

  function getCurrentDoctor() {
    if (currentPage < doctors.length) {
      return doctors[currentPage];
    }
    return null;
  }

  function goToNextPage() {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function goToPrevPage() {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (doctors.length === 0) {
      setError(t('selectAtLeastOne', selectedLang));
      return;
    }

    for (const d of doctors) {
      for (const q of doctorQuestions) {
        if (q.required) {
          const key = getDoctorQuestionKey(d.id, q.id);
          if (!(key in questionAnswers) || questionAnswers[key] === '' || questionAnswers[key] === null || questionAnswers[key] === undefined) {
            setError('Please answer all required questions for ' + d.name);
            return;
          }
        }
      }
    }
    
    for (const q of generalQuestions) {
      if (q.required) {
        const answer = questionAnswers[q.id];
        if (answer === undefined || answer === null || answer === '') {
          setError('Please answer all required general questions');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        token,
        question_answers: questionAnswers,
        language: selectedLang,
        patient_name: patientName,
        selected_doctor_ids: doctors.map(d => d.id),
        selected_doctor_names: doctors.map(d => d.name)
      };

      await submitFeedback(payload);
      setIsFinished(true);
      setFinishReason('submitted');
      setError('');
      localStorage.setItem('survey_completed_' + token, JSON.stringify({ language: selectedLang }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function renderQuestionInput(q, answerKey) {
    const value = questionAnswers[answerKey];

    if (q.type === 'text') {
      return (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => setQuestionValue(answerKey, e.target.value)}
          placeholder={t('shareThoughts', selectedLang)}
          className="w-full p-5 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200 resize-none transition-all text-gray-700"
          rows={4}
        />
      );
    }

    if (q.type === 'number') {
      return (
        <input
          type="number"
          value={value ?? ''}
          min={q.min ?? undefined}
          max={q.max ?? undefined}
          onChange={(e) => setQuestionValue(answerKey, e.target.value === '' ? '' : Number(e.target.value))}
          placeholder={t('enterNumber', selectedLang)}
          className="w-full p-5 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200 transition-all text-gray-700"
        />
      );
    }

    if (q.type === 'yes_no') {
      const yesNoOptions = getQuestionOptions(q, selectedLang);
      const yesLabel = yesNoOptions[0] || 'Yes';
      const noLabel = yesNoOptions[1] || 'No';
      return (
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => setQuestionValue(answerKey, 'yes')}
            className={`flex-1 max-w-[180px] py-6 rounded-2xl font-bold transition-all flex flex-col items-center gap-2 ${
              value === 'yes'
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl shadow-emerald-200 scale-105'
                : 'bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border-2 border-transparent hover:border-emerald-200'
            }`}
          >
            <ThumbsUp className="w-10 h-10" />
            <span className="text-lg">{yesLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setQuestionValue(answerKey, 'no')}
            className={`flex-1 max-w-[180px] py-6 rounded-2xl font-bold transition-all flex flex-col items-center gap-2 ${
              value === 'no'
                ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-xl shadow-red-200 scale-105'
                : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 border-2 border-transparent hover:border-red-200'
            }`}
          >
            <ThumbsDown className="w-10 h-10" />
            <span className="text-lg">{noLabel}</span>
          </button>
        </div>
      );
    }

    if (q.type === 'single_choice') {
      const options = getQuestionOptions(q, selectedLang);
      return (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt, idx) => (
            <button
              key={opt}
              type="button"
              onClick={() => setQuestionValue(answerKey, opt)}
              className={`py-4 px-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-3 ${
                value === opt
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-2 border-gray-100 hover:border-blue-200'
              }`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                value === opt ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (q.type === 'multi_choice') {
      const selected = Array.isArray(value) ? value : [];
      const options = getQuestionOptions(q, selectedLang);
      return (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleMultiChoice(answerKey, opt)}
              className={`py-4 px-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                selected.includes(opt)
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-200'
                  : 'bg-gray-50 text-gray-700 hover:bg-violet-50 hover:text-violet-600 border-2 border-gray-100 hover:border-violet-200'
              }`}
            >
              {selected.includes(opt) && <Check className="w-5 h-5" />}
              {opt}
            </button>
          ))}
        </div>
      );
    }

    const min = Number.isFinite(q.min) ? q.min : 1;
    const max = Number.isFinite(q.max) ? q.max : 5;
    return (
      <div className="flex flex-col items-center gap-4">
        <StarRating value={value} min={min} max={max} onChange={(next) => setQuestionValue(answerKey, next)} size="xl" />
        <span className="text-base text-gray-500 font-medium">
          {value ? `${value} ${t('rating', selectedLang)} ${max}` : `${t('tapToRate', selectedLang)} (${min}-${max})`}
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <ClipLoader color="#3b82f6" size={50} className="mx-auto mb-6" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('loading', selectedLang)}</h2>
          <p className="text-gray-500">{t('pleaseWait', selectedLang)}</p>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-8 py-12 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white opacity-10"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="relative mx-auto mb-6 w-28 h-28">
                <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
                  <Sparkles className="w-14 h-14 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Check className="w-6 h-6 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-3">{t('thankYou', selectedLang)}</h2>
              <p className="text-emerald-100 text-lg">
                {finishReason === 'submitted' 
                  ? t('feedbackSubmitted', selectedLang)
                  : t('surveyCompleted', selectedLang)}
              </p>
            </div>
          </div>
          
          <div className="p-8">
            <div className="flex justify-center gap-6 mb-8">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="w-7 h-7 text-blue-500" />
                </div>
                <p className="text-sm text-gray-500">{t('feedback', selectedLang)}</p>
                <p className="font-bold text-gray-800">{t('received', selectedLang)}</p>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Heart className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="text-sm text-gray-500">{t('yourVoice', selectedLang)}</p>
                <p className="font-bold text-gray-800">{t('matters', selectedLang)}</p>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="text-center">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-7 h-7 text-purple-500" />
                </div>
                <p className="text-sm text-gray-500">{t('better', selectedLang)}</p>
                <p className="font-bold text-gray-800">{t('services', selectedLang)}</p>
              </div>
            </div>
            
            <p className="text-center text-gray-500">
              {finishReason === 'submitted' 
                ? t('responseHelp', selectedLang)
                : t('eachSurveyOnce', selectedLang)}
            </p>
            
            <div className="mt-8 flex justify-center">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl px-6 py-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">{t('confidentialFinal', selectedLang)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-950 flex items-center justify-center p-4 overflow-hidden">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center animate-fade-in border border-white/10">
          <div className="relative w-36 h-36 mx-auto mb-6">
            <div className="absolute inset-0 bg-white/5 rounded-full blur-xl"></div>
            <svg viewBox="-60 -60 120 120" className="w-full h-full">
              <defs>
                <filter id="clockGlow">
                  <feGaussianBlur stdDeviation="2" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <circle cx="0" cy="0" r="50" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
              <circle cx="0" cy="0" r="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => (
                <line key={i} x1={45*Math.cos((a-90)*Math.PI/180)} y1={45*Math.sin((a-90)*Math.PI/180)} x2={48*Math.cos((a-90)*Math.PI/180)} y2={48*Math.sin((a-90)*Math.PI/180)} stroke="rgba(255,255,255,0.3)" strokeWidth={i%3===0?2:1}/>
              ))}
              <line x1="0" y1="0" x2="0" y2="-28" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" transform="rotate(-60)" filter="url(#clockGlow)"/>
              <line x1="0" y1="0" x2="0" y2="-38" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" transform="rotate(60)" filter="url(#clockGlow)"/>
              <circle cx="0" cy="0" r="3" fill="white" opacity="0.8"/>
              <text x="0" y="30" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="sans-serif">24h</text>
            </svg>
          </div>

          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 100 120" className="w-24 h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="18" r="13" fill="white" fillOpacity="0.25" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
              <path d="M50 32 L50 75" stroke="rgba(255,255,255,0.35)" strokeWidth="6" strokeLinecap="round"/>
              <path d="M50 45 L18 18" stroke="rgba(255,255,255,0.4)" strokeWidth="5" strokeLinecap="round"/>
              <path d="M50 45 L82 18" stroke="rgba(255,255,255,0.4)" strokeWidth="5" strokeLinecap="round"/>
              <line x1="14" y1="22" x2="18" y2="18" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="16" x2="18" y2="18" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="20" y1="14" x2="18" y2="18" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="86" y1="22" x2="82" y2="18" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="84" y1="16" x2="82" y2="18" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="80" y1="14" x2="82" y2="18" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M50 75 L38 105" stroke="rgba(255,255,255,0.25)" strokeWidth="5" strokeLinecap="round"/>
              <path d="M50 75 L62 105" stroke="rgba(255,255,255,0.25)" strokeWidth="5" strokeLinecap="round"/>
            </svg>
          </div>

          <h1 className="text-white text-3xl md:text-4xl font-bold mb-4 tracking-wide">Time's Up</h1>
          <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
            <p className="text-gray-300 text-lg leading-relaxed">
              This survey link has expired. Each survey is only available for{' '}
              <span className="text-amber-400 font-bold">24 hours</span>.
            </p>
          </div>
          <p className="text-gray-500 mb-8">This survey is no longer available for submission.</p>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <p className="text-sm text-gray-500">Girum Hospital — We value your feedback</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Survey Not Found</h2>
          <p className="text-gray-500 mb-6">Please use the survey link sent to your phone or email.</p>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">If you believe this is an error, please contact support.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="absolute -top-20 -right-20 w-52 h-52 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-cyan-400/20 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="relative flex-shrink-0">
                  <img src="/image/girum-logo.png" alt="Girum Hospital" className="w-16 h-16 sm:w-24 sm:h-24 md:w-36 md:h-36 object-contain" style={{filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'}} />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{t('welcomeTitle', selectedLang)}</h1>
                  <p className="text-emerald-100 mt-0.5 text-xs sm:text-sm">{t('welcomeSubtitle', selectedLang)}</p>
                </div>
              </div>
              <div className="flex items-center bg-white/15 backdrop-blur-md rounded-full p-1 shadow-lg ring-2 ring-white/20">
                <button
                  onClick={() => setSelectedLang('en')}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1 ${
                    selectedLang === 'en' 
                      ? 'bg-white text-emerald-700 shadow-md' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <span className="sm:hidden">EN</span>
                  <span className="hidden sm:inline">English</span>
                </button>
                <button
                  onClick={() => setSelectedLang('om')}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1 ${
                    selectedLang === 'om' 
                      ? 'bg-white text-emerald-700 shadow-md' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <span className="sm:hidden">OR</span>
                  <span className="hidden sm:inline">Afaan Oromoo</span>
                </button>
                <button
                  onClick={() => setSelectedLang('am')}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1 ${
                    selectedLang === 'am' 
                      ? 'bg-white text-emerald-700 shadow-md' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <span className="sm:hidden">አም</span>
                  <span className="hidden sm:inline">አማርኛ</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-5 mb-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-red-700">Error</p>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); } }} className="space-y-6">
              {currentPage === 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100">
                  <p className="text-gray-700 leading-relaxed text-center">
                    <span className="text-lg font-medium block">
                    {selectedLang === 'am'
                      ? t('welcomeTextAm', selectedLang)
                      : selectedLang === 'om'
                      ? t('welcomeTextOm', selectedLang)
                      : t('welcomeTextEn', selectedLang)
                    }
                    </span>
                  </p>
                </div>
              )}

              {currentPage === 0 && patientName && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {patientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-emerald-600 font-medium">{t('yourName', selectedLang)}</p>
                      <p className="text-lg font-bold text-gray-800">{patientName}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 mb-3">{t('yourDoctors', selectedLang)}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {doctors.map(doctor => (
                      <div key={doctor.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-emerald-100">
                        {doctor.image_url ? (
                          <img src={doctor.image_url} alt={doctor.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {doctor.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{doctor.name}</p>
                          {doctor.department && <p className="text-xs text-gray-500">{doctor.department}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border-2 border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  {doctors.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                          currentPage < doctors.length
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {currentPage >= doctors.length ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium whitespace-nowrap">{t('doctorsShort', selectedLang)} ({doctors.length})</span>
                      </div>
                      {generalQuestions.length > 0 && (
                        <div className={`w-6 h-0.5 ${currentPage >= doctors.length ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                      )}
                    </div>
                  )}
                  {generalQuestions.length > 0 && (
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        currentPage >= doctors.length
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span className="text-sm font-medium">{t('general', selectedLang)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                      style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                    {currentPage + 1} / {totalPages}
                  </span>
                </div>
              </div>

              {(() => {
                const currentDoctor = getCurrentDoctor();
                
                if (currentDoctor) {
                  return (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-xl">{t('doctorSurvey', selectedLang)}</h3>
                          <p className="text-sm text-gray-500">{t('page', selectedLang)} {currentPage + 1} {t('rating', selectedLang)} {totalPages}</p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-100">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {currentDoctor.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-lg">{currentDoctor.name}</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {doctorQuestions.map((q) => {
                            const answerKey = getDoctorQuestionKey(currentDoctor.id, q.id);
                            return (
                              <div key={`${currentDoctor.id}_${q.id}`} className="bg-white rounded-xl p-5 border border-gray-100">
                                <label className="block font-semibold text-gray-800 text-base mb-4 flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">Q.</span>
                                  {getQuestionLabelWithDoctorName(getQuestionLabel(q, selectedLang), currentDoctor.name)}
                                  {q.required && <span className="text-red-400">*</span>}
                                </label>
                                {renderQuestionInput(q, answerKey)}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={goToPrevPage}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                        >
                          <ArrowLeft className="w-5 h-5" />
                          {t('back', selectedLang)}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            
                            if (currentPage < doctors.length) {
                              const currentDoctor = doctors[currentPage];
                              for (const q of doctorQuestions) {
                                if (q.required) {
                                  const key = getDoctorQuestionKey(currentDoctor.id, q.id);
                                  const answer = questionAnswers[key];
                                  if (answer === undefined || answer === null || answer === '') {
                                    setError('Please answer all required questions for ' + currentDoctor.name);
                                    return;
                                  }
                                }
                              }
                            }
                            
                            setError('');
                            goToNextPage();
                          }}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                        >
                          {currentPage === doctors.length - 1 && generalQuestions.length > 0 ? t('nextGeneral', selectedLang) : t('next', selectedLang)}
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <ClipboardList className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-xl">{t('generalSurvey', selectedLang)}</h3>
                        <p className="text-sm text-gray-500">{t('hospitalService', selectedLang)}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {generalQuestions.map((q) => (
                        <div key={q.id} className="bg-white rounded-xl p-5 border border-gray-100">
                          <label className="block font-semibold text-gray-800 text-base mb-4 flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">Q.</span>
                            {getQuestionLabel(q, selectedLang)}
                            {q.required && <span className="text-red-400">*</span>}
                          </label>
                          {renderQuestionInput(q, q.id)}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={goToPrevPage}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        {t('back', selectedLang)}
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50"
                      >
                        {submitting ? t('submitting', selectedLang) : t('submit', selectedLang)}
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </form>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Shield className="w-4 h-4" />
              <span className="text-sm">{t('confidential', selectedLang)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Send = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

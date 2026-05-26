import React from 'react';
import {
  ArrowUpDown,
  Check,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Plus,
  Trash2,
  X
} from 'lucide-react';

export default function QuestionsSection({
  questions,
  editingQuestion,
  newQuestion,
  createQuestion,
  setNewQuestion,
  questionTypeCards,
  setType,
  isChoice,
  isRanged,
  optionInput,
  setOptionInput,
  addOption,
  removeOption,
  optionInputAm,
  setOptionInputAm,
  addOptionAm,
  removeOptionAm,
  optionInputOm,
  setOptionInputOm,
  addOptionOm,
  removeOptionOm,
  cancelEdit,
  questionFilter,
  setQuestionFilter,
  moveQuestion,
  editQuestion,
  toggleQuestionActive,
  deleteQuestion
}) {
  const doctorQuestionCount = questions.filter((question) => question.category === 'doctor').length;
  const generalQuestionCount = questions.filter((question) => question.category === 'general').length;
  const filteredQuestions = questions
    .filter((question) => questionFilter === 'all' || question.category === questionFilter)
    .sort((a, b) => (a.category === 'doctor' ? 0 : 1) - (b.category === 'doctor' ? 0 : 1));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Question Manager</h2>
        <p className="text-gray-500">Create and manage survey questions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${editingQuestion ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              {editingQuestion ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
            </div>
            {editingQuestion ? 'Edit Question' : 'Create New Question'}
          </h3>

          <form onSubmit={createQuestion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      Question Label (English) <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={newQuestion.label_en || ''}
                    onChange={(e) => setNewQuestion((previous) => ({ ...previous, label_en: e.target.value }))}
                    placeholder={newQuestion.category === 'doctor' ? "e.g., How would you rate {doctor_name}'s professionalism?" : 'e.g., How was your experience?'}
                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      Question Label (Afaan Oromoo)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={newQuestion.label_om || ''}
                    onChange={(e) => setNewQuestion((previous) => ({ ...previous, label_om: e.target.value }))}
                    placeholder="e.g., Maal fudhan yaaduu?"
                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-200 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    Question Label (አማርኛ) <span className="text-xs text-gray-400">(Amharic)</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={newQuestion.label_am || ''}
                  onChange={(e) => setNewQuestion((previous) => ({ ...previous, label_am: e.target.value }))}
                  placeholder="e.g., የእይታዎን እንዴት ደረጃ ይሰጣሉ?"
                  className="w-full p-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-200 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Key (optional)</label>
              <input
                type="text"
                value={newQuestion.key}
                onChange={(e) => setNewQuestion((previous) => ({ ...previous, key: e.target.value }))}
                placeholder="e.g., experience_rating"
                className="w-full p-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Category</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewQuestion((previous) => ({ ...previous, category: 'general' }))}
                  className={`p-3 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
                    newQuestion.category === 'general'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-100'
                  }`}
                >
                  <span className="text-lg">🏥</span>
                  <span className="text-xs">General</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewQuestion((previous) => ({ ...previous, category: 'doctor' }))}
                  className={`p-3 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
                    newQuestion.category === 'doctor'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-100'
                  }`}
                >
                  <span className="text-lg">👨‍⚕️</span>
                  <span className="text-xs">Doctor</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {newQuestion.category === 'doctor' && "Use {doctor_name} in label to inject the doctor's name dynamically"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {questionTypeCards.map((typeItem) => (
                  <button
                    key={typeItem.id}
                    type="button"
                    onClick={() => setType(typeItem.id)}
                    className={`p-3 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
                      newQuestion.type === typeItem.id
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-100'
                    }`}
                  >
                    <span className="text-lg">{typeItem.icon}</span>
                    <span className="text-xs">{typeItem.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={newQuestion.required}
                onChange={(e) => setNewQuestion((previous) => ({ ...previous, required: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="required" className="text-sm text-gray-700">Required question</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Survey Page Number</label>
              <input
                type="number"
                min="1"
                value={newQuestion.page_number}
                onChange={(e) => setNewQuestion((previous) => ({ ...previous, page_number: e.target.value === '' ? 1 : Number(e.target.value) }))}
                className="w-full p-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200 transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Questions will be grouped by page number in the survey</p>
            </div>

            {isChoice && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Options (English)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                    placeholder="Add option..."
                    className="flex-1 p-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                  />
                  <button type="button" onClick={addOption} className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(newQuestion.options_en) ? newQuestion.options_en : newQuestion.options || []).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => removeOption(option)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
                    >
                      {option} <X className="w-4 h-4" />
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium text-gray-700 mt-4">Options (አማርኛ)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={optionInputAm}
                    onChange={(e) => setOptionInputAm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOptionAm();
                      }
                    }}
                    placeholder="Add Amharic option..."
                    className="flex-1 p-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-200"
                  />
                  <button type="button" onClick={addOptionAm} className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(newQuestion.options_am) ? newQuestion.options_am : []).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => removeOptionAm(option)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                    >
                      {option} <X className="w-4 h-4" />
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium text-gray-700 mt-4">Options (Oromiffaa)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={optionInputOm}
                    onChange={(e) => setOptionInputOm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOptionOm();
                      }
                    }}
                    placeholder="Add Oromiffaa option..."
                    className="flex-1 p-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-200"
                  />
                  <button type="button" onClick={addOptionOm} className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(newQuestion.options_om) ? newQuestion.options_om : []).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => removeOptionOm(option)}
                      className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-amber-100 transition-colors"
                    >
                      {option} <X className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isRanged && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Value</label>
                  <input
                    type="number"
                    value={newQuestion.min}
                    onChange={(e) => setNewQuestion((previous) => ({ ...previous, min: e.target.value === '' ? '' : Number(e.target.value) }))}
                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Value</label>
                  <input
                    type="number"
                    value={newQuestion.max}
                    onChange={(e) => setNewQuestion((previous) => ({ ...previous, max: e.target.value === '' ? '' : Number(e.target.value) }))}
                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {editingQuestion && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" /> Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
              >
                {editingQuestion ? <><Check className="w-5 h-5" /> Update Question</> : <><Plus className="w-5 h-5" /> Create Question</>}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              Survey Questions ({questions.length})
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuestionFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  questionFilter === 'all'
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({questions.length})
              </button>
              <button
                onClick={() => setQuestionFilter('doctor')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  questionFilter === 'doctor'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Doctor ({doctorQuestionCount})
              </button>
              <button
                onClick={() => setQuestionFilter('general')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  questionFilter === 'general'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                General ({generalQuestionCount})
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredQuestions.map((question, index) => {
              const labelObject = question.label || {};
              const optionsObject = question.options || {};
              const labelEn = typeof labelObject === 'object' ? labelObject.en || labelObject : labelObject;
              const labelAm = typeof labelObject === 'object' ? labelObject.am || '' : '';
              const labelOm = typeof labelObject === 'object' ? labelObject.om || '' : '';
              const optionsEn = Array.isArray(optionsObject) ? optionsObject : (optionsObject.en || []);
              const optionsAm = optionsObject.am || [];
              const optionsOm = optionsObject.om || [];

              return (
                <div
                  key={question.id}
                  className={`rounded-2xl p-4 border-2 transition-all ${
                    question.is_active ? 'bg-gray-50 border-gray-200 hover:border-blue-200' : 'bg-gray-100 border-gray-300 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-gray-500">#{index + 1}</span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${question.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {question.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">{question.type}</span>
                        {question.required && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">Required</span>}
                      </div>
                      <p className="font-semibold text-gray-800">{labelEn}</p>
                      {labelAm && <p className="text-sm text-emerald-600 mt-1 font-medium">{labelAm}</p>}
                      {labelOm && <p className="text-sm text-amber-600 mt-1 font-medium">{labelOm}</p>}
                      <p className="text-sm text-gray-500 mt-1">Key: {question.key}</p>
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold mt-2 ${
                        question.category === 'doctor'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {question.category === 'doctor' ? '👨‍⚕️ Doctor' : '🏥 General'}
                      </span>
                      {optionsEn.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1.5">
                            {optionsEn.map((option) => (
                              <span key={option} className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">{option}</span>
                            ))}
                          </div>
                          {optionsAm.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {optionsAm.map((option) => (
                                <span key={option} className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">{option}</span>
                              ))}
                            </div>
                          )}
                          {optionsOm.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {optionsOm.map((option) => (
                                <span key={option} className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">{option}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <button onClick={() => moveQuestion(question.id, -1)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors" title="Move">
                        <ArrowUpDown className="w-4 h-4 text-gray-600" />
                      </button>
                      <button onClick={() => editQuestion(question)} className="p-2 hover:bg-blue-100 rounded-xl transition-colors text-blue-600" title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleQuestionActive(question)}
                        className={`p-2 rounded-xl transition-colors ${question.is_active ? 'hover:bg-red-100 text-red-600' : 'hover:bg-emerald-100 text-emerald-600'}`}
                        title={question.is_active ? 'Disable' : 'Enable'}
                      >
                        {question.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteQuestion(question)} className="p-2 hover:bg-red-100 rounded-xl transition-colors text-red-600" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredQuestions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No {questionFilter === 'all' ? '' : questionFilter} questions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

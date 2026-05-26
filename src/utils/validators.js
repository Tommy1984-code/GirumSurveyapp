const { normalizeQuestionType, textOrEmpty } = require('./helpers');

function validateEmail(email) {
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? email.trim() : false;
}

function validateEthiopianPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (/^(\+?251|0)?9\d{8}$/.test(cleaned)) {
    if (cleaned.startsWith('+251')) return cleaned;
    if (cleaned.startsWith('251')) return '+' + cleaned;
    if (cleaned.startsWith('09')) return '+251' + cleaned.slice(1);
    return '+251' + cleaned;
  }
  return false;
}

function validateQuestionAnswers(questionAnswers, questions, doctors) {
  if (!questionAnswers || typeof questionAnswers !== 'object' || Array.isArray(questionAnswers)) {
    return { ok: false, error: 'invalid_question_answers' };
  }

  const doctorQuestionKeys = new Set(questions.filter(q => q.category === 'doctor').map(q => q.key));
  const generalQuestionKeys = new Set(questions.filter(q => q.category === 'general').map(q => q.key));

  for (const q of questions) {
    const qType = normalizeQuestionType(q.type);
    
    let hasAnswer = false;
    let value = null;
    
    if (q.category === 'doctor' && doctors && doctors.length > 0) {
      for (const d of doctors) {
        const prefixedKey = 'doctor_' + d.id + '_' + q.key;
        if (Object.prototype.hasOwnProperty.call(questionAnswers, prefixedKey)) {
          hasAnswer = true;
          value = questionAnswers[prefixedKey];
          break;
        }
      }
    } else {
      hasAnswer = Object.prototype.hasOwnProperty.call(questionAnswers, q.key);
      value = questionAnswers[q.key];
    }

    if (q.required && !hasAnswer) return { ok: false, error: 'missing_answer_' + q.key };
    if (!hasAnswer) continue;

    if (qType === 'text') {
      if (typeof value !== 'string' || (q.required && !textOrEmpty(value))) {
        return { ok: false, error: 'invalid_answer_' + q.key };
      }
    }

    if (qType === 'stars') {
      const min = Number.isFinite(Number(q.min_value)) ? Number(q.min_value) : 1;
      const max = Number.isFinite(Number(q.max_value)) ? Number(q.max_value) : 5;
      if (!Number.isInteger(value) || value < min || value > max) {
        return { ok: false, error: 'invalid_answer_' + q.key };
      }
    }

    if (qType === 'single_choice') {
      let opts = Array.isArray(q.options) ? q.options : [];
      if (typeof opts === 'object' && opts !== null && !Array.isArray(opts)) {
        opts = opts.en || [];
      }
      if (typeof value !== 'string' || opts.indexOf(value) === -1) {
        return { ok: false, error: 'invalid_answer_' + q.key };
      }
    }

    if (qType === 'multi_choice') {
      let opts = Array.isArray(q.options) ? q.options : [];
      if (typeof opts === 'object' && opts !== null && !Array.isArray(opts)) {
        opts = opts.en || [];
      }
      if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || opts.indexOf(v) === -1)) {
        return { ok: false, error: 'invalid_answer_' + q.key };
      }
      if (q.required && value.length === 0) return { ok: false, error: 'invalid_answer_' + q.key };
    }

    if (qType === 'number') {
      const num = Number(value);
      if (!Number.isFinite(num)) return { ok: false, error: 'invalid_answer_' + q.key };
      if (q.min_value !== null && q.min_value !== undefined && num < Number(q.min_value)) {
        return { ok: false, error: 'invalid_answer_' + q.key };
      }
      if (q.max_value !== null && q.max_value !== undefined && num > Number(q.max_value)) {
        return { ok: false, error: 'invalid_answer_' + q.key };
      }
    }

    if (qType === 'yes_no') {
      const normalized = typeof value === 'string' ? value.toLowerCase() : value;
      if (!(normalized === 'yes' || normalized === 'no' || normalized === true || normalized === false)) {
        return { ok: false, error: 'invalid_answer_' + q.key };
      }
    }
  }

  return { ok: true };
}

module.exports = { validateEmail, validateEthiopianPhone, validateQuestionAnswers };

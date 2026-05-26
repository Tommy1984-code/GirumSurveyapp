const bcrypt = require('bcryptjs');

function textOrEmpty(value) {
  return (value && String(value).trim()) || '';
}

function sanitizeText(value) {
  if (!value) return '';
  return String(value)
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

function normalizeQuestionType(type) {
  const t = textOrEmpty(type).toLowerCase();
  if (t === 'scale_1_5') return 'stars';
  return t;
}

function normalizeRegistrationBody(body) {
  if (!body || typeof body !== 'object') return { error: 'invalid_body' };

  const patientInput = body.patient || {};
  const patientName = textOrEmpty(patientInput.name);
  if (!patientName) return { error: 'patient_name_required' };

  const crypto = require('crypto');
  function makeId(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex');
  }

  const patientId = textOrEmpty(patientInput.id) || makeId('P');
  const visitId = textOrEmpty(body.visit_id) || makeId('V');
  const phone = textOrEmpty(body.phone || patientInput.phone);
  if (!phone) return { error: 'phone_required' };

  const doctorsInput = Array.isArray(body.doctors) ? body.doctors : [];
  if (!doctorsInput.length) return { error: 'at_least_one_doctor_required' };

  const doctorMap = new Map();
  for (let i = 0; i < doctorsInput.length; i += 1) {
    const raw = doctorsInput[i] || {};
    const name = textOrEmpty(raw.name);
    if (!name) return { error: 'doctor_name_required_at_index_' + i };

    const id = textOrEmpty(raw.id) || makeId('D');
    if (!doctorMap.has(id)) doctorMap.set(id, { id, name });
  }

  const doctors = Array.from(doctorMap.values());
  if (!doctors.length) return { error: 'at_least_one_doctor_required' };

  return {
    payload: {
      patient: { id: patientId, name: patientName },
      doctors,
      visit_id: visitId
    },
    phone
  };
}

function normalizeQuestionInput(body, QUESTION_TYPES) {
  const labelEn = textOrEmpty(body.label_en || body.label);
  const labelAm = textOrEmpty(body.label_am || '');
  const labelOm = textOrEmpty(body.label_om || '');
  const type = normalizeQuestionType(body.type);
  const required = Boolean(body.required);
  const min = Number.isFinite(Number(body.min)) ? Number(body.min) : null;
  const max = Number.isFinite(Number(body.max)) ? Number(body.max) : null;
  const optionsEn = Array.isArray(body.options_en || body.options)
    ? (body.options_en || body.options).map(textOrEmpty).filter(Boolean)
    : typeof body.options_csv === 'string'
      ? body.options_csv.split(',').map(textOrEmpty).filter(Boolean)
      : [];
  const optionsAm = Array.isArray(body.options_am)
    ? body.options_am.map(textOrEmpty).filter(Boolean)
    : [];
  const optionsOm = Array.isArray(body.options_om)
    ? body.options_om.map(textOrEmpty).filter(Boolean)
    : [];
  const category = body.category === 'doctor' ? 'doctor' : 'general';

  if (!labelEn) return { error: 'question_label_required' };
  if (!QUESTION_TYPES.has(type)) return { error: 'invalid_question_type' };
  if ((type === 'single_choice' || type === 'multi_choice') && optionsEn.length === 0) {
    return { error: 'options_required_for_choice_type' };
  }

  const label = { en: labelEn, am: labelAm || labelEn, om: labelOm || labelEn };
  const options = { en: optionsEn, am: optionsAm.length > 0 ? optionsAm : optionsEn, om: optionsOm.length > 0 ? optionsOm : optionsEn };
  const key = textOrEmpty(body.key) || slugify(labelEn) || ('question_' + Date.now());

  return {
    question: {
      key,
      label,
      type,
      required,
      options,
      min_value: min,
      max_value: max,
      is_active: body.is_active === undefined ? true : Boolean(body.is_active),
      category
    }
  };
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function csvEscape(val) {
  val = String(val);
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}

module.exports = {
  textOrEmpty, sanitizeText, slugify, normalizeQuestionType,
  normalizeRegistrationBody, normalizeQuestionInput,
  hashPassword, verifyPassword, csvEscape
};

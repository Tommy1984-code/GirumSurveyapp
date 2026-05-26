const path = require('path');

const QUESTION_TYPES = new Set(['text', 'stars', 'single_choice', 'multi_choice', 'number', 'yes_no', 'scale_1_5']);

const ALL_MODULES = ['dashboard', 'questions', 'responses', 'doctor-ratings', 'doctors', 'patients', 'encounters', 'reports', 'users', 'activity', 'roles', 'import', 'upload', 'email-settings'];

const tempDir = path.join(__dirname, '../../temp');

module.exports = { QUESTION_TYPES, ALL_MODULES, tempDir };

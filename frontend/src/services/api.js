export async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function apiFetchWithToken(path, token, options = {}) {
  return apiFetch(path, {
    ...options,
    headers: { 'x-session-token': token, ...options.headers }
  });
}

export async function login(username, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function register(username, email, password) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  });
}

export async function checkAuth() {
  return apiFetch('/api/auth/check');
}

export async function getMe(token) {
  return apiFetchWithToken('/api/auth/me', token);
}

export async function logout(token) {
  return apiFetchWithToken('/api/auth/logout', token, { method: 'POST' });
}

export async function loadSurvey(token) {
  return apiFetch('/api/survey?token=' + encodeURIComponent(token));
}

export async function submitFeedback(payload) {
  return apiFetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getAnalytics(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetchWithToken(`/api/analytics${query ? '?' + query : ''}`, token);
}

export async function getDoctors(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetchWithToken(`/api/doctors${query ? '?' + query : ''}`, token);
}

export async function createDoctor(token, data) {
  return apiFetchWithToken('/api/doctors', token, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateDoctor(token, id, data) {
  return apiFetchWithToken(`/api/doctors/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteDoctor(token, id) {
  return apiFetchWithToken(`/api/doctors/${id}`, token, { method: 'DELETE' });
}

export async function getPatients(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetchWithToken(`/api/patients${query ? '?' + query : ''}`, token);
}

export async function createPatient(token, data) {
  return apiFetchWithToken('/api/patients', token, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updatePatient(token, id, data) {
  return apiFetchWithToken(`/api/patients/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deletePatient(token, id) {
  return apiFetchWithToken(`/api/patients/${id}`, token, { method: 'DELETE' });
}

export async function getEncounters(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetchWithToken(`/api/encounters${query ? '?' + query : ''}`, token);
}

export async function getEncounter(token, id) {
  return apiFetchWithToken(`/api/encounters/${id}`, token);
}

export async function createEncounter(token, data) {
  return apiFetchWithToken('/api/encounters', token, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function finishEncounter(token, id) {
  return apiFetchWithToken(`/api/encounters/${id}/finish`, token, { method: 'PATCH' });
}

export async function sendSms(token, id) {
  return apiFetchWithToken(`/api/encounters/${id}/send-sms`, token, { method: 'POST' });
}

export async function sendAllSms(token, ids = null) {
  return apiFetchWithToken('/api/encounters/send-all-sms', token, {
    method: 'POST',
    body: JSON.stringify({ ids })
  });
}

export async function deleteEncounter(token, id) {
  return apiFetchWithToken(`/api/encounters/${id}`, token, { method: 'DELETE' });
}

export async function bulkDeleteEncounters(token, ids) {
  return apiFetchWithToken('/api/encounters/delete-bulk', token, {
    method: 'POST',
    body: JSON.stringify({ ids })
  });
}

export async function getQuestions(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetchWithToken(`/api/questions${query ? '?' + query : ''}`, token);
}

export async function createQuestion(token, data) {
  return apiFetchWithToken('/api/questions', token, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateQuestion(token, id, data) {
  return apiFetchWithToken(`/api/questions/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteQuestion(token, id) {
  return apiFetchWithToken(`/api/questions/${id}`, token, { method: 'DELETE' });
}

export async function reorderQuestions(token, ids) {
  return apiFetchWithToken('/api/questions/reorder', token, {
    method: 'POST',
    body: JSON.stringify({ ids })
  });
}

export async function getResponses(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetchWithToken(`/api/responses${query ? '?' + query : ''}`, token);
}

export async function deleteResponses(token, ids) {
  return apiFetchWithToken('/api/responses', token, {
    method: 'DELETE',
    body: JSON.stringify({ ids })
  });
}

export async function getDoctorRatings(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetchWithToken(`/api/doctor-ratings${query ? '?' + query : ''}`, token);
}

export async function getReport(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetchWithToken(`/api/report${query ? '?' + query : ''}`, token);
}

export async function sendDoctorEmail(token, data) {
  return apiFetchWithToken('/api/doctor-ratings/send-email', token, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function sendAllDoctorEmails(token, data) {
  return apiFetchWithToken('/api/doctor-ratings/send-all', token, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getUsers(token) {
  return apiFetchWithToken('/api/admin/users', token);
}

export async function updateUser(token, id, data) {
  return apiFetchWithToken(`/api/admin/users/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteUser(token, id) {
  return apiFetchWithToken(`/api/admin/users/${id}`, token, { method: 'DELETE' });
}

export async function getRoles(token) {
  return apiFetchWithToken('/api/admin/roles', token);
}

export async function createRole(token, name) {
  return apiFetchWithToken('/api/admin/roles', token, {
    method: 'POST',
    body: JSON.stringify({ name })
  });
}

export async function updateRole(token, id, name) {
  return apiFetchWithToken(`/api/admin/roles/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ name })
  });
}

export async function setRolePermissions(token, id, modules) {
  return apiFetchWithToken(`/api/admin/roles/${id}/permissions`, token, {
    method: 'PUT',
    body: JSON.stringify({ modules })
  });
}

export async function deleteRole(token, id) {
  return apiFetchWithToken(`/api/admin/roles/${id}`, token, { method: 'DELETE' });
}

export async function getActivityLogs(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetchWithToken(`/api/admin/activity-logs${query ? '?' + query : ''}`, token);
}

export async function uploadImage(token, imageData) {
  return apiFetchWithToken('/api/upload/image', token, {
    method: 'POST',
    body: JSON.stringify({ image_data: imageData })
  });
}

export async function getNotifications(token) {
  return apiFetchWithToken('/api/notifications/last-seen', token);
}

export async function markNotificationsSeen(token, lastSeen) {
  return apiFetchWithToken('/api/notifications/mark-seen', token, {
    method: 'POST',
    body: JSON.stringify({ last_seen_submission_id: lastSeen })
  });
}

export async function importFile(token, formData) {
  const res = await fetch('/api/import', {
    method: 'POST',
    headers: { 'x-session-token': token },
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Import failed');
  return data;
}

export async function surveyStats(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetchWithToken(`/api/reports/survey-stats${query ? '?' + query : ''}`, token);
}

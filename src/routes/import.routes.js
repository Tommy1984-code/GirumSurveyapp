const fs = require('fs');
const db = require('../config/database');
const { requireAuth, requireModule } = require('../middleware/auth');
const doctorsService = require('../services/doctors');
const patientsService = require('../services/patients');
const { logActivity } = require('../services/activity');

function register(app, upload) {
  const XLSX = require('xlsx');

  app.post('/api/import', requireAuth, requireModule('import'), upload.single('file'), async (req, res) => {
    try {
      const module = String(req.body.module || '').trim().toLowerCase();
      if (!['doctors', 'patients'].includes(module)) {
        return res.status(400).json({ error: 'invalid_module', message: 'Supported modules: doctors, patients' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'file_required' });
      }

      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

      if (!data || !data.length) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: 'file_empty', message: 'No data rows found' });
      }

      const headers = Object.keys(data[0]).map(h => h.toLowerCase().trim());
      let expectedHeaders;
      if (module === 'doctors') {
        expectedHeaders = ['name', 'department', 'email'];
      } else {
        expectedHeaders = ['name', 'phone'];
      }

      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({
          error: 'missing_columns',
          message: 'Missing required columns: ' + missingHeaders.join(', ')
        });
      }

      const requiredFields = ['name'];
      const results = { total: data.length, created: 0, updated: 0, errors: [] };

      for (const row of data) {
        try {
          const name = String(row['name'] || '').trim();
          if (!name) {
            results.errors.push({ row: results.created + results.updated + results.errors.length + 1, error: 'name_required' });
            continue;
          }

          if (module === 'doctors') {
            const existing = await db.query('SELECT id FROM doctors WHERE LOWER(name) = LOWER($1)', [name]);
            if (existing.rows[0]) {
              await doctorsService.updateDoctor(existing.rows[0].id, {
                name,
                department: String(row['department'] || '').trim() || undefined,
                email: String(row['email'] || '').trim() || undefined
              });
              results.updated++;
            } else {
              await doctorsService.createDoctor({
                name,
                department: String(row['department'] || '').trim() || undefined,
                email: String(row['email'] || '').trim() || undefined
              });
              results.created++;
            }
          } else {
            const phone = String(row['phone'] || '').trim();
            if (!phone) {
              results.errors.push({ row: results.created + results.updated + results.errors.length + 1, error: 'phone_required' });
              continue;
            }
            const existing = await db.query('SELECT id FROM patients WHERE phone = $1', [phone]);
            if (existing.rows[0]) {
              await patientsService.updatePatient(existing.rows[0].id, { name, phone: phone || undefined });
              results.updated++;
            } else {
              await patientsService.createPatient({ name, phone: phone || null });
              results.created++;
            }
          }
        } catch (e) {
          results.errors.push({ row: results.created + results.updated + results.errors.length + 1, error: e.message });
        }
      }

      fs.unlink(req.file.path, () => {});
      await logActivity(req.adminUser.id, 'import_' + module, { total: results.total, created: results.created, updated: results.updated, errors: results.errors.length });

      return res.json(results);
    } catch (e) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(500).json({ error: 'import_failed' });
    }
  });
}

module.exports = { register };

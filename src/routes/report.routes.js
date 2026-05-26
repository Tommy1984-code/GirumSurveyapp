const path = require('path');
const db = require('../config/database');
const { requireAuth, requireModule } = require('../middleware/auth');
const { textOrEmpty, csvEscape } = require('../utils/helpers');
const { fetchQuestions } = require('../services/questions');
const { sendEmail } = require('../services/email');

const PDFDocument = require('pdfkit');

function register(app) {
  app.get('/api/doctor-ratings', requireAuth, requireModule('doctor-ratings'), async function (req, res) {
    try {
      const doctorNameFilter = textOrEmpty(req.query.doctor_name || '');
      const dateFrom = textOrEmpty(req.query.date_from || '');
      const dateTo = textOrEmpty(req.query.date_to || '');

      let whereConditions = [];
      let params = [];
      let paramIdx = 1;

      if (dateFrom) {
        whereConditions.push(`submitted_at >= $${paramIdx++}`);
        params.push(dateFrom);
      }

      if (dateTo) {
        whereConditions.push(`submitted_at <= $${paramIdx++}`);
        params.push(dateTo + ' 23:59:59');
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      const doctorQuestions = await db.query(
        `SELECT id, question_key, label, type FROM survey_questions WHERE category = 'doctor' AND is_active = TRUE AND is_deleted = FALSE ORDER BY page_number ASC, order_no ASC, id ASC`
      );

      const submissions = await db.query(`
        SELECT id, patient_name, selected_doctor_ids, selected_doctor_names, question_answers, submitted_at
        FROM feedback_submissions
        ${whereClause}
        ORDER BY submitted_at DESC
      `, params);

      const doctorStats = {};

      for (const sub of submissions.rows) {
        const qa = sub.question_answers || {};
        const doctorIdsList = sub.selected_doctor_ids || [];
        const doctorNamesList = sub.selected_doctor_names || [];
        
        const allKeys = Object.keys(qa);
        const doctorIdsInOrder = [];
        const seenIds = new Set();
        
        for (const key of allKeys) {
          if (key.startsWith('doctor_')) {
            const match = key.match(/^doctor_([^_]+)_(.+)$/);
            if (match) {
              const doctorId = match[1];
              if (!seenIds.has(doctorId)) {
                seenIds.add(doctorId);
                doctorIdsInOrder.push(doctorId);
              }
            }
          }
        }
        
        const localIdToNameMap = {};
        if (doctorIdsList.length > 0 && doctorIdsList.length === doctorNamesList.length) {
          for (let i = 0; i < doctorIdsList.length; i++) {
            localIdToNameMap[doctorIdsList[i]] = doctorNamesList[i];
          }
        } else {
          for (let i = 0; i < doctorIdsInOrder.length; i++) {
            localIdToNameMap[doctorIdsInOrder[i]] = doctorNamesList[i] || doctorIdsInOrder[i];
          }
        }
        
        const doctorRatingsInSubmission = {};
        
        for (const dq of doctorQuestions.rows) {
          const questionKey = dq.question_key || String(dq.id);
          for (const doctorId of doctorIdsInOrder) {
            const answerKey = `doctor_${doctorId}_${questionKey}`;
            const answerValue = qa[answerKey];
            
            if (answerValue !== undefined && answerValue !== null) {
              if (!doctorRatingsInSubmission[doctorId]) {
                doctorRatingsInSubmission[doctorId] = { total: 0, count: 0, questions: {} };
              }
              
              if (dq.type === 'yes_no') {
                const normalizedAnswer = String(answerValue).toLowerCase();
                if (normalizedAnswer === 'yes' || normalizedAnswer === 'no') {
                  if (!doctorRatingsInSubmission[doctorId].questions[questionKey]) {
                    doctorRatingsInSubmission[doctorId].questions[questionKey] = {
                      type: 'yes_no',
                      yes_count: 0,
                      no_count: 0,
                      total: 0,
                      count: 0
                    };
                  }
                  if (normalizedAnswer === 'yes') {
                    doctorRatingsInSubmission[doctorId].questions[questionKey].yes_count++;
                  } else {
                    doctorRatingsInSubmission[doctorId].questions[questionKey].no_count++;
                  }
                  doctorRatingsInSubmission[doctorId].questions[questionKey].count++;
                }
              } else {
                const numericValue = Number(answerValue);
                if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
                  if (!doctorRatingsInSubmission[doctorId].questions[questionKey]) {
                    doctorRatingsInSubmission[doctorId].questions[questionKey] = {
                      type: dq.type,
                      total: 0,
                      count: 0
                    };
                  }
                  doctorRatingsInSubmission[doctorId].questions[questionKey].total += numericValue;
                  doctorRatingsInSubmission[doctorId].questions[questionKey].count++;
                  doctorRatingsInSubmission[doctorId].total += numericValue;
                  doctorRatingsInSubmission[doctorId].count++;
                }
              }
            }
          }
        }
        
        for (const doctorId of Object.keys(doctorRatingsInSubmission)) {
          const docData = doctorRatingsInSubmission[doctorId];
          
          if (!doctorStats[doctorId]) {
            let doctorName = localIdToNameMap[doctorId] || doctorId;
            if (!doctorName.match(/^dr\.?\s/i)) {
              doctorName = 'Dr. ' + doctorName;
            }
            
            doctorStats[doctorId] = {
              doctor_id: doctorId,
              doctor_name: doctorName,
              department: 'General',
              patient_count: 0,
              total_patient_avg: 0,
              five_star: 0,
              four_star: 0,
              three_star: 0,
              two_star: 0,
              one_star: 0,
              question_ratings: {}
            };
          }
          
          const patientAvg = docData.count > 0 ? docData.total / docData.count : 0;
          doctorStats[doctorId].patient_count++;
          doctorStats[doctorId].total_patient_avg += patientAvg;
          
          const roundedAvg = Math.round(patientAvg);
          if (roundedAvg === 5) doctorStats[doctorId].five_star++;
          else if (roundedAvg === 4) doctorStats[doctorId].four_star++;
          else if (roundedAvg === 3) doctorStats[doctorId].three_star++;
          else if (roundedAvg === 2) doctorStats[doctorId].two_star++;
          else if (roundedAvg === 1) doctorStats[doctorId].one_star++;
          
          for (const [qKey, qData] of Object.entries(docData.questions)) {
            if (!doctorStats[doctorId].question_ratings[qKey]) {
              doctorStats[doctorId].question_ratings[qKey] = {
                question_key: qKey,
                type: qData.type || 'stars',
                total: 0,
                count: 0
              };
              if (qData.type === 'yes_no') {
                doctorStats[doctorId].question_ratings[qKey].yes_count = 0;
                doctorStats[doctorId].question_ratings[qKey].no_count = 0;
              }
            }
            doctorStats[doctorId].question_ratings[qKey].total += qData.total || 0;
            doctorStats[doctorId].question_ratings[qKey].count += qData.count;
            if (qData.type === 'yes_no') {
              doctorStats[doctorId].question_ratings[qKey].yes_count += qData.yes_count || 0;
              doctorStats[doctorId].question_ratings[qKey].no_count += qData.no_count || 0;
            }
          }
        }
      }

      const orderedQuestions = doctorQuestions.rows || [];
      const questionKeyOrder = new Map(orderedQuestions.map((q, idx) => [q.question_key, idx]));
      
      let ratings = Object.values(doctorStats).map(d => {
        const qKeyOrder = new Map([...questionKeyOrder].map(([k, v]) => [k, v]));
        const questionRatingsArray = Object.values(d.question_ratings)
          .filter(qr => qr.count > 0)
          .sort((a, b) => (qKeyOrder.get(a.question_key) ?? 999) - (qKeyOrder.get(b.question_key) ?? 999))
          .map(qr => ({
            question_key: qr.question_key,
            type: qr.type,
            average: qr.count > 0 ? qr.total / qr.count : 0,
            count: qr.count,
            yes_count: qr.yes_count || 0,
            no_count: qr.no_count || 0
          }));

        return {
          doctor_id: d.doctor_id,
          doctor_name: d.doctor_name,
          department: d.department,
          total_patients: d.patient_count,
          average_rating: d.patient_count > 0 ? d.total_patient_avg / d.patient_count : 0,
          five_star: d.five_star,
          four_star: d.four_star,
          three_star: d.three_star,
          two_star: d.two_star,
          one_star: d.one_star,
          question_ratings: questionRatingsArray
        };
      });

      if (doctorNameFilter) {
        ratings = ratings.filter(r => 
          r.doctor_name.toLowerCase().includes(doctorNameFilter.toLowerCase()) ||
          r.doctor_id.toLowerCase().includes(doctorNameFilter.toLowerCase())
        );
      }

      ratings.sort((a, b) => a.doctor_name.localeCompare(b.doctor_name));

      const doctorIds = ratings.map(r => r.doctor_id);
      const doctorNames = ratings.map(r => r.doctor_name.replace(/^Dr\.?\s*/i, '').trim().toLowerCase());
      let doctorEmails = {};
      
      if (doctorIds.length > 0) {
        const emailResult = await db.query(
          `SELECT id, name, email FROM doctors`
        );
        for (const row of emailResult.rows) {
          const rowName = (row.name || '').replace(/^Dr\.?\s*/i, '').trim().toLowerCase();
          if (doctorIds.includes(row.id)) {
            doctorEmails[row.id] = row.email;
          }
          if (doctorNames.includes(rowName) && rowName.length > 0) {
            const ratingDoctor = ratings.find(r => 
              r.doctor_name.replace(/^Dr\.?\s*/i, '').trim().toLowerCase() === rowName
            );
            if (ratingDoctor && !doctorEmails[ratingDoctor.doctor_id]) {
              doctorEmails[ratingDoctor.doctor_id] = row.email;
            }
          }
        }
      }

      ratings = ratings.map(r => ({
        ...r,
        email: doctorEmails[r.doctor_id] || ''
      }));

      return res.json({ ratings });
    } catch (e) {
      return res.status(500).json({ error: 'fetch_failed' });
    }
  });

  app.get('/api/report', requireAuth, requireModule('reports'), async function (req, res) {
    try {
      const doctorNameFilter = textOrEmpty(req.query.doctor_name || '');
      const dateFrom = textOrEmpty(req.query.date_from || '');
      const dateTo = textOrEmpty(req.query.date_to || '');

      let whereConditions = [];
      let params = [];
      let paramIdx = 1;

      if (dateFrom) {
        whereConditions.push(`submitted_at >= $${paramIdx++}`);
        params.push(dateFrom);
      }

      if (dateTo) {
        whereConditions.push(`submitted_at <= $${paramIdx++}`);
        params.push(dateTo + ' 23:59:59');
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      const doctorQuestions = await db.query(
        `SELECT id, question_key, label, type FROM survey_questions WHERE category = 'doctor' AND is_active = TRUE AND is_deleted = FALSE ORDER BY page_number ASC, order_no ASC, id ASC`
      );

      const generalQuestions = await db.query(
        `SELECT id, question_key, label, type FROM survey_questions WHERE category = 'general' AND is_active = TRUE AND is_deleted = FALSE ORDER BY page_number ASC, order_no ASC, id ASC`
      );

      const submissions = await db.query(`
        SELECT id, patient_name, selected_doctor_ids, selected_doctor_names, question_answers, submitted_at
        FROM feedback_submissions
        ${whereClause}
        ORDER BY submitted_at DESC
      `, params);

      const doctorStats = {};
      const generalStats = {};

      for (const sub of submissions.rows) {
        const qa = sub.question_answers || {};
        const doctorIdsList = sub.selected_doctor_ids || [];
        const doctorNamesList = sub.selected_doctor_names || [];
        
        const allKeys = Object.keys(qa);
        const doctorIdsInOrder = [];
        const seenIds = new Set();
        
        for (const key of allKeys) {
          if (key.startsWith('doctor_')) {
            const match = key.match(/^doctor_([^_]+)_(.+)$/);
            if (match) {
              const doctorId = match[1];
              if (!seenIds.has(doctorId)) {
                seenIds.add(doctorId);
                doctorIdsInOrder.push(doctorId);
              }
            }
          }
        }
        
        const localIdToNameMap = {};
        if (doctorIdsList.length > 0 && doctorIdsList.length === doctorNamesList.length) {
          for (let i = 0; i < doctorIdsList.length; i++) {
            localIdToNameMap[doctorIdsList[i]] = doctorNamesList[i];
          }
        } else {
          for (let i = 0; i < doctorIdsInOrder.length; i++) {
            localIdToNameMap[doctorIdsInOrder[i]] = doctorNamesList[i] || doctorIdsInOrder[i];
          }
        }
        
        const doctorRatingsInSubmission = {};
        
        for (const dq of doctorQuestions.rows) {
          const questionKey = dq.question_key || String(dq.id);
          for (const doctorId of doctorIdsInOrder) {
            const answerKey = `doctor_${doctorId}_${questionKey}`;
            const answerValue = qa[answerKey];
            
            if (answerValue !== undefined && answerValue !== null) {
              if (!doctorRatingsInSubmission[doctorId]) {
                doctorRatingsInSubmission[doctorId] = { total: 0, count: 0, questions: {} };
              }
              
              if (dq.type === 'yes_no') {
                const normalizedAnswer = String(answerValue).toLowerCase();
                if (normalizedAnswer === 'yes' || normalizedAnswer === 'no') {
                  if (!doctorRatingsInSubmission[doctorId].questions[questionKey]) {
                    doctorRatingsInSubmission[doctorId].questions[questionKey] = {
                      type: 'yes_no',
                      yes_count: 0,
                      no_count: 0,
                      total: 0,
                      count: 0
                    };
                  }
                  if (normalizedAnswer === 'yes') {
                    doctorRatingsInSubmission[doctorId].questions[questionKey].yes_count++;
                  } else {
                    doctorRatingsInSubmission[doctorId].questions[questionKey].no_count++;
                  }
                  doctorRatingsInSubmission[doctorId].questions[questionKey].count++;
                }
              } else {
                const numericValue = Number(answerValue);
                if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
                  if (!doctorRatingsInSubmission[doctorId].questions[questionKey]) {
                    doctorRatingsInSubmission[doctorId].questions[questionKey] = {
                      type: dq.type,
                      total: 0,
                      count: 0
                    };
                  }
                  doctorRatingsInSubmission[doctorId].questions[questionKey].total += numericValue;
                  doctorRatingsInSubmission[doctorId].questions[questionKey].count++;
                  doctorRatingsInSubmission[doctorId].total += numericValue;
                  doctorRatingsInSubmission[doctorId].count++;
                }
              }
            }
          }
        }
        
        for (const doctorId of Object.keys(doctorRatingsInSubmission)) {
          const docData = doctorRatingsInSubmission[doctorId];
          
          if (!doctorStats[doctorId]) {
            let doctorName = localIdToNameMap[doctorId] || doctorId;
            if (!doctorName.match(/^dr\.?\s/i)) {
              doctorName = 'Dr. ' + doctorName;
            }
            
            doctorStats[doctorId] = {
              doctor_id: doctorId,
              doctor_name: doctorName,
              department: 'General',
              patient_count: 0,
              total_patient_avg: 0,
              five_star: 0,
              four_star: 0,
              three_star: 0,
              two_star: 0,
              one_star: 0,
              question_ratings: {}
            };
          }
          
          const patientAvg = docData.count > 0 ? docData.total / docData.count : 0;
          doctorStats[doctorId].patient_count++;
          doctorStats[doctorId].total_patient_avg += patientAvg;
          
          const roundedAvg = Math.round(patientAvg);
          if (roundedAvg === 5) doctorStats[doctorId].five_star++;
          else if (roundedAvg === 4) doctorStats[doctorId].four_star++;
          else if (roundedAvg === 3) doctorStats[doctorId].three_star++;
          else if (roundedAvg === 2) doctorStats[doctorId].two_star++;
          else if (roundedAvg === 1) doctorStats[doctorId].one_star++;
          
          for (const [qKey, qData] of Object.entries(docData.questions)) {
            if (!doctorStats[doctorId].question_ratings[qKey]) {
              doctorStats[doctorId].question_ratings[qKey] = {
                question_key: qKey,
                type: qData.type || 'stars',
                total: 0,
                count: 0
              };
              if (qData.type === 'yes_no') {
                doctorStats[doctorId].question_ratings[qKey].yes_count = 0;
                doctorStats[doctorId].question_ratings[qKey].no_count = 0;
              }
            }
            doctorStats[doctorId].question_ratings[qKey].total += qData.total || 0;
            doctorStats[doctorId].question_ratings[qKey].count += qData.count;
            if (qData.type === 'yes_no') {
              doctorStats[doctorId].question_ratings[qKey].yes_count += qData.yes_count || 0;
              doctorStats[doctorId].question_ratings[qKey].no_count += qData.no_count || 0;
            }
          }
        }
        
        for (const gq of generalQuestions.rows) {
          const questionKey = gq.question_key || String(gq.id);
          const answerValue = qa[questionKey];
          
          if (answerValue !== undefined && answerValue !== null) {
            if (!generalStats[questionKey]) {
              generalStats[questionKey] = {
                question_key: questionKey,
                type: gq.type || 'stars',
                total: 0,
                count: 0
              };
              if (gq.type === 'yes_no') {
                generalStats[questionKey].yes_count = 0;
                generalStats[questionKey].no_count = 0;
              }
            }
            
            if (gq.type === 'yes_no') {
              const normalizedAnswer = String(answerValue).toLowerCase();
              if (normalizedAnswer === 'yes') {
                generalStats[questionKey].yes_count++;
              } else if (normalizedAnswer === 'no') {
                generalStats[questionKey].no_count++;
              }
              generalStats[questionKey].count++;
            } else {
              const numericValue = Number(answerValue);
              if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
                generalStats[questionKey].total += numericValue;
                generalStats[questionKey].count++;
              }
            }
          }
        }
      }

      let ratings = Object.values(doctorStats).map(d => {
        const questionRatingsArray = Object.values(d.question_ratings).map(qr => ({
          question_key: qr.question_key,
          type: qr.type,
          average: qr.count > 0 ? qr.total / qr.count : 0,
          count: qr.count,
          yes_count: qr.yes_count || 0,
          no_count: qr.no_count || 0
        }));

        return {
          doctor_id: d.doctor_id,
          doctor_name: d.doctor_name,
          department: d.department,
          patient_count: d.patient_count,
          average_rating: d.patient_count > 0 ? d.total_patient_avg / d.patient_count : 0,
          five_star: d.five_star,
          four_star: d.four_star,
          three_star: d.three_star,
          two_star: d.two_star,
          one_star: d.one_star,
          question_ratings: questionRatingsArray
        };
      });

      if (doctorNameFilter) {
        ratings = ratings.filter(r => 
          r.doctor_name.toLowerCase().includes(doctorNameFilter.toLowerCase()) ||
          r.doctor_id.toLowerCase().includes(doctorNameFilter.toLowerCase())
        );
      }

      ratings.sort((a, b) => a.doctor_name.localeCompare(b.doctor_name));

      const generalSurvey = Object.values(generalStats).map(g => {
        if (g.type === 'yes_no') {
          const total = g.yes_count + g.no_count;
          return {
            question_key: g.question_key,
            type: g.type,
            yes_percentage: total > 0 ? Math.round((g.yes_count / total) * 100) : 0,
            yes_count: g.yes_count,
            no_count: g.no_count,
            total_responses: total
          };
        }
        return {
          question_key: g.question_key,
          type: g.type,
          average: g.count > 0 ? parseFloat((g.total / g.count).toFixed(2)) : 0,
          total_responses: g.count
        };
      });

      generalSurvey.sort((a, b) => a.question_key.localeCompare(b.question_key));

      return res.json({
        doctors: ratings,
        general_survey: generalSurvey,
        total_submissions: submissions.rows.length,
        date_from: dateFrom,
        date_to: dateTo
      });
    } catch (e) {
      return res.status(500).json({ error: 'fetch_failed' });
    }
  });

  app.get('/api/report/export', requireAuth, requireModule('reports'), async function (req, res) {
    try {
      const format = String(req.query.format || 'csv').toLowerCase();
      const reportType = String(req.query.report_type || 'doctor').toLowerCase();
      const doctorNameFilter = textOrEmpty(req.query.doctor_name || '');
      const dateFrom = textOrEmpty(req.query.date_from || '');
      const dateTo = textOrEmpty(req.query.date_to || '');

      let whereConditions = [];
      let params = [];
      let paramIdx = 1;

      if (dateFrom) {
        whereConditions.push(`submitted_at >= $${paramIdx++}`);
        params.push(dateFrom);
      }

      if (dateTo) {
        whereConditions.push(`submitted_at <= $${paramIdx++}`);
        params.push(dateTo + ' 23:59:59');
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      const doctorQuestions = await db.query(
        `SELECT id, question_key, label, type FROM survey_questions WHERE category = 'doctor' AND is_active = TRUE AND is_deleted = FALSE ORDER BY page_number ASC, order_no ASC, id ASC`
      );

      const generalQuestions = await db.query(
        `SELECT id, question_key, label, type FROM survey_questions WHERE category = 'general' AND is_active = TRUE AND is_deleted = FALSE ORDER BY page_number ASC, order_no ASC, id ASC`
      );

      const submissions = await db.query(`
        SELECT id, patient_name, selected_doctor_ids, selected_doctor_names, question_answers, submitted_at
        FROM feedback_submissions
        ${whereClause}
        ORDER BY submitted_at DESC
      `, params);

      const doctorStats = {};
      const generalStats = {};

      for (const sub of submissions.rows) {
        const qa = sub.question_answers || {};
        const doctorIdsList = sub.selected_doctor_ids || [];
        const doctorNamesList = sub.selected_doctor_names || [];
        
        const allKeys = Object.keys(qa);
        const doctorIdsInOrder = [];
        const seenIds = new Set();
        
        for (const key of allKeys) {
          if (key.startsWith('doctor_')) {
            const match = key.match(/^doctor_([^_]+)_(.+)$/);
            if (match) {
              const doctorId = match[1];
              if (!seenIds.has(doctorId)) {
                seenIds.add(doctorId);
                doctorIdsInOrder.push(doctorId);
              }
            }
          }
        }
        
        const localIdToNameMap = {};
        if (doctorIdsList.length > 0 && doctorIdsList.length === doctorNamesList.length) {
          for (let i = 0; i < doctorIdsList.length; i++) {
            localIdToNameMap[doctorIdsList[i]] = doctorNamesList[i];
          }
        } else {
          for (let i = 0; i < doctorIdsInOrder.length; i++) {
            localIdToNameMap[doctorIdsInOrder[i]] = doctorNamesList[i] || doctorIdsInOrder[i];
          }
        }
        
        const doctorRatingsInSubmission = {};
        
        for (const dq of doctorQuestions.rows) {
          const questionKey = dq.question_key || String(dq.id);
          for (const doctorId of doctorIdsInOrder) {
            const answerKey = `doctor_${doctorId}_${questionKey}`;
            const answerValue = qa[answerKey];
            
            if (answerValue !== undefined && answerValue !== null) {
              if (!doctorRatingsInSubmission[doctorId]) {
                doctorRatingsInSubmission[doctorId] = { total: 0, count: 0, questions: {} };
              }
              
              if (dq.type === 'yes_no') {
                const normalizedAnswer = String(answerValue).toLowerCase();
                if (normalizedAnswer === 'yes' || normalizedAnswer === 'no') {
                  if (!doctorRatingsInSubmission[doctorId].questions[questionKey]) {
                    doctorRatingsInSubmission[doctorId].questions[questionKey] = {
                      type: 'yes_no',
                      yes_count: 0,
                      no_count: 0,
                      total: 0,
                      count: 0
                    };
                  }
                  if (normalizedAnswer === 'yes') {
                    doctorRatingsInSubmission[doctorId].questions[questionKey].yes_count++;
                  } else {
                    doctorRatingsInSubmission[doctorId].questions[questionKey].no_count++;
                  }
                  doctorRatingsInSubmission[doctorId].questions[questionKey].count++;
                }
              } else {
                const numericValue = Number(answerValue);
                if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
                  if (!doctorRatingsInSubmission[doctorId].questions[questionKey]) {
                    doctorRatingsInSubmission[doctorId].questions[questionKey] = {
                      type: dq.type,
                      total: 0,
                      count: 0
                    };
                  }
                  doctorRatingsInSubmission[doctorId].questions[questionKey].total += numericValue;
                  doctorRatingsInSubmission[doctorId].questions[questionKey].count++;
                  doctorRatingsInSubmission[doctorId].total += numericValue;
                  doctorRatingsInSubmission[doctorId].count++;
                }
              }
            }
          }
        }
        
        for (const doctorId of Object.keys(doctorRatingsInSubmission)) {
          const docData = doctorRatingsInSubmission[doctorId];
          
          if (!doctorStats[doctorId]) {
            let doctorName = localIdToNameMap[doctorId] || doctorId;
            if (!doctorName.match(/^dr\.?\s/i)) {
              doctorName = 'Dr. ' + doctorName;
            }
            
            doctorStats[doctorId] = {
              doctor_id: doctorId,
              doctor_name: doctorName,
              department: 'General',
              patient_count: 0,
              total_patient_avg: 0,
              five_star: 0,
              four_star: 0,
              three_star: 0,
              two_star: 0,
              one_star: 0,
              question_ratings: {}
            };
          }
          
          const patientAvg = docData.count > 0 ? docData.total / docData.count : 0;
          doctorStats[doctorId].patient_count++;
          doctorStats[doctorId].total_patient_avg += patientAvg;
          
          const roundedAvg = Math.round(patientAvg);
          if (roundedAvg === 5) doctorStats[doctorId].five_star++;
          else if (roundedAvg === 4) doctorStats[doctorId].four_star++;
          else if (roundedAvg === 3) doctorStats[doctorId].three_star++;
          else if (roundedAvg === 2) doctorStats[doctorId].two_star++;
          else if (roundedAvg === 1) doctorStats[doctorId].one_star++;
          
          for (const [qKey, qData] of Object.entries(docData.questions)) {
            if (!doctorStats[doctorId].question_ratings[qKey]) {
              doctorStats[doctorId].question_ratings[qKey] = {
                question_key: qKey,
                type: qData.type || 'stars',
                total: 0,
                count: 0
              };
              if (qData.type === 'yes_no') {
                doctorStats[doctorId].question_ratings[qKey].yes_count = 0;
                doctorStats[doctorId].question_ratings[qKey].no_count = 0;
              }
            }
            doctorStats[doctorId].question_ratings[qKey].total += qData.total || 0;
            doctorStats[doctorId].question_ratings[qKey].count += qData.count;
            if (qData.type === 'yes_no') {
              doctorStats[doctorId].question_ratings[qKey].yes_count += qData.yes_count || 0;
              doctorStats[doctorId].question_ratings[qKey].no_count += qData.no_count || 0;
            }
          }
        }
        
        for (const gq of generalQuestions.rows) {
          const questionKey = gq.question_key || String(gq.id);
          const answerValue = qa[questionKey];
          
          if (answerValue !== undefined && answerValue !== null) {
            if (!generalStats[questionKey]) {
              generalStats[questionKey] = {
                question_key: questionKey,
                type: gq.type || 'stars',
                total: 0,
                count: 0
              };
              if (gq.type === 'yes_no') {
                generalStats[questionKey].yes_count = 0;
                generalStats[questionKey].no_count = 0;
              }
            }
            
            if (gq.type === 'yes_no') {
              const normalizedAnswer = String(answerValue).toLowerCase();
              if (normalizedAnswer === 'yes') {
                generalStats[questionKey].yes_count++;
              } else if (normalizedAnswer === 'no') {
                generalStats[questionKey].no_count++;
              }
              generalStats[questionKey].count++;
            } else {
              const numericValue = Number(answerValue);
              if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
                generalStats[questionKey].total += numericValue;
                generalStats[questionKey].count++;
              }
            }
          }
        }
      }

      let ratings = Object.values(doctorStats).map(d => {
        const questionRatingsArray = Object.values(d.question_ratings).map(qr => ({
          question_key: qr.question_key,
          type: qr.type,
          average: qr.count > 0 ? qr.total / qr.count : 0,
          count: qr.count,
          yes_count: qr.yes_count || 0,
          no_count: qr.no_count || 0
        }));

        return {
          doctor_id: d.doctor_id,
          doctor_name: d.doctor_name,
          department: d.department,
          patient_count: d.patient_count,
          average_rating: d.patient_count > 0 ? d.total_patient_avg / d.patient_count : 0,
          five_star: d.five_star,
          four_star: d.four_star,
          three_star: d.three_star,
          two_star: d.two_star,
          one_star: d.one_star,
          question_ratings: questionRatingsArray
        };
      });

      if (doctorNameFilter) {
        ratings = ratings.filter(r => 
          r.doctor_name.toLowerCase().includes(doctorNameFilter.toLowerCase()) ||
          r.doctor_id.toLowerCase().includes(doctorNameFilter.toLowerCase())
        );
      }

      ratings.sort((a, b) => a.doctor_name.localeCompare(b.doctor_name));

      const generalSurvey = Object.values(generalStats).map(g => {
        if (g.type === 'yes_no') {
          const total = g.yes_count + g.no_count;
          return {
            question_key: g.question_key,
            type: g.type,
            yes_percentage: total > 0 ? Math.round((g.yes_count / total) * 100) : 0,
            yes_count: g.yes_count,
            no_count: g.no_count,
            total_responses: total
          };
        }
        return {
          question_key: g.question_key,
          type: g.type,
          average: g.count > 0 ? parseFloat((g.total / g.count).toFixed(2)) : 0,
          total_responses: g.count
        };
      });

      generalSurvey.sort((a, b) => a.question_key.localeCompare(b.question_key));

      const totalSubmissions = submissions.rows.length;
      const doctorQuestionKeys = ratings[0]?.question_ratings?.map(qr => qr.question_key) || [];
      const generalQuestionKeys = generalSurvey.map(g => g.question_key);

      const getDoctorColumnValue = (doctor, questionKey) => {
        const qr = doctor.question_ratings?.find(q => q.question_key === questionKey);
        if (!qr) return '-';
        if (qr.type === 'yes_no') {
          return `Yes: ${qr.yes_count}, No: ${qr.no_count}`;
        }
        return qr.average ? qr.average.toFixed(1) : '-';
      };

      const XLSX = require('xlsx');

      if (format === 'xlsx') {
        const workbook = XLSX.utils.book_new();
        
        if (reportType === 'doctor') {
          const headers = ['Doctor Name', 'Patients', ...doctorQuestionKeys, 'Average Rating'];
          const doctorSheetData = ratings.map(d => {
            const row = {
              'Doctor Name': d.doctor_name,
              'Patients': d.patient_count
            };
            doctorQuestionKeys.forEach(key => {
              row[key] = getDoctorColumnValue(d, key);
            });
            row['Average Rating'] = d.average_rating ? d.average_rating.toFixed(2) : '0.00';
            return row;
          });
          const doctorSheet = XLSX.utils.json_to_sheet(doctorSheetData);
          XLSX.utils.book_append_sheet(workbook, doctorSheet, 'Doctor Report');
        } else {
          const headers = ['Total Submissions', ...generalQuestionKeys, 'Average'];
          const numericAverages = generalSurvey.filter(g => g.type !== 'yes_no' && g.average).map(g => g.average);
          const overallAvg = numericAverages.length > 0 ? (numericAverages.reduce((a, b) => a + b, 0) / numericAverages.length).toFixed(1) : '-';
          const row = {};
          row['Total Submissions'] = totalSubmissions;
          generalQuestionKeys.forEach(key => {
            const g = generalSurvey.find(q => q.question_key === key);
            if (g) {
              row[key] = g.type === 'yes_no' ? (`Yes: ${g.yes_count}, No: ${g.no_count}`) : (g.average || '-');
            }
          });
          row['Average'] = overallAvg;
          const generalSheet = XLSX.utils.json_to_sheet([row]);
          XLSX.utils.book_append_sheet(workbook, generalSheet, 'General Report');
        }
        
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report.xlsx"`);
        return res.send(buffer);
      }

      if (format === 'csv') {
        let csv = '';
        
        if (reportType === 'doctor') {
          csv = 'Doctor Name,Patients,' + doctorQuestionKeys.join(',') + ',Average Rating\n';
          for (const d of ratings) {
            const row = [
              d.doctor_name,
              d.patient_count,
              ...doctorQuestionKeys.map(key => getDoctorColumnValue(d, key)),
              d.average_rating ? d.average_rating.toFixed(2) : '0.00'
            ];
            csv += row.map(csvEscape).join(',') + '\n';
          }
        } else {
          const numericAverages = generalSurvey.filter(g => g.type !== 'yes_no' && g.average).map(g => g.average);
          const overallAvg = numericAverages.length > 0 ? (numericAverages.reduce((a, b) => a + b, 0) / numericAverages.length).toFixed(1) : '-';
          csv = 'Total Submissions,' + generalQuestionKeys.join(',') + ',Average\n';
          const row = [totalSubmissions];
          generalQuestionKeys.forEach(key => {
            const g = generalSurvey.find(q => q.question_key === key);
            row.push(g ? (g.type === 'yes_no' ? (`Yes: ${g.yes_count}, No: ${g.no_count}`) : (g.average || '-')) : '-');
          });
          csv += row.map(csvEscape).join(',') + ',' + csvEscape(overallAvg) + '\n';
        }
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report.csv"`);
        return res.send(csv);
      }

      if (format === 'pdf') {
        return new Promise((resolve, reject) => {
          try {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
              const buffer = Buffer.concat(chunks);
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
              return res.send(buffer);
            });
            doc.on('error', reject);

            const pageW = 595;
            const leftM = 40;
            const rightM = 40;
            const contentW = pageW - leftM - rightM;

            try {
              doc.image(path.join(__dirname, '../../frontend/image/girum-logo.png'), leftM, 10, { width: 40, height: 40 });
            } catch (e) {}

            doc.fillColor('#111827')
               .fontSize(18)
               .font('Helvetica-Bold')
               .text('Girum Hospital', 0, 18, { align: 'center', width: pageW });
            
            doc.fontSize(12)
               .font('Helvetica')
               .text(reportType === 'doctor' ? 'Doctor Report' : 'General Report', 0, 42, { align: 'center', width: pageW });

            const now = new Date();
            const genDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            const genTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            doc.fontSize(9).fillColor('#6b7280').text(`Generated on: ${genDate} at ${genTime}`, pageW - rightM - 80, 18, { align: 'right', width: 80 });

            if (dateFrom || dateTo) {
              doc.fontSize(9).fillColor('#111827').text(`Period: ${dateFrom || 'Start'} - ${dateTo || 'Now'}`, leftM, 65);
            }

            doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text('', leftM, 80);

            let y = 95;
            doc.fontSize(10).font('Helvetica');
            
            if (reportType === 'doctor') {
              const headers = ['No', 'Doctor', 'Patients', ...doctorQuestionKeys, 'Avg'];
              const colCount = headers.length;
              const docColWidth = 120;
              const otherColWidth = (contentW - docColWidth) / (colCount - 1);
              const colWidths = [30, docColWidth, otherColWidth, ...Array(colCount - 3).fill(otherColWidth)];
              const headerHeight = 28;
              const rowHeight = 20;
              
              let xPos = leftM;
              const colPositions = colWidths.map(w => {
                const pos = xPos;
                xPos += w;
                return pos;
              });
              
              doc.rect(leftM, y, contentW, headerHeight).fill('#e5e7eb');
              doc.strokeColor('#111827').lineWidth(0.5);
              doc.rect(leftM, y, contentW, headerHeight).stroke();
              doc.fillColor('#111827').fontSize(7).font('Helvetica-Bold');
              headers.forEach((h, i) => {
                const align = i === 1 ? 'left' : 'center';
                doc.text(h, colPositions[i] + 2, y + 8, { width: colWidths[i] - 4, align: align });
              });
              y += headerHeight;
              
              for (let idx = 0; idx < ratings.length; idx++) {
                const d = ratings[idx];

                if (y > 750) {
                  doc.addPage();
                  y = 40;
                  doc.rect(leftM, y, contentW, headerHeight).fill('#e5e7eb');
                  doc.strokeColor('#111827').lineWidth(0.5);
                  doc.rect(leftM, y, contentW, headerHeight).stroke();
                  doc.fillColor('#111827').fontSize(7).font('Helvetica-Bold');
                  headers.forEach((h, i) => {
                    const align = i === 1 ? 'left' : 'center';
                    doc.text(h, colPositions[i] + 2, y + 8, { width: colWidths[i] - 4, align: align });
                  });
                  y += headerHeight;
                }
                
                doc.fillColor('#111827').fontSize(8).font('Helvetica');
                doc.rect(leftM, y, contentW, rowHeight).stroke();
                 
                const values = [String(idx + 1), d.doctor_name, String(d.patient_count), ...doctorQuestionKeys.map(key => getDoctorColumnValue(d, key)), d.average_rating ? d.average_rating.toFixed(2) : '0.00'];
                values.forEach((v, i) => {
                  const align = i === 1 ? 'left' : 'center';
                  doc.text(String(v), colPositions[i] + 3, y + 5, { width: colWidths[i] - 6, align: align });
                });
                y += rowHeight;
              }
            } else {
              const headers = ['No', 'Total Submissions', ...generalQuestionKeys, 'Average'];
              const colCount = headers.length;
              const colWidth = contentW / colCount;
              const headerHeight = 25;
              const rowHeight = 18;
              
              doc.rect(leftM, y, contentW, headerHeight).fill('#e5e7eb');
              doc.strokeColor('#111827').lineWidth(0.5);
              doc.rect(leftM, y, contentW, headerHeight).stroke();
              doc.fillColor('#111827').fontSize(7).font('Helvetica-Bold');
              headers.forEach((h, i) => {
                doc.text(h, leftM + (i * colWidth) + 2, y + 7, { width: colWidth - 4, align: 'center' });
              });
              y += headerHeight;
              
              const numericAverages = generalSurvey.filter(g => g.type !== 'yes_no' && g.average).map(g => g.average);
              const overallAvg = numericAverages.length > 0 ? (numericAverages.reduce((a, b) => a + b, 0) / numericAverages.length).toFixed(1) : '-';
              
              const values = ['1', String(totalSubmissions), ...generalQuestionKeys.map(key => {
                const g = generalSurvey.find(q => q.question_key === key);
                if (!g) return '-';
                return g.type === 'yes_no' ? (`Yes: ${g.yes_count}, No: ${g.no_count}`) : (g.average?.toString() || '-');
              }), overallAvg];
              
              doc.fillColor('#111827').fontSize(7).font('Helvetica');
              doc.rect(leftM, y, contentW, rowHeight).stroke();
              values.forEach((v, i) => {
                doc.text(String(v), leftM + (i * colWidth) + 2, y + 4, { width: colWidth - 4, align: 'center' });
              });
            }

            doc.end();
          } catch (err) {
            reject(err);
          }
        });
      }

      return res.status(400).json({ error: 'invalid_format', details: 'Supported formats: csv, xlsx, pdf' });
    } catch (e) {
      return res.status(500).json({ error: 'export_failed' });
    }
  });

  app.post('/api/doctor-ratings/send-email', requireAuth, requireModule('doctor-ratings'), async function (req, res) {
    try {
      const { doctor_id, doctor_name, email, average_rating, total_patients, total_ratings, date_from, date_to, question_ratings, department } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'email_required' });
      }

      const rating = Number(average_rating) || 0;
      const total = Number(total_patients || total_ratings || 0);
      
      const getRatingStatus = () => {
        if (rating >= 4.5) return 'Excellent';
        if (rating >= 4.0) return 'Very Good';
        if (rating >= 3.5) return 'Good';
        if (rating >= 3.0) return 'Average';
        if (rating >= 2.0) return 'Below Average';
        return 'Poor';
      };
      
      const getFeedbackMessage = () => {
        let strengths = [];
        let improvements = [];
        
        if (Array.isArray(question_ratings) && question_ratings.length > 0) {
          for (const qr of question_ratings) {
            const avg = Number(qr.average) || 0;
            const questionName = qr.question_key || 'Rating';
            
            if (qr.type === 'yes_no') {
              const yesCount = qr.yes_count || 0;
              const noCount = qr.no_count || 0;
              const yesPct = (yesCount + noCount) > 0 ? Math.round((yesCount / (yesCount + noCount)) * 100) : 0;
              if (yesPct >= 80) {
                strengths.push(questionName);
              } else if (yesPct < 50) {
                improvements.push(questionName);
              }
            } else {
              if (avg >= 4.0) {
                strengths.push(questionName);
              } else if (avg < 3.0) {
                improvements.push(questionName);
              }
            }
          }
        }
        
        if (rating >= 4.0) {
          return 'Your overall performance is rated as Excellent. Patients consistently rate you at the highest levels across all aspects of care. Your dedication to patient satisfaction is evident. Continue providing this exceptional level of care.';
        } else if (rating >= 3.5 && improvements.length > 0) {
          return `Your overall performance is rated as Good. Patients appreciate your care and service.\n\nAreas where you excel: ${strengths.join(', ')}.\n\nAreas for improvement: ${improvements.join(', ')}. Focusing on these areas could help enhance overall patient satisfaction even more.`;
        } else if (rating >= 3.5) {
          return 'Your overall performance is rated as Good. Patients appreciate the care and service you provide. Your professionalism and communication were positively recognized.\n\nThere are opportunities for further improvement in areas such as quality of care experience and time & attention, which could help enhance overall patient satisfaction even more.';
        } else if (rating >= 3.0) {
          return `Your overall performance is rated as Average. ${improvements.length > 0 ? `Specific areas needing attention: ${improvements.join(', ')}.` : 'Consider reviewing the detailed feedback to identify specific areas where you can enhance patient experience.'}`;
        } else {
          return `Your overall performance needs improvement. We recommend focusing on: ${improvements.length > 0 ? improvements.join(', ') : 'all aspects of patient care'}. Please review the detailed feedback carefully and work with your supervisors to develop an improvement plan.`;
        }
      };
      
      const status = getRatingStatus();
      
      const formatDate = (dateStr) => {
        if (!dateStr) return 'All Time';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
      };

      let categoryRatingsText = '';
      if (Array.isArray(question_ratings) && question_ratings.length > 0) {
        const categoryLines = question_ratings.map(qr => {
          const questionName = qr.question_key || 'Rating';
          const yesCount = qr.yes_count || 0;
          const noCount = qr.no_count || 0;
          const avg = Number(qr.average).toFixed(1);
          
          if (qr.type === 'yes_no') {
            const yesPct = (yesCount + noCount) > 0 ? Math.round((yesCount / (yesCount + noCount)) * 100) : 0;
            return `* ${questionName}: ${yesPct}% Positive Response (${yesCount} Yes / ${noCount} No)`;
          }
          return `* ${questionName}: ${avg} / 5.0`;
        });
        categoryRatingsText = categoryLines.join('\n');
      }

      const message = `Dear ${doctor_name},

Please find below your Patient Feedback Performance Report for the evaluation period ${formatDate(date_from)} - ${formatDate(date_to)}.

This report is based on feedback received from ${total} patient${total !== 1 ? 's' : ''} who completed the patient satisfaction survey during their visit.

Overall Performance Rating

${rating.toFixed(1)} / 5.0
Performance Level: ${status}

Category Ratings

${categoryRatingsText}

Performance Summary

${getFeedbackMessage()}

We appreciate your continued commitment to delivering quality healthcare services and value your dedication to patient care.

Kind regards,
Management Team`;

      const html = `<pre style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${message}</pre>`;

      try {
        const result = await sendEmail({
          to: email,
          subject: `Patient Feedback Report - ${doctor_name} | Rating: ${rating.toFixed(1)}/5`,
          html
        });

        if (!result.ok) {
          return res.status(500).json({ error: 'email_failed', details: result.error });
        }

        return res.json({ ok: true, message: 'Email sent successfully' });
      } catch (emailError) {
        console.error('Email error:', emailError);
        return res.status(500).json({ error: 'email_failed', details: emailError.message });
      }
    } catch (e) {
      console.error('Send email error:', e);
      return res.status(500).json({ error: 'send_failed' });
    }
  });

  app.post('/api/doctor-ratings/send-all', requireAuth, requireModule('doctor-ratings'), async function (req, res) {
    try {
      const { ratings, date_from, date_to } = req.body;
      
      if (!Array.isArray(ratings) || ratings.length === 0) {
        return res.status(400).json({ error: 'ratings_required' });
      }

      const results = { sent: [], failed: [] };
      
      const formatDate = (dateStr) => {
        if (!dateStr) return 'All Time';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
      };
      
      const getRatingStatus = (rating) => {
        if (rating >= 4.5) return 'Excellent';
        if (rating >= 4.0) return 'Very Good';
        if (rating >= 3.5) return 'Good';
        if (rating >= 3.0) return 'Average';
        if (rating >= 2.0) return 'Below Average';
        return 'Poor';
      };
      
      const getFeedbackMessage = (rating, question_ratings) => {
        let strengths = [];
        let improvements = [];
        
        if (Array.isArray(question_ratings) && question_ratings.length > 0) {
          for (const qr of question_ratings) {
            const avg = Number(qr.average) || 0;
            const questionName = qr.question_key || 'Rating';
            
            if (qr.type === 'yes_no') {
              const yesCount = qr.yes_count || 0;
              const noCount = qr.no_count || 0;
              const yesPct = (yesCount + noCount) > 0 ? Math.round((yesCount / (yesCount + noCount)) * 100) : 0;
              if (yesPct >= 80) {
                strengths.push(questionName);
              } else if (yesPct < 50) {
                improvements.push(questionName);
              }
            } else {
              if (avg >= 4.0) {
                strengths.push(questionName);
              } else if (avg < 3.0) {
                improvements.push(questionName);
              }
            }
          }
        }
        
        if (rating >= 4.0) {
          return 'Your overall performance is rated as Excellent. Patients consistently rate you at the highest levels across all aspects of care. Your dedication to patient satisfaction is evident. Continue providing this exceptional level of care.';
        } else if (rating >= 3.5 && improvements.length > 0) {
          return `Your overall performance is rated as Good. Patients appreciate your care and service.\n\nAreas where you excel: ${strengths.join(', ')}.\n\nAreas for improvement: ${improvements.join(', ')}. Focusing on these areas could help enhance overall patient satisfaction even more.`;
        } else if (rating >= 3.5) {
          return 'Your overall performance is rated as Good. Patients appreciate the care and service you provide. Your professionalism and communication were positively recognized.\n\nThere are opportunities for further improvement in areas such as quality of care experience and time & attention, which could help enhance overall patient satisfaction even more.';
        } else if (rating >= 3.0) {
          return `Your overall performance is rated as Average. ${improvements.length > 0 ? `Specific areas needing attention: ${improvements.join(', ')}.` : 'Consider reviewing the detailed feedback to identify specific areas where you can enhance patient experience.'}`;
        } else {
          return `Your overall performance needs improvement. We recommend focusing on: ${improvements.length > 0 ? improvements.join(', ') : 'all aspects of patient care'}. Please review the detailed feedback carefully and work with your supervisors to develop an improvement plan.`;
        }
      };

      for (const doctor of ratings) {
        const { doctor_id, doctor_name, email, average_rating, total_patients, question_ratings } = doctor;
        
        if (!email) {
          results.failed.push({ doctor_id, doctor_name, error: 'No email' });
          continue;
        }

        const rating = Number(average_rating) || 0;
        const total = Number(total_patients || 0);
        const status = getRatingStatus(rating);

        let categoryRatingsText = '';
        if (Array.isArray(question_ratings) && question_ratings.length > 0) {
          const categoryLines = question_ratings.map(qr => {
            const questionName = qr.question_key || 'Rating';
            const yesCount = qr.yes_count || 0;
            const noCount = qr.no_count || 0;
            const avg = Number(qr.average).toFixed(1);
            
            if (qr.type === 'yes_no') {
              const yesPct = (yesCount + noCount) > 0 ? Math.round((yesCount / (yesCount + noCount)) * 100) : 0;
              return `* ${questionName}: ${yesPct}% Positive Response (${yesCount} Yes / ${noCount} No)`;
            }
            return `* ${questionName}: ${avg} / 5.0`;
          });
          categoryRatingsText = categoryLines.join('\n');
        }

        const message = `Dear ${doctor_name},

Please find below your Patient Feedback Performance Report for the evaluation period ${formatDate(date_from)} - ${formatDate(date_to)}.

This report is based on feedback received from ${total} patient${total !== 1 ? 's' : ''} who completed the patient satisfaction survey during their visit.

Overall Performance Rating

${rating.toFixed(1)} / 5.0
Performance Level: ${status}

Category Ratings

${categoryRatingsText}

Performance Summary

${getFeedbackMessage(rating, question_ratings)}

We appreciate your continued commitment to delivering quality healthcare services and value your dedication to patient care.

Kind regards,
Management Team`;

        const html = `<pre style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${message}</pre>`;

        try {
          const result = await sendEmail({
            to: email,
            subject: `Patient Feedback Report - ${doctor_name} | Rating: ${rating.toFixed(1)}/5`,
            html
          });

          if (result.ok) {
            results.sent.push({ doctor_id, doctor_name, email });
          } else {
            results.failed.push({ doctor_id, doctor_name, email, error: result.error });
          }
        } catch (err) {
          results.failed.push({ doctor_id, doctor_name, email, error: err.message });
        }
      }

      return res.json({ 
        ok: true, 
        message: `Sent ${results.sent.length} emails, ${results.failed.length} failed`,
        results 
      });
    } catch (e) {
      return res.status(500).json({ error: 'send_all_failed' });
    }
  });
}

module.exports = { register };

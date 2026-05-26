const db = require('../config/database');
const { requireAuth, requireModule } = require('../middleware/auth');
const { fetchQuestions } = require('../services/questions');

function register(app) {
  app.get('/api/analytics', requireAuth, requireModule('dashboard'), async function (req, res) {
    const { date_from, date_to } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (date_from && date_to) {
      dateFilter = 'WHERE DATE(fs.submitted_at) >= $1 AND DATE(fs.submitted_at) <= $2';
      params.push(date_from, date_to);
    } else if (date_from) {
      dateFilter = 'WHERE DATE(fs.submitted_at) >= $1';
      params.push(date_from);
    } else if (date_to) {
      dateFilter = 'WHERE DATE(fs.submitted_at) <= $1';
      params.push(date_to);
    }
    
    const totals = await db.query(
      `SELECT COUNT(*)::int AS total_submissions FROM feedback_submissions fs ${dateFilter}`,
      params
    );

    const questions = await fetchQuestions({ includeInactive: false });
    const generalQuestionKeys = new Set(questions.filter(q => q.category === 'general').map(q => q.key));

    const submissions = await db.query(
      `SELECT fs.id AS submission_id, fs.question_answers, fs.selected_doctor_ids, fs.selected_doctor_names FROM feedback_submissions fs ${dateFilter}`,
      params
    );
    
    let generalSatisfied = 0;
    let generalNeutral = 0;
    let generalNotSatisfied = 0;
    const generalQuestionStats = {};
    const generalStarRatings = {};
    const generalYesNo = {};

    const doctorStats = {};
    
    for (const row of submissions.rows) {
      const qa = row.question_answers || {};
      const doctorNamesList = row.selected_doctor_names || [];
      const doctorIdsList = row.selected_doctor_ids || [];
      
      const allKeys = Object.keys(qa);
      const doctorIdsInOrder = [];
      const seenIds = new Set();
      
      for (const key of allKeys) {
        const match = key.match(/^doctor_([^_]+)_.+$/);
        if (match) {
          const doctorId = match[1];
          if (!seenIds.has(doctorId)) {
            seenIds.add(doctorId);
            doctorIdsInOrder.push(doctorId);
          }
        }
      }
      
      const idToNameMap = {};
      if (doctorIdsList.length > 0 && doctorIdsList.length === doctorNamesList.length) {
        for (let i = 0; i < doctorIdsList.length; i++) {
          idToNameMap[doctorIdsList[i]] = doctorNamesList[i];
        }
      } else {
        for (let i = 0; i < doctorIdsInOrder.length; i++) {
          idToNameMap[doctorIdsInOrder[i]] = doctorNamesList[i] || doctorIdsInOrder[i];
        }
      }
      
      for (const key of allKeys) {
        const isGeneralQuestion = generalQuestionKeys.has(key);
        const value = qa[key];
        
        if (isGeneralQuestion) {
          if (!generalQuestionStats[key]) {
            generalQuestionStats[key] = { satisfied: 0, neutral: 0, not_satisfied: 0 };
          }
          
          if (typeof value === 'number' && value >= 1 && value <= 5) {
            if (!generalStarRatings[key]) {
              generalStarRatings[key] = [];
            }
            generalStarRatings[key].push(value);
            
            if (value >= 4) {
              generalSatisfied++;
              generalQuestionStats[key].satisfied++;
            }
            else if (value === 3) {
              generalNeutral++;
              generalQuestionStats[key].neutral++;
            }
            else {
              generalNotSatisfied++;
              generalQuestionStats[key].not_satisfied++;
            }
          } else if (typeof value === 'string') {
            const lowerVal = value.toLowerCase();
            if (!generalYesNo[key]) {
              generalYesNo[key] = { yes: 0, no: 0 };
            }
            if (lowerVal === 'yes') {
              generalSatisfied++;
              generalQuestionStats[key].satisfied++;
              generalYesNo[key].yes++;
            }
            else if (lowerVal === 'no') {
              generalNotSatisfied++;
              generalQuestionStats[key].not_satisfied++;
              generalYesNo[key].no++;
            }
          }
        }
        
        const match = key.match(/^doctor_([^_]+)_(.+)$/);
        if (match) {
          const doctorId = match[1];
          const questionKey = match[2];
          const doctorName = idToNameMap[doctorId] || doctorId;
          const value = qa[key];
          
          if (!doctorStats[doctorName]) {
            doctorStats[doctorName] = {
              doctor_id: doctorId,
              doctor_name: doctorName,
              question_ratings: {},
              question_answers: {},
              patient_ids: new Set()
            };
          }
          
          doctorStats[doctorName].patient_ids.add(row.submission_id);
          
          if (typeof value === 'number' && value >= 1 && value <= 5) {
            if (!doctorStats[doctorName].question_ratings[questionKey]) {
              doctorStats[doctorName].question_ratings[questionKey] = [];
            }
            doctorStats[doctorName].question_ratings[questionKey].push(value);
          }
          
          if (value !== undefined && value !== null && value !== '') {
            if (!doctorStats[doctorName].question_answers[questionKey]) {
              doctorStats[doctorName].question_answers[questionKey] = [];
            }
            doctorStats[doctorName].question_answers[questionKey].push(String(value));
          }
        }
      }
    }

    const doctorAverages = Object.values(doctorStats).map(d => {
      const allRatings = [];
      const questionRatings = {};
      const questionAnswers = {};
      
      for (const [qKey, ratings] of Object.entries(d.question_ratings || {})) {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        questionRatings[qKey] = Math.round(avg * 100) / 100;
        allRatings.push(...ratings);
      }
      
      for (const [qKey, answers] of Object.entries(d.question_answers || {})) {
        const countByAnswer = {};
        for (const ans of answers) {
          countByAnswer[ans] = (countByAnswer[ans] || 0) + 1;
        }
        const total = answers.length;
        const percentages = {};
        for (const [ans, count] of Object.entries(countByAnswer)) {
          percentages[ans] = Math.round((count / total) * 100);
        }
        questionAnswers[qKey] = {
          counts: countByAnswer,
          percentages,
          total
        };
      }
      
      const avg = allRatings.length > 0 
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length 
        : 0;
      const patientCount = d.patient_ids ? d.patient_ids.size : 0;
      return {
        doctor_id: d.doctor_id,
        doctor_name: d.doctor_name,
        avg_rating: allRatings.length > 0 ? Math.round(avg * 100) / 100 : null,
        rating_count: allRatings.length,
        patient_count: patientCount,
        question_ratings: questionRatings,
        question_answers: questionAnswers
      };
    }).sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

    const totalGeneral = generalSatisfied + generalNeutral + generalNotSatisfied;
    const questionBreakdown = Object.entries(generalQuestionStats).map(([key, stats]) => {
      const qTotal = stats.satisfied + stats.neutral + stats.not_satisfied;
      
      let avgSatisfied = 0;
      let avgNeutral = 3;
      let avgNotSatisfied = 0;
      
      if (stats.satisfied > 0) {
        const ratings = (generalStarRatings[key] || []).filter(r => r >= 4);
        if (ratings.length > 0) {
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          avgSatisfied = Math.round(avg * 100) / 100;
        } else {
          avgSatisfied = 4;
        }
      }
      if (stats.not_satisfied > 0) {
        const ratings = (generalStarRatings[key] || []).filter(r => r <= 2);
        if (ratings.length > 0) {
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          avgNotSatisfied = Math.round(avg * 100) / 100;
        } else {
          avgNotSatisfied = 1.5;
        }
      }
      
      const notSatisfiedHeight = avgNotSatisfied;
      const neutralHeight = avgSatisfied - avgNotSatisfied;
      const satisfiedHeight = 5 - avgSatisfied;
      
      return {
        question_key: key,
        satisfied: stats.satisfied,
        neutral: stats.neutral,
        not_satisfied: stats.not_satisfied,
        avg_satisfied: avgSatisfied,
        avg_neutral: avgNeutral,
        avg_not_satisfied: avgNotSatisfied,
        total: qTotal,
        satisfied_percent: qTotal > 0 ? Math.round((stats.satisfied / qTotal) * 100) : 0,
        neutral_percent: qTotal > 0 ? Math.round((stats.neutral / qTotal) * 100) : 0,
        not_satisfied_percent: qTotal > 0 ? Math.round((stats.not_satisfied / qTotal) * 100) : 0
      };
    }).filter(q => q.total > 0);
    
    const starRatingAverages = Object.entries(generalStarRatings).map(([key, ratings]) => {
      if (!ratings || ratings.length === 0) return null;
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      return {
        question_key: key,
        average: Math.round(avg * 100) / 100,
        total: ratings.length
      };
    }).filter(q => q !== null);
    
    const yesNoBreakdown = Object.entries(generalYesNo).map(([key, stats]) => {
      const total = stats.yes + stats.no;
      return {
        question_key: key,
        yes: stats.yes,
        no: stats.no,
        yes_percent: total > 0 ? Math.round((stats.yes / total) * 100) : 0,
        no_percent: total > 0 ? Math.round((stats.no / total) * 100) : 0,
        total: total
      };
    }).filter(q => q.total > 0);
    
    return res.json({
      total_submissions: totals.rows[0] ? totals.rows[0].total_submissions : 0,
      doctor_averages: doctorAverages,
      general_satisfaction: {
        satisfied: generalSatisfied,
        neutral: generalNeutral,
        not_satisfied: generalNotSatisfied,
        total: totalGeneral,
        satisfied_percent: totalGeneral > 0 ? Math.round((generalSatisfied / totalGeneral) * 100) : 0,
        neutral_percent: totalGeneral > 0 ? Math.round((generalNeutral / totalGeneral) * 100) : 0,
        not_satisfied_percent: totalGeneral > 0 ? Math.round((generalNotSatisfied / totalGeneral) * 100) : 0
      },
      question_breakdown: questionBreakdown,
      star_rating_breakdown: starRatingAverages,
      yesno_breakdown: yesNoBreakdown
    });
  });

  app.get('/api/reports/survey-stats', requireAuth, requireModule('reports'), async function (req, res) {
    try {
      const { date_from, date_to } = req.query;
      const conditions = [];
      const params = [];
      let idx = 1;

      if (date_from) {
        conditions.push(`st.created_at >= $${idx}::timestamptz`);
        params.push(date_from + 'T00:00:00.000Z');
        idx++;
      }
      if (date_to) {
        conditions.push(`st.created_at <= $${idx}::timestamptz`);
        params.push(date_to + 'T23:59:59.999Z');
        idx++;
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      const result = await db.query(
        `SELECT
          COUNT(*) AS total_sent,
          COUNT(*) FILTER (WHERE st.used_at IS NOT NULL) AS filled,
          COUNT(*) FILTER (WHERE st.used_at IS NULL) AS not_filled
        FROM survey_tokens st
        JOIN encounters e ON e.survey_token = st.token
        ${whereClause}`,
        params
      );

      return res.json({
        total_sent: parseInt(result.rows[0].total_sent),
        filled: parseInt(result.rows[0].filled),
        not_filled: parseInt(result.rows[0].not_filled)
      });
    } catch (e) {
      return res.status(500).json({ error: 'survey_stats_failed' });
    }
  });
}

module.exports = { register };

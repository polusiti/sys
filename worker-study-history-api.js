// ============================================
// 学習履歴・復習機能のバックエンドAPI
// cloudflare-worker-learning-notebook-complete.js に追加
// ============================================

// ===== ルーティングに追加 =====
/*
  // 学習履歴API
  if (path === '/api/study/session/start' && request.method === 'POST') {
    return await handleStudySessionStart(request, env, corsHeaders);
  }

  if (path === '/api/study/session/end' && request.method === 'POST') {
    return await handleStudySessionEnd(request, env, corsHeaders);
  }

  if (path === '/api/study/record' && request.method === 'POST') {
    return await handleStudyRecord(request, env, corsHeaders);
  }

  if (path === '/api/study/history' && request.method === 'GET') {
    return await handleGetStudyHistory(request, env, corsHeaders);
  }

  if (path === '/api/study/stats' && request.method === 'GET') {
    return await handleGetStudyStats(request, env, corsHeaders);
  }

  // 復習機能API
  if (path === '/api/study/wrong-answers' && request.method === 'GET') {
    return await handleGetWrongAnswers(request, env, corsHeaders);
  }

  if (path === '/api/study/wrong-answers/master' && request.method === 'POST') {
    return await handleMarkAsMastered(request, env, corsHeaders);
  }
*/

// ===== API実装 =====

/**
 * POST /api/study/session/start
 * 学習セッション開始
 */
async function handleStudySessionStart(request, env, corsHeaders) {
  try {
    const { userId, subject, level } = await request.json();

    if (!userId || !subject || !level) {
      return jsonResponse({
        success: false,
        error: 'userId, subject, level が必要です'
      }, 400, corsHeaders);
    }

    // 既存のセッションがある場合は終了させる
    await env.TESTAPP_DB.prepare(
      'UPDATE study_sessions SET ended_at = datetime("now") WHERE user_id = ? AND ended_at IS NULL'
    ).bind(userId).run();

    // 新しいセッションを作成
    const result = await env.TESTAPP_DB.prepare(
      'INSERT INTO study_sessions (user_id, subject, difficulty_level, started_at) VALUES (?, ?, ?, datetime("now"))'
    ).bind(userId, subject, level).run();

    return jsonResponse({
      success: true,
      sessionId: result.meta.last_row_id
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Study session start error:', error);
    return jsonResponse({
      success: false,
      error: 'セッション開始エラー'
    }, 500, corsHeaders);
  }
}

/**
 * POST /api/study/session/end
 * 学習セッション終了
 */
async function handleStudySessionEnd(request, env, corsHeaders) {
  try {
    const { sessionId, totalQuestions, correctQuestions, durationSeconds } = await request.json();

    if (!sessionId) {
      return jsonResponse({
        success: false,
        error: 'sessionId が必要です'
      }, 400, corsHeaders);
    }

    // セッションを更新
    await env.TESTAPP_DB.prepare(
      'UPDATE study_sessions SET ended_at = datetime("now"), total_questions = ?, correct_questions = ?, duration_seconds = ? WHERE id = ?'
    ).bind(totalQuestions || 0, correctQuestions || 0, durationSeconds || 0, sessionId).run();

    return jsonResponse({
      success: true
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Study session end error:', error);
    return jsonResponse({
      success: false,
      error: 'セッション終了エラー'
    }, 500, corsHeaders);
  }
}

/**
 * POST /api/study/record
 * 問題回答を記録
 */
async function handleStudyRecord(request, env, corsHeaders) {
  try {
    const {
      userId,
      sessionId,
      subject,
      level,
      questionId,
      questionText,
      userAnswer,
      correctAnswer,
      isCorrect,
      timeSpentSeconds,
      explanation
    } = await request.json();

    if (!userId || !subject || !level) {
      return jsonResponse({
        success: false,
        error: 'userId, subject, level が必要です'
      }, 400, corsHeaders);
    }

    // 回答記録を保存
    await env.TESTAPP_DB.prepare(
      'INSERT INTO study_records (user_id, session_id, subject, difficulty_level, question_id, question_text, user_answer, correct_answer, is_correct, time_spent_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      userId,
      sessionId || null,
      subject,
      level,
      questionId || null,
      questionText || '',
      userAnswer || '',
      correctAnswer || '',
      isCorrect ? 1 : 0,
      timeSpentSeconds || null
    ).run();

    // 間違えた問題の場合、wrong_answersに追加または更新
    if (!isCorrect) {
      // 既存の間違い記録があるか確認
      const existing = await env.TESTAPP_DB.prepare(
        'SELECT id, wrong_count FROM wrong_answers WHERE user_id = ? AND subject = ? AND difficulty_level = ? AND question_text = ?'
      ).bind(userId, subject, level, questionText || '').first();

      if (existing) {
        // 既存の記録を更新
        await env.TESTAPP_DB.prepare(
          'UPDATE wrong_answers SET wrong_count = wrong_count + 1, last_wrong_at = datetime("now"), user_answer = ?, mastered = 0 WHERE id = ?'
        ).bind(userAnswer || '', existing.id).run();
      } else {
        // 新規追加
        await env.TESTAPP_DB.prepare(
          'INSERT INTO wrong_answers (user_id, subject, difficulty_level, question_id, question_text, user_answer, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          userId,
          subject,
          level,
          questionId || null,
          questionText || '',
          userAnswer || '',
          correctAnswer || '',
          explanation || null
        ).run();
      }
    }

    // 統計を更新
    const stats = await env.TESTAPP_DB.prepare(
      'SELECT * FROM study_stats WHERE user_id = ? AND subject = ? AND difficulty_level = ?'
    ).bind(userId, subject, level).first();

    if (stats) {
      await env.TESTAPP_DB.prepare(
        'UPDATE study_stats SET total_questions = total_questions + 1, correct_questions = correct_questions + ?, last_studied_at = datetime("now"), updated_at = datetime("now") WHERE id = ?'
      ).bind(isCorrect ? 1 : 0, stats.id).run();
    } else {
      await env.TESTAPP_DB.prepare(
        'INSERT INTO study_stats (user_id, subject, difficulty_level, total_questions, correct_questions, last_studied_at) VALUES (?, ?, ?, 1, ?, datetime("now"))'
      ).bind(userId, subject, level, isCorrect ? 1 : 0).run();
    }

    return jsonResponse({
      success: true
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Study record error:', error);
    return jsonResponse({
      success: false,
      error: '記録保存エラー'
    }, 500, corsHeaders);
  }
}

/**
 * GET /api/study/history?userId=123
 * 学習履歴を取得
 */
async function handleGetStudyHistory(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const limit = url.searchParams.get('limit') || '50';

    if (!userId) {
      return jsonResponse({
        success: false,
        error: 'userId が必要です'
      }, 400, corsHeaders);
    }

    // 最近の学習セッションを取得
    const sessions = await env.TESTAPP_DB.prepare(
      'SELECT * FROM study_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT ?'
    ).bind(userId, parseInt(limit)).all();

    return jsonResponse({
      success: true,
      sessions: sessions.results || []
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Get study history error:', error);
    return jsonResponse({
      success: false,
      error: '履歴取得エラー'
    }, 500, corsHeaders);
  }
}

/**
 * GET /api/study/stats?userId=123
 * 学習統計を取得
 */
async function handleGetStudyStats(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return jsonResponse({
        success: false,
        error: 'userId が必要です'
      }, 400, corsHeaders);
    }

    // 統計を取得
    const stats = await env.TESTAPP_DB.prepare(
      'SELECT * FROM study_stats WHERE user_id = ? ORDER BY last_studied_at DESC'
    ).bind(userId).all();

    // 総学習時間を計算
    const totalTime = await env.TESTAPP_DB.prepare(
      'SELECT SUM(duration_seconds) as total FROM study_sessions WHERE user_id = ?'
    ).bind(userId).first();

    // 最近7日間のアクティビティ
    const recentActivity = await env.TESTAPP_DB.prepare(
      'SELECT DATE(started_at) as date, COUNT(*) as sessions, SUM(total_questions) as questions FROM study_sessions WHERE user_id = ? AND started_at >= datetime("now", "-7 days") GROUP BY DATE(started_at) ORDER BY date DESC'
    ).bind(userId).all();

    return jsonResponse({
      success: true,
      stats: stats.results || [],
      totalStudySeconds: totalTime?.total || 0,
      recentActivity: recentActivity.results || []
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Get study stats error:', error);
    return jsonResponse({
      success: false,
      error: '統計取得エラー'
    }, 500, corsHeaders);
  }
}

/**
 * GET /api/study/wrong-answers?userId=123&subject=math&level=math_1a
 * 間違えた問題を取得（復習用）
 */
async function handleGetWrongAnswers(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const subject = url.searchParams.get('subject');
    const level = url.searchParams.get('level');
    const masteredOnly = url.searchParams.get('mastered') === 'false' ? false : null;

    if (!userId) {
      return jsonResponse({
        success: false,
        error: 'userId が必要です'
      }, 400, corsHeaders);
    }

    let query = 'SELECT * FROM wrong_answers WHERE user_id = ?';
    const params = [userId];

    if (subject) {
      query += ' AND subject = ?';
      params.push(subject);
    }

    if (level) {
      query += ' AND difficulty_level = ?';
      params.push(level);
    }

    if (masteredOnly === false) {
      query += ' AND mastered = 0';
    }

    query += ' ORDER BY last_wrong_at DESC';

    const wrongAnswers = await env.TESTAPP_DB.prepare(query).bind(...params).all();

    return jsonResponse({
      success: true,
      wrongAnswers: wrongAnswers.results || []
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Get wrong answers error:', error);
    return jsonResponse({
      success: false,
      error: '間違えた問題取得エラー'
    }, 500, corsHeaders);
  }
}

/**
 * POST /api/study/wrong-answers/master
 * 問題を「習得済み」にマーク
 */
async function handleMarkAsMastered(request, env, corsHeaders) {
  try {
    const { wrongAnswerId } = await request.json();

    if (!wrongAnswerId) {
      return jsonResponse({
        success: false,
        error: 'wrongAnswerId が必要です'
      }, 400, corsHeaders);
    }

    await env.TESTAPP_DB.prepare(
      'UPDATE wrong_answers SET mastered = 1, reviewed_at = datetime("now") WHERE id = ?'
    ).bind(wrongAnswerId).run();

    return jsonResponse({
      success: true
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Mark as mastered error:', error);
    return jsonResponse({
      success: false,
      error: '習得マークエラー'
    }, 500, corsHeaders);
  }
}

/**
 * Cloudflare Workers - TestApp D1 API
 * D1データベースとR2ストレージを組み合わせた問題管理システム
 */

import { sign, verify } from '@tsndr/cloudflare-worker-jwt';

export default {
  async fetch(request, env, ctx) {
    // CORS設定
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // OPTIONSリクエスト（CORS preflight）
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // 認証不要のエンドポイント
      if (path === '/api/health') {
        return jsonResponse({ 
          status: 'ok', 
          service: 'testapp-d1-api',
          database: 'connected',
          timestamp: new Date().toISOString()
        }, 200, corsHeaders);
      }

      // 認証エンドポイント
      if (path === '/api/auth/login' && request.method === 'POST') {
        return await loginUser(request, env, corsHeaders);
      }

      if (path === '/api/auth/register' && request.method === 'POST') {
        return await registerUser(request, env, corsHeaders);
      }

      // 保護されたエンドポイント - JWT認証チェック
      const authResult = await authenticateUser(request, env);
      if (!authResult.success) {
        return jsonResponse({ error: authResult.error }, authResult.status, corsHeaders);
      }

      const user = authResult.user;

      // ユーザー情報取得
      if (path === '/api/user/profile' && request.method === 'GET') {
        return await getUserProfile(user, corsHeaders);
      }

      // 科目一覧取得
      if (path === '/api/subjects' && request.method === 'GET') {
        return await getSubjects(env, corsHeaders);
      }

      // 問題セット関連API
      if (path.match(/^\/api\/questions\/(\w+)$/) && request.method === 'POST') {
        const subjectCode = path.match(/^\/api\/questions\/(\w+)$/)[1];
        return await saveQuestions(request, env, user, subjectCode, corsHeaders);
      }

      if (path.match(/^\/api\/questions\/(\w+)$/) && request.method === 'GET') {
        const subjectCode = path.match(/^\/api\/questions\/(\w+)$/)[1];
        return await loadQuestions(env, subjectCode, corsHeaders);
      }

      // 問題セット一覧取得
      if (path.match(/^\/api\/questions\/(\w+)\/sets$/) && request.method === 'GET') {
        const subjectCode = path.match(/^\/api\/questions\/(\w+)\/sets$/)[1];
        return await getQuestionSets(env, subjectCode, corsHeaders);
      }

      // 音声アップロード API（R2使用）
      if (path === '/api/upload/audio' && request.method === 'POST') {
        return await uploadAudio(request, env, user, corsHeaders);
      }

      // 音声ファイル一覧取得
      if (path === '/api/audio/files' && request.method === 'GET') {
        return await listAudioFiles(env, corsHeaders);
      }

      return jsonResponse({ error: 'エンドポイントが見つかりません' }, 404, corsHeaders);

    } catch (error) {
      console.error('Workers エラー:', error);
      return jsonResponse({ 
        error: 'サーバーエラーが発生しました',
        details: error.message 
      }, 500, corsHeaders);
    }
  }
};

// ユーザー認証
async function authenticateUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: '認証ヘッダーが必要です', status: 401 };
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    // JWT検証
    const isValid = await verify(token, env.JWT_SECRET);
    if (!isValid) {
      return { success: false, error: 'トークンが無効です', status: 401 };
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // セッション確認
    const session = await env.TESTAPP_DB.prepare(
      'SELECT s.*, u.* FROM user_sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = ? AND s.expires_at > datetime("now")'
    ).bind(token).first();

    if (!session) {
      return { success: false, error: 'セッションが無効です', status: 401 };
    }

    return { 
      success: true, 
      user: {
        id: session.user_id,
        username: session.username,
        email: session.email,
        display_name: session.display_name,
        is_admin: session.is_admin
      }
    };
  } catch (error) {
    return { success: false, error: '認証エラー', status: 401 };
  }
}

// ユーザーログイン
async function loginUser(request, env, corsHeaders) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return jsonResponse({ error: 'ユーザー名とパスワードが必要です' }, 400, corsHeaders);
    }

    // ユーザー検索
    const user = await env.TESTAPP_DB.prepare(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE'
    ).bind(username).first();

    if (!user) {
      return jsonResponse({ error: 'ユーザー名またはパスワードが間違っています' }, 401, corsHeaders);
    }

    // パスワード検証（実際の実装では bcrypt 等を使用）
    // 簡易実装のため平文比較（本番では適切なハッシュ化が必要）
    if (password !== 'admin123') { // 仮のパスワード
      return jsonResponse({ error: 'ユーザー名またはパスワードが間違っています' }, 401, corsHeaders);
    }

    // JWT生成
    const payload = {
      userId: user.id,
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24時間
    };

    const token = await sign(payload, env.JWT_SECRET);

    // セッション保存
    await env.TESTAPP_DB.prepare(
      'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, datetime("now", "+24 hours"))'
    ).bind(user.id, token).run();

    return jsonResponse({
      success: true,
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        is_admin: user.is_admin
      }
    }, 200, corsHeaders);

  } catch (error) {
    console.error('ログインエラー:', error);
    return jsonResponse({ 
      error: 'ログインに失敗しました',
      details: error.message 
    }, 500, corsHeaders);
  }
}

// ユーザー登録
async function registerUser(request, env, corsHeaders) {
  try {
    const { username, email, password, displayName } = await request.json();
    
    if (!username || !email || !password) {
      return jsonResponse({ error: '必須項目が入力されていません' }, 400, corsHeaders);
    }

    // 重複チェック
    const existingUser = await env.TESTAPP_DB.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).bind(username, email).first();

    if (existingUser) {
      return jsonResponse({ error: 'ユーザー名またはメールアドレスが既に使用されています' }, 409, corsHeaders);
    }

    // ユーザー作成（実際の実装では bcrypt でパスワードハッシュ化）
    const result = await env.TESTAPP_DB.prepare(
      'INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)'
    ).bind(username, email, password, displayName || username).run();

    return jsonResponse({
      success: true,
      message: 'ユーザー登録が完了しました',
      userId: result.meta.last_row_id
    }, 201, corsHeaders);

  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    return jsonResponse({ 
      error: 'ユーザー登録に失敗しました',
      details: error.message 
    }, 500, corsHeaders);
  }
}

// ユーザープロフィール取得
async function getUserProfile(user, corsHeaders) {
  return jsonResponse({
    user: user
  }, 200, corsHeaders);
}

// 科目一覧取得
async function getSubjects(env, corsHeaders) {
  try {
    const subjects = await env.TESTAPP_DB.prepare(
      'SELECT * FROM subjects WHERE is_active = TRUE ORDER BY id'
    ).all();

    return jsonResponse({
      subjects: subjects.results
    }, 200, corsHeaders);

  } catch (error) {
    console.error('科目一覧取得エラー:', error);
    return jsonResponse({ 
      error: '科目一覧の取得に失敗しました',
      details: error.message 
    }, 500, corsHeaders);
  }
}

// 問題保存機能（D1使用）
async function saveQuestions(request, env, user, subjectCode, corsHeaders) {
  try {
    const { questions, title } = await request.json();
    
    if (!questions || !Array.isArray(questions)) {
      return jsonResponse({ error: '無効な問題データです' }, 400, corsHeaders);
    }

    // 科目取得
    const subject = await env.TESTAPP_DB.prepare(
      'SELECT id FROM subjects WHERE code = ? AND is_active = TRUE'
    ).bind(subjectCode).first();

    if (!subject) {
      return jsonResponse({ error: '科目が見つかりません' }, 404, corsHeaders);
    }

    // トランザクション開始
    const questionSetResult = await env.TESTAPP_DB.prepare(
      'INSERT INTO question_sets (subject_id, title, created_by) VALUES (?, ?, ?)'
    ).bind(subject.id, title || `${subjectCode}問題セット`, user.id).run();

    const questionSetId = questionSetResult.meta.last_row_id;

    // 個別の問題を保存
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      await env.TESTAPP_DB.prepare(
        'INSERT INTO questions (question_set_id, question_text, question_data, correct_answer, explanation, order_index) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        questionSetId,
        question.question || question.text || '',
        JSON.stringify(question),
        question.answer || '',
        question.explanation || '',
        i
      ).run();
    }

    return jsonResponse({
      success: true,
      questionSetId: questionSetId,
      count: questions.length,
      timestamp: new Date().toISOString()
    }, 200, corsHeaders);

  } catch (error) {
    console.error('問題保存エラー:', error);
    return jsonResponse({ 
      error: '問題の保存に失敗しました',
      details: error.message 
    }, 500, corsHeaders);
  }
}

// 問題取得機能（最新セット）
async function loadQuestions(env, subjectCode, corsHeaders) {
  try {
    // 科目取得
    const subject = await env.TESTAPP_DB.prepare(
      'SELECT id FROM subjects WHERE code = ? AND is_active = TRUE'
    ).bind(subjectCode).first();

    if (!subject) {
      return jsonResponse({ error: '科目が見つかりません' }, 404, corsHeaders);
    }

    // 最新の問題セット取得
    const questionSet = await env.TESTAPP_DB.prepare(
      'SELECT * FROM question_sets WHERE subject_id = ? AND is_active = TRUE ORDER BY created_at DESC LIMIT 1'
    ).bind(subject.id).first();

    if (!questionSet) {
      return jsonResponse({ 
        questions: [], 
        metadata: null,
        message: `${subjectCode}の問題データが見つかりません`
      }, 200, corsHeaders);
    }

    // 問題一覧取得
    const questions = await env.TESTAPP_DB.prepare(
      'SELECT * FROM questions WHERE question_set_id = ? ORDER BY order_index'
    ).bind(questionSet.id).all();

    return jsonResponse({
      questions: questions.results.map(q => ({
        ...JSON.parse(q.question_data || '{}'),
        id: q.id
      })),
      metadata: {
        setId: questionSet.id,
        title: questionSet.title,
        created_at: questionSet.created_at,
        count: questions.results.length
      }
    }, 200, corsHeaders);

  } catch (error) {
    console.error('問題取得エラー:', error);
    return jsonResponse({ 
      error: '問題の取得に失敗しました',
      details: error.message 
    }, 500, corsHeaders);
  }
}

// 問題セット一覧取得
async function getQuestionSets(env, subjectCode, corsHeaders) {
  try {
    const sets = await env.TESTAPP_DB.prepare(`
      SELECT qs.*, s.name as subject_name, u.display_name as creator_name,
             COUNT(q.id) as question_count
      FROM question_sets qs
      JOIN subjects s ON qs.subject_id = s.id
      JOIN users u ON qs.created_by = u.id
      LEFT JOIN questions q ON qs.id = q.question_set_id
      WHERE s.code = ? AND qs.is_active = TRUE
      GROUP BY qs.id
      ORDER BY qs.created_at DESC
    `).bind(subjectCode).all();

    return jsonResponse({
      sets: sets.results
    }, 200, corsHeaders);

  } catch (error) {
    console.error('問題セット一覧取得エラー:', error);
    return jsonResponse({ 
      error: '問題セット一覧の取得に失敗しました',
      details: error.message 
    }, 500, corsHeaders);
  }
}

// 音声アップロード機能（R2使用）
async function uploadAudio(request, env, user, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio');
    
    if (!file) {
      return jsonResponse({ error: 'ファイルが選択されていません' }, 400, corsHeaders);
    }

    // ファイル名生成
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const extension = file.name.split('.').pop();
    const filename = `assets/audio/${timestamp}_${randomId}.${extension}`;

    // R2にアップロード
    await env.QUESTA_BUCKET.put(filename, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        'original-name': file.name,
        'uploaded-by': user.username,
        'timestamp': timestamp.toString()
      }
    });

    // D1にメタデータ保存
    await env.TESTAPP_DB.prepare(
      'INSERT INTO audio_files (filename, original_name, r2_key, file_size, mime_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(filename, file.name, filename, file.size, file.type, user.id).run();

    const publicUrl = `https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/${filename}`;

    return jsonResponse({
      success: true,
      filename: filename,
      url: publicUrl,
      originalName: file.name,
      size: file.size,
      uploadedAt: new Date(timestamp).toISOString()
    }, 200, corsHeaders);

  } catch (error) {
    console.error('音声アップロードエラー:', error);
    return jsonResponse({ 
      error: 'ファイルのアップロードに失敗しました',
      details: error.message 
    }, 500, corsHeaders);
  }
}

// 音声ファイル一覧取得（D1から）
async function listAudioFiles(env, corsHeaders) {
  try {
    const audioFiles = await env.TESTAPP_DB.prepare(`
      SELECT af.*, u.display_name as uploader_name
      FROM audio_files af
      JOIN users u ON af.uploaded_by = u.id
      ORDER BY af.uploaded_at DESC
      LIMIT 100
    `).all();

    const files = audioFiles.results.map(file => ({
      id: file.id,
      filename: file.filename,
      originalName: file.original_name,
      url: `https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/${file.r2_key}`,
      size: file.file_size,
      mimeType: file.mime_type,
      uploadedAt: file.uploaded_at,
      uploaderName: file.uploader_name
    }));

    return jsonResponse({ files }, 200, corsHeaders);

  } catch (error) {
    console.error('音声ファイル一覧取得エラー:', error);
    return jsonResponse({ 
      error: '音声ファイル一覧の取得に失敗しました',
      details: error.message 
    }, 500, corsHeaders);
  }
}

// JSONレスポンス生成ヘルパー
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}
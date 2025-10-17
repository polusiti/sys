/**
 * Cloudflare Workers - Learning Notebook Complete Integration
 * 統合されたD1 API - 既存機能 + Learning Notebook固有機能
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
          service: 'learning-notebook-complete-api',
          database: 'connected',
          timestamp: new Date().toISOString()
        }, 200, corsHeaders);
      }

      // 学習ノート問題取得（認証不要）
      if (path === '/api/note/questions' && request.method === 'GET') {
        return await getNoteQuestions(request, env, corsHeaders);
      }

      // 学習ノート問題作成（認証不要）
      if (path === '/api/note/questions' && request.method === 'POST') {
        return await createNoteQuestion(request, env, corsHeaders);
      }

      // 学習ノート問題更新（認証不要）
      if (path.match(/^\/api\/note\/questions\/[\w\-]+$/) && request.method === 'PUT') {
        const questionId = path.split('/').pop();
        return await updateNoteQuestion(questionId, request, env, corsHeaders);
      }

      // 学習ノート問題削除（認証不要）
      if (path.match(/^\/api\/note\/questions\/[\w\-]+$/) && request.method === 'DELETE') {
        const questionId = path.split('/').pop();
        return await deleteNoteQuestion(questionId, env, corsHeaders);
      }

      // 音声アップロード（認証不要・簡易版）
      if (path === '/api/upload' && request.method === 'POST') {
        return await uploadAudioSimple(request, env, corsHeaders);
      }

      // === 認証エンドポイント ===

      // Learning Notebook形式ユーザー登録
      if (path === '/api/auth/register' && request.method === 'POST') {
        return await handleLearningNotebookRegister(request, env, corsHeaders);
      }

      // 従来型ユーザー登録（後方互換性）
      if (path === '/api/auth/register-legacy' && request.method === 'POST') {
        return await registerUserLegacy(request, env, corsHeaders);
      }

      // 従来型ログイン（後方互換性）
      if (path === '/api/auth/login' && request.method === 'POST') {
        return await loginUserLegacy(request, env, corsHeaders);
      }

      // パスキー登録開始
      if (path === '/api/auth/passkey/register/begin' && request.method === 'POST') {
        return await handlePasskeyRegisterBegin(request, env, corsHeaders);
      }

      // パスキー登録完了
      if (path === '/api/auth/passkey/register/complete' && request.method === 'POST') {
        return await handlePasskeyRegisterComplete(request, env, corsHeaders);
      }

      // パスキーログイン開始
      if (path === '/api/auth/passkey/login/begin' && request.method === 'POST') {
        return await handlePasskeyLoginBegin(request, env, corsHeaders);
      }

      // パスキーログイン完了
      if (path === '/api/auth/passkey/login/complete' && request.method === 'POST') {
        return await handlePasskeyLoginComplete(request, env, corsHeaders);
      }

      // ユーザー情報取得
      if (path === '/api/auth/me' && request.method === 'GET') {
        return await handleGetUser(request, env, corsHeaders);
      }

      // === 進捗トラッキングエンドポイント ===

      // 進捗取得
      if (path === '/api/note/progress' && request.method === 'GET') {
        return await handleGetProgress(request, env, corsHeaders);
      }

      // 進捗保存
      if (path === '/api/note/progress' && request.method === 'POST') {
        return await handleSaveProgress(request, env, corsHeaders);
      }

      // === 保護されたエンドポイント - JWT認証チェック ===
      const authResult = await authenticateUser(request, env);
      if (!authResult.success) {
        return jsonResponse({ error: authResult.error }, authResult.status, corsHeaders);
      }

      const user = authResult.user;

      // ユーザープロフィール取得
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

// === Learning Notebook 固有の認証機能 ===

// Learning Notebook形式ユーザー登録
async function handleLearningNotebookRegister(request, env, corsHeaders) {
  try {
    const { userId, displayName } = await request.json();

    if (!userId || !displayName) {
      return jsonResponse({
        error: 'ユーザーIDと表示名が必要です'
      }, 400, corsHeaders);
    }

    // ユーザー名の検証（3文字以上、英数字のみ）
    if (!/^[a-zA-Z0-9_-]{3,}$/.test(userId)) {
      return jsonResponse({
        error: 'ユーザーIDは3文字以上の英数字、ハイフン、アンダースコアのみ使用可能です'
      }, 400, corsHeaders);
    }

    // ユーザーIDと表示名の重複チェック
    const existingUser = await env.TESTAPP_DB.prepare(
      'SELECT id FROM users WHERE username = ? OR display_name = ?'
    ).bind(userId, displayName).first();

    if (existingUser) {
      return jsonResponse({
        error: 'このユーザーIDまたは表示名は既に使用されています'
      }, 409, corsHeaders);
    }

    // 一意のお問い合わせ番号を自動生成
    const inquiryNumber = await generateUniqueInquiryNumber(env.TESTAPP_DB);

    // ユーザー作成
    const result = await env.TESTAPP_DB.prepare(
      'INSERT INTO users (username, email, password_hash, display_name, inquiry_number, email_verified, created_at) VALUES (?, ?, ?, ?, ?, 0, datetime("now"))'
    ).bind(userId, `${userId}@ln.local`, 'ln-passkey-auth', displayName, inquiryNumber).run();

    return jsonResponse({
      success: true,
      message: 'ユーザー登録が完了しました',
      userId: result.meta.last_row_id,
      user: {
        id: result.meta.last_row_id,
        userId: userId,
        displayName: displayName,
        inquiryNumber: inquiryNumber
      }
    }, 201, corsHeaders);

  } catch (error) {
    console.error('Learning Notebook登録エラー:', error);
    return jsonResponse({
      error: 'ユーザー登録に失敗しました',
      details: error.message
    }, 500, corsHeaders);
  }
}

// パスキー登録開始
async function handlePasskeyRegisterBegin(request, env, corsHeaders) {
  try {
    const { userId, requestHost } = await request.json();

    if (!userId) {
      return jsonResponse({
        error: 'ユーザーIDが必要です'
      }, 400, corsHeaders);
    }

    // ユーザー検証
    const user = await env.TESTAPP_DB.prepare(
      'SELECT * FROM users WHERE username = ? OR display_name = ? OR id = ?'
    ).bind(userId, userId, userId).first();

    if (!user) {
      return jsonResponse({
        error: 'ユーザーが見つかりません。まずユーザー登録を行ってください'
      }, 404, corsHeaders);
    }

    // WebAuthn challenge生成
    const challenge = generateChallenge();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5分

    // ChallengeをD1に保存
    await env.TESTAPP_DB.prepare(
      'INSERT INTO webauthn_challenges (challenge, user_id, operation_type, expires_at) VALUES (?, ?, "registration", ?)'
    ).bind(challenge, user.id, expiresAt).run();

    // 既存のクレデンシャルを取得
    const existingCredentials = await env.TESTAPP_DB.prepare(
      'SELECT credential_id FROM webauthn_credentials WHERE user_id = ?'
    ).bind(user.id).all();

    const allowCredentials = (existingCredentials.results || []).map(cred => ({
      id: cred.credential_id,
      type: 'public-key'
    }));

    // 動的RPID設定: requestHostが提供されていればそれを使用、なければデフォルト
    let rpId = env.RP_ID || 'questa-r2-api.t88596565.workers.dev';
    if (requestHost && requestHost !== 'localhost' && requestHost !== '127.0.0.1') {
      // Workers.devドメインの場合は登録可能ドメインサフィックスに変換
      if (requestHost.includes('.workers.dev')) {
        // フルドメインを使用
        rpId = requestHost;
      } else if (requestHost.includes('.pages.dev')) {
        // Cloudflare Pagesの場合
        rpId = requestHost;
      }
    }

    const publicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: {
        name: 'Learning Notebook',
        id: rpId
      },
      user: {
        id: user.id.toString(),
        name: user.username,
        displayName: user.display_name
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred"
      },
      timeout: 60000,
      excludeCredentials: allowCredentials
    };

    return jsonResponse(publicKeyCredentialCreationOptions, 200, corsHeaders);

  } catch (error) {
    console.error('パスキー登録開始エラー:', error);
    return jsonResponse({
      error: 'パスキー登録開始に失敗しました'
    }, 500, corsHeaders);
  }
}

// パスキー登録完了
async function handlePasskeyRegisterComplete(request, env, corsHeaders) {
  try {
    const { credential, challenge, userId } = await request.json();

    // Challenge検証
    const challengeRecord = await env.TESTAPP_DB.prepare(
      'SELECT * FROM webauthn_challenges WHERE challenge = ? AND user_id = ? AND operation_type = "registration" AND used = 0 AND expires_at > datetime("now")'
    ).bind(challenge, userId).first();

    if (!challengeRecord) {
      return jsonResponse({
        error: 'チャレンジが無効または期限切れです'
      }, 400, corsHeaders);
    }

    // Challengeをマーク済みに
    await env.TESTAPP_DB.prepare(
      'UPDATE webauthn_challenges SET used = 1 WHERE id = ?'
    ).bind(challengeRecord.id).run();

    // クライアント検証
    const clientDataJSON = JSON.parse(
      new TextDecoder().decode(base64ToArrayBuffer(credential.response.clientDataJSON))
    );

    if (clientDataJSON.type !== 'webauthn.create') {
      return jsonResponse({
        error: '無効な認証情報です'
      }, 400, corsHeaders);
    }

    if (clientDataJSON.challenge !== challenge) {
      return jsonResponse({
        error: 'チャレンジが一致しません'
      }, 400, corsHeaders);
    }

    // WebAuthnクレデンシャルの保存
    await env.TESTAPP_DB.prepare(
      'INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, device_type, authenticator_attachment, created_at) VALUES (?, ?, ?, 0, "platform", "platform", datetime("now"))'
    ).bind(userId, credential.id, credential.response.attestationObject).run();

    return jsonResponse({
      success: true,
      message: 'パスキーが登録されました',
      credentialId: credential.id
    }, 200, corsHeaders);

  } catch (error) {
    console.error('パスキー登録完了エラー:', error);
    return jsonResponse({
      error: 'パスキー登録完了に失敗しました'
    }, 500, corsHeaders);
  }
}

// パスキーログイン開始
async function handlePasskeyLoginBegin(request, env, corsHeaders) {
  try {
    const { userId, requestHost } = await request.json();

    if (!userId) {
      return jsonResponse({
        error: 'ユーザーIDが必要です'
      }, 400, corsHeaders);
    }

    // ユーザー検証
    const user = await env.TESTAPP_DB.prepare(
      'SELECT * FROM users WHERE username = ? OR display_name = ? OR id = ?'
    ).bind(userId, userId, userId).first();

    if (!user) {
      return jsonResponse({
        error: 'ユーザーが見つかりません。まずユーザー登録を行ってください'
      }, 404, corsHeaders);
    }

    // ユーザーのクレデンシャル取得
    const credentials = await env.TESTAPP_DB.prepare(
      'SELECT credential_id FROM webauthn_credentials WHERE user_id = ?'
    ).bind(user.id).all();

    if (!credentials.results || credentials.results.length === 0) {
      return jsonResponse({
        error: 'このユーザーはパスキーを登録していません'
      }, 404, corsHeaders);
    }

    // Challenge生成
    const challenge = generateChallenge();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5分

    // Challengeを保存
    await env.TESTAPP_DB.prepare(
      'INSERT INTO webauthn_challenges (challenge, user_id, operation_type, expires_at) VALUES (?, ?, "authentication", ?)'
    ).bind(challenge, user.id, expiresAt).run();

    const allowCredentials = credentials.results.map(cred => ({
      id: cred.credential_id,
      type: 'public-key'
    }));

    // 動的RPID設定: requestHostが提供されていればそれを使用、なければデフォルト
    let rpId = env.RP_ID || 'questa-r2-api.t88596565.workers.dev';
    if (requestHost && requestHost !== 'localhost' && requestHost !== '127.0.0.1') {
      // Workers.devドメインの場合は登録可能ドメインサフィックスに変換
      if (requestHost.includes('.workers.dev')) {
        // フルドメインを使用
        rpId = requestHost;
      } else if (requestHost.includes('.pages.dev')) {
        // Cloudflare Pagesの場合
        rpId = requestHost;
      }
    }

    const publicKeyCredentialRequestOptions = {
      challenge: challenge,
      timeout: 60000,
      rpId: rpId,
      allowCredentials: allowCredentials,
      userVerification: "preferred"
    };

    return jsonResponse(publicKeyCredentialRequestOptions, 200, corsHeaders);

  } catch (error) {
    console.error('パスキー認証開始エラー:', error);
    return jsonResponse({
      error: 'パスキー認証開始に失敗しました'
    }, 500, corsHeaders);
  }
}

// パスキーログイン完了
async function handlePasskeyLoginComplete(request, env, corsHeaders) {
  try {
    const { credential, challenge, userId } = await request.json();

    // Challenge検証
    const challengeRecord = await env.TESTAPP_DB.prepare(
      'SELECT * FROM webauthn_challenges WHERE challenge = ? AND operation_type = "authentication" AND used = 0 AND expires_at > datetime("now")'
    ).bind(challenge).first();

    if (!challengeRecord) {
      return jsonResponse({
        error: 'チャレンジが無効または期限切れです'
      }, 400, corsHeaders);
    }

    // Challengeをマーク済みに
    await env.TESTAPP_DB.prepare(
      'UPDATE webauthn_challenges SET used = 1 WHERE id = ?'
    ).bind(challengeRecord.id).run();

    // クレデンシャルの取得
    const storedCredential = await env.TESTAPP_DB.prepare(
      'SELECT * FROM webauthn_credentials WHERE credential_id = ?'
    ).bind(credential.id).first();

    if (!storedCredential) {
      return jsonResponse({
        error: 'クレデンシャルが見つかりません'
      }, 404, corsHeaders);
    }

    // クライアント検証（基本検証）
    const clientDataJSON = JSON.parse(
      new TextDecoder().decode(base64ToArrayBuffer(credential.response.clientDataJSON))
    );

    if (clientDataJSON.type !== 'webauthn.get') {
      return jsonResponse({
        error: '無効な認証情報です'
      }, 400, corsHeaders);
    }

    if (clientDataJSON.challenge !== challenge) {
      return jsonResponse({
        error: 'チャレンジが一致しません'
      }, 400, corsHeaders);
    }

    // ユーザー情報を取得
    const user = await env.TESTAPP_DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(storedCredential.user_id).first();

    // クレデンシャル使用状況を更新
    await env.TESTAPP_DB.prepare(
      'UPDATE webauthn_credentials SET last_used = datetime("now"), use_count = use_count + 1 WHERE id = ?'
    ).bind(storedCredential.id).run();

    // ログイン情報を更新
    await env.TESTAPP_DB.prepare(
      'UPDATE users SET last_login = datetime("now"), login_count = COALESCE(login_count, 0) + 1 WHERE id = ?'
    ).bind(storedCredential.user_id).run();

    // セッショントークン生成
    const sessionToken = generateSessionToken();
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7日

    await env.TESTAPP_DB.prepare(
      'INSERT INTO user_sessions (user_id, session_token, expires_at, created_at, data) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      storedCredential.user_id,
      sessionToken,
      sessionExpiry,
      new Date().toISOString(),
      JSON.stringify({
        userId: storedCredential.user_id,
        displayName: user.display_name,
        loginTime: Date.now()
      })
    ).run();

    return jsonResponse({
      success: true,
      sessionToken: sessionToken,
      user: {
        id: storedCredential.user_id,
        userId: user.username,
        displayName: user.display_name
      }
    }, 200, corsHeaders);

  } catch (error) {
    console.error('パスキー認証完了エラー:', error);
    return jsonResponse({
      error: 'パスキー認証完了に失敗しました'
    }, 500, corsHeaders);
  }
}

// ユーザー情報取得
async function handleGetUser(request, env, corsHeaders) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: '認証ヘッダーが必要です' }, 401, corsHeaders);
    }

    const token = authHeader.replace('Bearer ', '');

    // セッション確認
    const session = await env.TESTAPP_DB.prepare(
      'SELECT s.*, u.* FROM user_sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = ? AND s.expires_at > datetime("now")'
    ).bind(token).first();

    if (!session) {
      return jsonResponse({ error: 'セッションが無効です' }, 401, corsHeaders);
    }

    const userData = JSON.parse(session.data || '{}');

    return jsonResponse({
      success: true,
      user: {
        id: session.user_id,
        userId: session.username,
        displayName: session.display_name,
        inquiryNumber: session.inquiry_number,
        emailVerified: session.email_verified,
        createdAt: session.created_at,
        lastLogin: session.last_login,
        loginCount: session.login_count || 0
      }
    }, 200, corsHeaders);

  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    return jsonResponse({
      error: 'ユーザー情報の取得に失敗しました'
    }, 500, corsHeaders);
  }
}

// === 進捗トラッキング機能 ===

// 進捗取得
async function handleGetProgress(request, env, corsHeaders) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: '認証ヘッダーが必要です' }, 401, corsHeaders);
    }

    const token = authHeader.replace('Bearer ', '');

    // セッションからユーザー情報を取得
    const session = await env.TESTAPP_DB.prepare(
      'SELECT s.*, u.* FROM user_sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = ? AND s.expires_at > datetime("now")'
    ).bind(token).first();

    if (!session) {
      return jsonResponse({ error: 'セッションが無効です' }, 401, corsHeaders);
    }

    // D1から進捗データを取得
    const progress = await env.TESTAPP_DB.prepare(
      'SELECT * FROM user_progress WHERE user_id = ? ORDER BY updated_at DESC'
    ).bind(session.user_id).all();

    return jsonResponse({
      success: true,
      progress: progress.results || [],
      user: {
        id: session.user_id,
        displayName: session.display_name
      }
    }, 200, corsHeaders);

  } catch (error) {
    console.error('進捗取得エラー:', error);
    return jsonResponse({
      error: '進捗の取得に失敗しました',
      details: error.message
    }, 500, corsHeaders);
  }
}

// 進捗保存
async function handleSaveProgress(request, env, corsHeaders) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: '認証ヘッダーが必要です' }, 401, corsHeaders);
    }

    const token = authHeader.replace('Bearer ', '');

    // セッションからユーザー情報を取得
    const session = await env.TESTAPP_DB.prepare(
      'SELECT s.*, u.* FROM user_sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = ? AND s.expires_at > datetime("now")'
    ).bind(token).first();

    if (!session) {
      return jsonResponse({ error: 'セッションが無効です' }, 401, corsHeaders);
    }

    const { subject, score, totalQuestions, duration } = await request.json();

    if (!subject || score === undefined || !totalQuestions) {
      return jsonResponse({
        error: '必須項目が入力されていません'
      }, 400, corsHeaders);
    }

    // 正解率計算
    const accuracy = Math.round((score / totalQuestions) * 100 * 100) / 100;

    // 進捗を更新または作成
    await env.TESTAPP_DB.prepare(`
      INSERT INTO user_progress (user_id, subject, total_questions, correct_answers, best_score, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, subject) DO UPDATE SET
        total_questions = total_questions + excluded.total_questions,
        correct_answers = correct_answers + excluded.correct_answers,
        best_score = CASE WHEN best_score < excluded.best_score THEN excluded.best_score ELSE best_score END,
        updated_at = datetime('now')
    `).bind(session.user_id, subject, totalQuestions, score, score).run();

    // 学習セッションを記録
    await env.TESTAPP_DB.prepare(`
      INSERT INTO study_sessions (user_id, subject, score, total_questions, accuracy, duration_minutes, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(session.user_id, subject, score, totalQuestions, accuracy, duration || 0).run();

    return jsonResponse({
      success: true,
      message: '進捗を保存しました',
      accuracy: accuracy
    }, 200, corsHeaders);

  } catch (error) {
    console.error('進捗保存エラー:', error);
    return jsonResponse({
      error: '進捗の保存に失敗しました',
      details: error.message
    }, 500, corsHeaders);
  }
}

// === 後方互換性のための関数 ===

// 従来型ユーザーログイン
async function loginUserLegacy(request, env, corsHeaders) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return jsonResponse({ error: 'ユーザー名とパスワードが必要です' }, 400, corsHeaders);
    }

    // ユーザー検索（is_activeカラムを参照しない）
    const user = await env.TESTAPP_DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).first();

    if (!user) {
      return jsonResponse({ error: 'ユーザー名またはパスワードが間違っています' }, 401, corsHeaders);
    }

    // 簡易パスワード検証（実際の実装では適切なハッシュ化が必要）
    if (password !== 'admin123') {
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
      'INSERT INTO user_sessions (user_id, session_token, expires_at, created_at) VALUES (?, ?, datetime("now", "+24 hours"), ?)'
    ).bind(user.id, token, new Date().toISOString()).run();

    return jsonResponse({
      success: true,
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name
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

// 従来型ユーザー登録
async function registerUserLegacy(request, env, corsHeaders) {
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

    // ユーザー作成
    const result = await env.TESTAPP_DB.prepare(
      'INSERT INTO users (username, email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, datetime("now"))'
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

// === 既存の関数（後方互換性のため） ===

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
        is_admin: session.is_admin || 0
      }
    };
  } catch (error) {
    return { success: false, error: '認証エラー', status: 401 };
  }
}

// 以下、既存の関数をそのまま利用...

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

// 学習ノート問題取得
async function getNoteQuestions(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const subject = url.searchParams.get('subject');
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const level = url.searchParams.get('level');

    let query = 'SELECT * FROM note_questions WHERE is_deleted = 0';
    const params = [];

    if (subject) {
      query += ' AND subject = ?';
      params.push(subject);
    }

    if (level) {
      query += ' AND difficulty_level = ?';
      params.push(level);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await env.TESTAPP_DB.prepare(query).bind(...params).all();

    // JSONフィールドをパース
    const questions = result.results.map(q => ({
      ...q,
      choices: q.choices ? JSON.parse(q.choices) : null,
      media_urls: q.media_urls ? JSON.parse(q.media_urls) : null,
      tags: q.tags ? JSON.parse(q.tags) : null
    }));

    return jsonResponse({
      success: true,
      questions: questions,
      total: questions.length
    }, 200, corsHeaders);

  } catch (error) {
    console.error('問題取得エラー:', error);
    return jsonResponse({
      error: '問題の取得に失敗しました',
      details: error.message
    }, 500, corsHeaders);
  }
}

// 学習ノート問題作成
async function createNoteQuestion(request, env, corsHeaders) {
  try {
    const data = await request.json();

    const result = await env.TESTAPP_DB.prepare(`
      INSERT INTO note_questions (
        id, subject, title, question_text, correct_answer, source,
        word, is_listening, difficulty_level, mode, choices, media_urls,
        explanation, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.id,
      data.subject,
      data.title || '',
      data.question_text,
      data.correct_answer,
      data.source || 'learning-notebook',
      data.word || null,
      data.is_listening ? 1 : 0,
      data.difficulty_level || 'medium',
      data.mode || null,
      data.choices ? JSON.stringify(data.choices) : null,
      data.media_urls ? JSON.stringify(data.media_urls) : null,
      data.explanation || null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.created_at || new Date().toISOString(),
      new Date().toISOString()
    ).run();

    return jsonResponse({
      success: true,
      message: '問題を作成しました',
      questionId: data.id
    }, 201, corsHeaders);

  } catch (error) {
    console.error('問題作成エラー:', error);
    return jsonResponse({
      error: '問題の作成に失敗しました',
      details: error.message
    }, 500, corsHeaders);
  }
}

// 学習ノート問題更新
async function updateNoteQuestion(questionId, request, env, corsHeaders) {
  try {
    const data = await request.json();

    const updateFields = [];
    const params = [];

    if (data.title !== undefined) {
      updateFields.push('title = ?');
      params.push(data.title);
    }
    if (data.question_text !== undefined) {
      updateFields.push('question_text = ?');
      params.push(data.question_text);
    }
    if (data.correct_answer !== undefined) {
      updateFields.push('correct_answer = ?');
      params.push(data.correct_answer);
    }
    if (data.difficulty_level !== undefined) {
      updateFields.push('difficulty_level = ?');
      params.push(data.difficulty_level);
    }
    if (data.explanation !== undefined) {
      updateFields.push('explanation = ?');
      params.push(data.explanation);
    }
    if (data.choices !== undefined) {
      updateFields.push('choices = ?');
      params.push(JSON.stringify(data.choices));
    }
    if (data.media_urls !== undefined) {
      updateFields.push('media_urls = ?');
      params.push(JSON.stringify(data.media_urls));
    }
    if (data.word !== undefined) {
      updateFields.push('word = ?');
      params.push(data.word);
    }
    if (data.is_listening !== undefined) {
      updateFields.push('is_listening = ?');
      params.push(data.is_listening ? 1 : 0);
    }

    updateFields.push('updated_at = ?');
    params.push(new Date().toISOString());

    params.push(questionId);

    const query = `UPDATE note_questions SET ${updateFields.join(', ')} WHERE id = ?`;
    await env.TESTAPP_DB.prepare(query).bind(...params).run();

    return jsonResponse({
      success: true,
      message: '問題を更新しました'
    }, 200, corsHeaders);

  } catch (error) {
    console.error('問題更新エラー:', error);
    return jsonResponse({
      error: '問題の更新に失敗しました',
      details: error.message
    }, 500, corsHeaders);
  }
}

// 学習ノート問題削除（ソフトデリート）
async function deleteNoteQuestion(questionId, env, corsHeaders) {
  try {
    await env.TESTAPP_DB.prepare(
      'UPDATE note_questions SET is_deleted = 1, updated_at = ? WHERE id = ?'
    ).bind(new Date().toISOString(), questionId).run();

    return jsonResponse({
      success: true,
      message: '問題を削除しました'
    }, 200, corsHeaders);

  } catch (error) {
    console.error('問題削除エラー:', error);
    return jsonResponse({
      error: '問題の削除に失敗しました',
      details: error.message
    }, 500, corsHeaders);
  }
}

// 音声アップロード（認証不要・簡易版）
async function uploadAudioSimple(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const subject = formData.get('subject') || 'general';

    if (!file) {
      return jsonResponse({ error: 'ファイルが選択されていません' }, 400, corsHeaders);
    }

    // ファイル名生成
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const extension = file.name.split('.').pop();
    const filename = `assets/audio/${subject}/${timestamp}_${randomId}.${extension}`;

    // R2にアップロード
    await env.QUESTA_BUCKET.put(filename, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        'original-name': file.name,
        'subject': subject,
        'timestamp': timestamp.toString()
      }
    });

    const publicUrl = `https://pub-3e45f268c1214f3cb9503d996a985f3c.r2.dev/${filename}`;

    return jsonResponse({
      success: true,
      url: publicUrl,
      filename: filename,
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

// 既存の問題関連関数をそのまま利用...
async function saveQuestions(request, env, user, subjectCode, corsHeaders) {
  try {
    const { questions, title } = await request.json();

    if (!questions || !Array.isArray(questions)) {
      return jsonResponse({ error: '無効な問題データです' }, 400, corsHeaders);
    }

    const subject = await env.TESTAPP_DB.prepare(
      'SELECT id FROM subjects WHERE code = ? AND is_active = TRUE'
    ).bind(subjectCode).first();

    if (!subject) {
      return jsonResponse({ error: '科目が見つかりません' }, 404, corsHeaders);
    }

    const questionSetResult = await env.TESTAPP_DB.prepare(
      'INSERT INTO question_sets (subject_id, title, created_by) VALUES (?, ?, ?)'
    ).bind(subject.id, title || `${subjectCode}問題セット`, user.id).run();

    const questionSetId = questionSetResult.meta.last_row_id;

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

async function loadQuestions(env, subjectCode, corsHeaders) {
  try {
    const subject = await env.TESTAPP_DB.prepare(
      'SELECT id FROM subjects WHERE code = ? AND is_active = TRUE'
    ).bind(subjectCode).first();

    if (!subject) {
      return jsonResponse({
        questions: [],
        metadata: null,
        message: `${subjectCode}の問題データが見つかりません`
      }, 200, corsHeaders);
    }

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

async function uploadAudio(request, env, user, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio');

    if (!file) {
      return jsonResponse({ error: 'ファイルが選択されていません' }, 400, corsHeaders);
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const extension = file.name.split('.').pop();
    const filename = `assets/audio/${timestamp}_${randomId}.${extension}`;

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

    await env.TESTAPP_DB.prepare(
      'INSERT INTO audio_files (filename, original_name, r2_key, file_size, mime_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(filename, file.name, filename, file.size, file.type, user.id).run();

    const publicUrl = `https://pub-3e45f268c1214f3cb9503d996a985f3c.r2.dev/${filename}`;

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
      url: `https://pub-3e45f268c1214f3cb9503d996a985f3c.r2.dev/${file.r2_key}`,
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

// === ユーティリティ関数 ===

// 一意のお問い合わせ番号を生成する関数
async function generateUniqueInquiryNumber(db) {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 英数混合8桁の問い合わせ番号を生成 (例: LN7X9M2P)
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let inquiryNumber = 'LN'; // Learning Notebookの接頭辞

    for (let i = 0; i < 6; i++) {
      inquiryNumber += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // 重複チェック
    const existing = await db.prepare(
      'SELECT id FROM users WHERE inquiry_number = ?'
    ).bind(inquiryNumber).first();

    if (!existing) {
      return inquiryNumber;
    }
  }

  // 万が一重複が続く場合はタイムスタンプベースで生成
  const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
  return `LN${timestamp}`;
}

// WebAuthn utility functions
function generateChallenge() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function generateSessionToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary);
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
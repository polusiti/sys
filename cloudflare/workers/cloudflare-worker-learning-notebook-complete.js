/**
 * Cloudflare Workers - Learning Notebook Complete Integration
 * 統合されたD1 API - 既存機能 + Learning Notebook固有機能
 */

import { sign, verify } from '@tsndr/cloudflare-worker-jwt';

export default {
  async fetch(request, env, ctx) {
    // CORS設定
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // 許可するオリジンのリスト
    const allowedOrigins = [
      'https://allfrom0.top',
      'https://www.allfrom0.top',
      'https://api.allfrom0.top'
    ];

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'https://allfrom0.top',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // OPTIONSリクエスト（CORS preflight）
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const path = url.pathname;

      // 認証不要のエンドポイント
      if (path === '/api/health') {
        return jsonResponse({
          status: 'ok',
          service: 'learning-notebook-complete-api',
          database: 'connected',
          timestamp: new Date().toISOString(),
          version: '1.0.1-fixed',
          rpId: 'allfrom0.top'
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

      // パッセージ単位での問題取得（東大リスニング形式）
      if (path === '/api/note/passages' && request.method === 'GET') {
        return await getPassages(request, env, corsHeaders);
      }

      // パッセージ作成（複数問題をまとめて登録）
      if (path === '/api/note/passages' && request.method === 'POST') {
        return await createPassage(request, env, corsHeaders);
      }

      // 問題統計取得（認証不要）
      if (path === '/api/note/question-stats' && request.method === 'GET') {
        return await getQuestionStats(request, env, corsHeaders);
      }

      // 解答結果記録（認証不要）
      if (path === '/api/note/question-attempts' && request.method === 'POST') {
        return await recordQuestionAttempts(request, env, corsHeaders);
      }

      // 問題評価（認証不要）
      if (path === '/api/note/question-ratings' && request.method === 'POST') {
        return await rateQuestion(request, env, corsHeaders);
      }

      // 問題評価取得（認証不要）
      if (path === '/api/note/question-ratings' && request.method === 'GET') {
        return await getQuestionRatings(request, env, corsHeaders);
      }

      // === 英作文添削エンドポイント ===

      // 英作文添削リクエスト
      if (path === '/api/note/essay/correct' && request.method === 'POST') {
        return await correctEnglishEssay(request, env, corsHeaders);
      }

      // 英作文添削履歴取得（認証済みユーザー用）
      if (path === '/api/note/essay/history' && request.method === 'GET') {
        return await getEssayCorrectionHistory(request, env, corsHeaders);
      }

      // 英作文添削結果保存
      if (path === '/api/note/essay/save' && request.method === 'POST') {
        return await saveEssayCorrection(request, env, corsHeaders);
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

      // === リカバリーシステムエンドポイント ===

      // ユーザー用リカバリー要求
      if (path === '/api/recovery/request' && request.method === 'POST') {
        return await handleRecoveryRequest(request, env, corsHeaders);
      }

      // 管理者用: ユーザー情報取得
      if (path.startsWith('/api/admin/user/') && request.method === 'GET') {
        return await handleAdminGetUser(request, env, corsHeaders);
      }

      // 管理者用: リカバリー承認（パスキー削除）
      if (path === '/api/admin/recovery/approve' && request.method === 'POST') {
        return await handleAdminApproveRecovery(request, env, corsHeaders);
      }

      // 管理者用: リカバリー要求一覧
      if (path === '/api/admin/recovery/requests' && request.method === 'GET') {
        return await handleAdminGetRecoveryRequests(request, env, corsHeaders);
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

      // === 学習履歴・復習機能API（認証済み） ===

      // 学習セッション開始
      if (path === '/api/study/session/start' && request.method === 'POST') {
        return await handleStudySessionStart(request, env, corsHeaders);
      }

      // 学習セッション終了
      if (path === '/api/study/session/end' && request.method === 'POST') {
        return await handleStudySessionEnd(request, env, corsHeaders);
      }

      // 問題回答記録
      if (path === '/api/study/record' && request.method === 'POST') {
        return await handleStudyRecord(request, env, corsHeaders);
      }

      // 学習履歴取得
      if (path === '/api/study/history' && request.method === 'GET') {
        return await handleGetStudyHistory(request, env, corsHeaders);
      }

      // 学習統計取得
      if (path === '/api/study/stats' && request.method === 'GET') {
        return await handleGetStudyStats(request, env, corsHeaders);
      }

      // 間違えた問題取得（復習用）
      if (path === '/api/study/wrong-answers' && request.method === 'GET') {
        return await handleGetWrongAnswers(request, env, corsHeaders);
      }

      // 問題を「習得済み」にマーク
      if (path === '/api/study/wrong-answers/master' && request.method === 'POST') {
        return await handleMarkAsMastered(request, env, corsHeaders);
      }

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
    const { userId, displayName, secretAnswerHash } = await request.json();

    if (!userId || !displayName || !secretAnswerHash) {
      return jsonResponse({
        error: 'ユーザーID、表示名、秘密の質問の答えが必要です'
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

    // ユーザー作成（秘密の質問の答えのハッシュを保存）
    const result = await env.TESTAPP_DB.prepare(
      'INSERT INTO users (username, email, password_hash, display_name, secret_question, secret_answer_hash, email_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, datetime("now"))'
    ).bind(userId, `${userId}@ln.local`, 'ln-passkey-auth', displayName, 'あなたの好きなアニメキャラは？', secretAnswerHash).run();

    return jsonResponse({
      success: true,
      message: 'ユーザー登録が完了しました',
      userId: result.meta.last_row_id,
      user: {
        id: result.meta.last_row_id,
        userId: userId,
        displayName: displayName
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
    const { userId } = await request.json();

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

    // 固定RPID設定 - 常にメインドメインを使用
    let rpId = 'allfrom0.top';

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
    // リクエストボディは不要（空のJSONを期待）

    // Challenge生成（ユーザーIDなしでもOK）
    const challenge = generateChallenge();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5分

    // Challengeを保存（user_idはnull）
    await env.TESTAPP_DB.prepare(
      'INSERT INTO webauthn_challenges (challenge, user_id, operation_type, expires_at) VALUES (?, NULL, "authentication", ?)'
    ).bind(challenge, expiresAt).run();

    // 固定RPID設定 - 常にメインドメインを使用
    let rpId = 'allfrom0.top';

    const publicKeyCredentialRequestOptions = {
      challenge: challenge,
      timeout: 60000,
      rpId: rpId,
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
    const { assertion } = await request.json();

    // assertionの中身を展開
    const credential = assertion;
    const challenge = new TextDecoder().decode(
      base64ToArrayBuffer(credential.response.clientDataJSON)
    );
    const challengeMatch = JSON.parse(challenge).challenge;

    // Challenge検証
    const challengeRecord = await env.TESTAPP_DB.prepare(
      'SELECT * FROM webauthn_challenges WHERE challenge = ? AND operation_type = "authentication" AND used = 0 AND expires_at > datetime("now")'
    ).bind(challengeMatch).first();

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

    if (clientDataJSON.challenge !== challengeMatch) {
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

// === 学習履歴・復習機能のハンドラー ===

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

// パッセージ単位での問題取得（東大リスニング形式）
async function getPassages(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const subject = url.searchParams.get('subject');
    const passageId = url.searchParams.get('passageId');
    const limit = parseInt(url.searchParams.get('limit')) || 100;

    if (passageId) {
      // 特定のパッセージの全設問を取得
      const result = await env.TESTAPP_DB.prepare(
        'SELECT * FROM note_questions WHERE passage_id = ? AND is_deleted = 0 ORDER BY question_order ASC'
      ).bind(passageId).all();

      const questions = result.results.map(q => ({
        ...q,
        choices: q.choices ? JSON.parse(q.choices) : null,
        media_urls: q.media_urls ? JSON.parse(q.media_urls) : null,
        tags: q.tags ? JSON.parse(q.tags) : null
      }));

      return jsonResponse({
        success: true,
        passage_id: passageId,
        questions: questions,
        total: questions.length
      }, 200, corsHeaders);
    }

    // パッセージ一覧を取得（各パッセージの最初の問題のみ）
    let query = `
      SELECT DISTINCT passage_id, subject, title, media_urls, difficulty_level, created_at
      FROM note_questions
      WHERE is_deleted = 0 AND passage_id IS NOT NULL
    `;
    const params = [];

    if (subject) {
      query += ' AND subject = ?';
      params.push(subject);
    }

    query += ' GROUP BY passage_id ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const result = await env.TESTAPP_DB.prepare(query).bind(...params).all();

    const passages = await Promise.all(
      result.results.map(async (passage) => {
        // 各パッセージの問題数を取得
        const countResult = await env.TESTAPP_DB.prepare(
          'SELECT COUNT(*) as count FROM note_questions WHERE passage_id = ? AND is_deleted = 0'
        ).bind(passage.passage_id).first();

        return {
          passage_id: passage.passage_id,
          subject: passage.subject,
          title: passage.title,
          media_urls: passage.media_urls ? JSON.parse(passage.media_urls) : null,
          difficulty_level: passage.difficulty_level,
          question_count: countResult.count,
          created_at: passage.created_at
        };
      })
    );

    return jsonResponse({
      success: true,
      passages: passages,
      total: passages.length
    }, 200, corsHeaders);

  } catch (error) {
    console.error('パッセージ取得エラー:', error);
    return jsonResponse({
      error: 'パッセージの取得に失敗しました',
      details: error.message
    }, 500, corsHeaders);
  }
}

// パッセージ作成（複数問題をまとめて登録）
async function createPassage(request, env, corsHeaders) {
  try {
    const data = await request.json();

    if (!data.passage_id || !data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
      return jsonResponse({
        error: 'passage_idと問題配列が必要です'
      }, 400, corsHeaders);
    }

    // 各問題を登録
    for (let i = 0; i < data.questions.length; i++) {
      const question = data.questions[i];

      // 最初の問題にのみパッセージ全体の情報を保存
      const passageScript = (i === 0 && data.script) ? data.script : null;
      const passageExplanation = (i === 0 && data.overall_explanation) ? data.overall_explanation : null;

      await env.TESTAPP_DB.prepare(`
        INSERT INTO note_questions (
          id, subject, title, question_text, correct_answer, source,
          word, is_listening, difficulty_level, mode, choices, media_urls,
          explanation, tags, passage_id, question_order, passage_script, passage_explanation,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        question.id || `${data.passage_id}_q${i + 1}`,
        data.subject || 'english-listening',
        data.title || '',
        question.question_text,
        question.correct_answer,
        data.source || 'learning-notebook',
        question.word || null,
        1, // is_listening = true
        data.difficulty_level || 'listen_todai',
        'multiple_choice',
        question.choices ? JSON.stringify(question.choices) : null,
        data.media_urls ? JSON.stringify(data.media_urls) : null,
        question.explanation || null,
        question.tags ? JSON.stringify(question.tags) : null,
        data.passage_id,
        i + 1, // question_order
        passageScript,
        passageExplanation,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();
    }

    return jsonResponse({
      success: true,
      message: 'パッセージを作成しました',
      passage_id: data.passage_id,
      question_count: data.questions.length
    }, 201, corsHeaders);

  } catch (error) {
    console.error('パッセージ作成エラー:', error);
    return jsonResponse({
      error: 'パッセージの作成に失敗しました',
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

// === 統計・評価エンドポイント実装 ===

/**
 * Get question statistics
 */
async function getQuestionStats(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const ids = url.searchParams.get('ids');

    if (!ids) {
      return jsonResponse({
        success: false,
        error: 'Question IDs are required'
      }, 400, corsHeaders);
    }

    const questionIds = ids.split(',').map(id => id.trim()).filter(id => id);

    if (questionIds.length === 0) {
      return jsonResponse({
        success: false,
        error: 'Valid question IDs are required'
      }, 400, corsHeaders);
    }

    const placeholders = questionIds.map(() => '?').join(',');

    const { results } = await env.TESTAPP_DB.prepare(`
      SELECT
        question_id,
        selected_choice,
        COUNT(*) as choice_count,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count
      FROM question_attempts
      WHERE question_id IN (${placeholders})
      GROUP BY question_id, selected_choice
    `).bind(...questionIds).all();

    // 統計データを整形
    const statsMap = {};

    results.forEach(row => {
      if (!statsMap[row.question_id]) {
        statsMap[row.question_id] = {
          question_id: row.question_id,
          total_attempts: 0,
          correct_count: 0,
          choice_distribution: {}
        };
      }

      statsMap[row.question_id].total_attempts += row.choice_count;
      statsMap[row.question_id].correct_count += row.correct_count || 0;

      if (row.selected_choice !== null) {
        statsMap[row.question_id].choice_distribution[row.selected_choice] = row.choice_count;
      }
    });

    const stats = Object.values(statsMap);

    return jsonResponse({
      success: true,
      stats: stats
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Get question stats error:', error);
    return jsonResponse({
      error: 'Failed to get question statistics',
      details: error.message
    }, 500, corsHeaders);
  }
}

/**
 * Record question attempts
 */
async function recordQuestionAttempts(request, env, corsHeaders) {
  try {
    const authHeader = request.headers.get('Authorization');
    let userId = null;

    // 認証トークンがあればユーザーIDを取得（オプション）
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const session = await env.TESTAPP_DB.prepare(
          'SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > ?'
        ).bind(token, new Date().toISOString()).first();

        if (session) {
          userId = session.user_id;
        }
      } catch (e) {
        // Continue without userId
      }
    }

    const body = await request.json();
    const { attempts } = body;

    if (!attempts || !Array.isArray(attempts) || attempts.length === 0) {
      return jsonResponse({
        success: false,
        error: 'Attempts array is required'
      }, 400, corsHeaders);
    }

    const timestamp = new Date().toISOString();

    // バッチインサート
    const insertPromises = attempts.map(attempt => {
      return env.TESTAPP_DB.prepare(`
        INSERT INTO question_attempts
        (question_id, user_id, selected_choice, is_correct, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        attempt.question_id,
        userId,
        attempt.selected_choice !== undefined ? attempt.selected_choice : null,
        attempt.is_correct ? 1 : 0,
        timestamp
      ).run();
    });

    await Promise.all(insertPromises);

    return jsonResponse({
      success: true,
      message: 'Attempts recorded successfully',
      count: attempts.length
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Record question attempts error:', error);
    return jsonResponse({
      error: 'Failed to record question attempts',
      details: error.message
    }, 500, corsHeaders);
  }
}

/**
 * Rate question (thumbs up/down)
 */
async function rateQuestion(request, env, corsHeaders) {
  try {
    const authHeader = request.headers.get('Authorization');
    let userId = null;

    // 認証トークンがあればユーザーIDを取得（オプション）
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const session = await env.TESTAPP_DB.prepare(
          'SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > ?'
        ).bind(token, new Date().toISOString()).first();

        if (session) {
          userId = session.user_id;
        }
      } catch (e) {
        // Continue without userId
      }
    }

    const body = await request.json();
    const { question_id, rating } = body;

    if (!question_id) {
      return jsonResponse({
        success: false,
        error: 'question_id is required'
      }, 400, corsHeaders);
    }

    if (rating !== 1 && rating !== -1) {
      return jsonResponse({
        success: false,
        error: 'rating must be 1 (thumbs up) or -1 (thumbs down)'
      }, 400, corsHeaders);
    }

    const timestamp = new Date().toISOString();

    // UPSERTで既存の評価を更新または新規作成
    if (userId) {
      // ユーザー認証済みの場合は一意制約でUPSERT
      await env.TESTAPP_DB.prepare(`
        INSERT INTO question_ratings (question_id, user_id, rating, created_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(question_id, user_id)
        DO UPDATE SET rating = excluded.rating, created_at = excluded.created_at
      `).bind(question_id, userId, rating, timestamp).run();
    } else {
      // ゲストの場合は単純にINSERT
      await env.TESTAPP_DB.prepare(`
        INSERT INTO question_ratings (question_id, user_id, rating, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(question_id, null, rating, timestamp).run();
    }

    return jsonResponse({
      success: true,
      message: 'Rating recorded successfully'
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Rate question error:', error);
    return jsonResponse({
      error: 'Failed to rate question',
      details: error.message
    }, 500, corsHeaders);
  }
}

/**
 * Get question ratings
 */
async function getQuestionRatings(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const ids = url.searchParams.get('ids');

    if (!ids) {
      return jsonResponse({
        success: false,
        error: 'Question IDs are required'
      }, 400, corsHeaders);
    }

    const questionIds = ids.split(',').map(id => id.trim()).filter(id => id);

    if (questionIds.length === 0) {
      return jsonResponse({
        success: false,
        error: 'Valid question IDs are required'
      }, 400, corsHeaders);
    }

    const placeholders = questionIds.map(() => '?').join(',');

    const { results } = await env.TESTAPP_DB.prepare(`
      SELECT
        question_id,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as thumbs_up,
        SUM(CASE WHEN rating = -1 THEN 1 ELSE 0 END) as thumbs_down,
        COUNT(*) as total_ratings
      FROM question_ratings
      WHERE question_id IN (${placeholders})
      GROUP BY question_id
    `).bind(...questionIds).all();

    const ratingsMap = {};
    results.forEach(row => {
      ratingsMap[row.question_id] = {
        question_id: row.question_id,
        thumbs_up: row.thumbs_up || 0,
        thumbs_down: row.thumbs_down || 0,
        total_ratings: row.total_ratings || 0
      };
    });

    const ratings = Object.values(ratingsMap);

    return jsonResponse({
      success: true,
      ratings: ratings
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Get question ratings error:', error);
    return jsonResponse({
      error: 'Failed to get question ratings',
      details: error.message
    }, 500, corsHeaders);
  }
}

// ===== 手動リカバリーシステムAPI =====

/**
 * POST /api/recovery/request
 * ユーザーがリカバリーを申請
 */
async function handleRecoveryRequest(request, env, corsHeaders) {
  try {
    const { userId, secretAnswer, contactInfo, additionalInfo } = await request.json();

    if (!userId || !secretAnswer || !contactInfo) {
      return jsonResponse({
        success: false,
        error: 'ユーザーID、秘密の質問の答え、連絡先が必要です'
      }, 400, corsHeaders);
    }

    const clientIP = request.headers.get('CF-Connecting-IP') ||
                     request.headers.get('X-Forwarded-For')?.split(',')[0] ||
                     'unknown';

    // ユーザー検索
    const user = await env.TESTAPP_DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(userId).first();

    // リカバリー要求を保存（ユーザーが存在しない場合もnullで保存）
    await env.TESTAPP_DB.prepare(
      'INSERT INTO recovery_requests (user_id, username, secret_answer_provided, contact_info, additional_info, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      user?.id || null,
      userId,
      secretAnswer,
      contactInfo,
      additionalInfo || null,
      clientIP
    ).run();

    return jsonResponse({
      success: true,
      message: 'リカバリー申請を受け付けました。管理者が本人確認を行います。'
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Recovery request error:', error);
    return jsonResponse({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500, corsHeaders);
  }
}

/**
 * GET /api/admin/user/:userId
 * 管理者がユーザー情報を取得
 */
async function handleAdminGetUser(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    const user = await env.TESTAPP_DB.prepare(
      'SELECT id, username, display_name, secret_question, secret_answer_hash, created_at, last_login FROM users WHERE username = ?'
    ).bind(userId).first();

    if (!user) {
      return jsonResponse({
        success: false,
        error: 'ユーザーが見つかりません'
      }, 404, corsHeaders);
    }

    // パスキー数を取得
    const passkeyCount = await env.TESTAPP_DB.prepare(
      'SELECT COUNT(*) as count FROM webauthn_credentials WHERE user_id = ?'
    ).bind(user.id).first();

    return jsonResponse({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        secret_question: user.secret_question,
        secret_answer_hash: user.secret_answer_hash,
        created_at: user.created_at,
        last_login: user.last_login,
        passkey_count: passkeyCount.count
      }
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Admin get user error:', error);
    return jsonResponse({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500, corsHeaders);
  }
}

/**
 * POST /api/admin/recovery/approve
 * 管理者がリカバリーを承認（パスキー削除）
 */
async function handleAdminApproveRecovery(request, env, corsHeaders) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return jsonResponse({
        success: false,
        error: 'ユーザーIDが必要です'
      }, 400, corsHeaders);
    }

    // ユーザーのすべてのパスキーを削除
    const result = await env.TESTAPP_DB.prepare(
      'DELETE FROM webauthn_credentials WHERE user_id = ?'
    ).bind(userId).run();

    // セッションも削除
    await env.TESTAPP_DB.prepare(
      'DELETE FROM auth_sessions WHERE user_id = ?'
    ).bind(userId).run();

    return jsonResponse({
      success: true,
      message: `${result.meta.changes}個のパスキーを削除しました`,
      deletedCount: result.meta.changes
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Admin approve recovery error:', error);
    return jsonResponse({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500, corsHeaders);
  }
}

/**
 * GET /api/admin/recovery/requests?filter=pending|all
 * 管理者がリカバリー要求一覧を取得
 */
async function handleAdminGetRecoveryRequests(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'all';

    let query = 'SELECT * FROM recovery_requests';
    if (filter === 'pending') {
      query += ' WHERE status = "pending"';
    }
    query += ' ORDER BY requested_at DESC LIMIT 50';

    const requests = await env.TESTAPP_DB.prepare(query).all();

    return jsonResponse({
      success: true,
      requests: requests.results || []
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Admin get recovery requests error:', error);
    return jsonResponse({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500, corsHeaders);
  }
}

// ===== 英作文添削機能 =====

// DeepSeek APIを使った英作文添削
async function correctEnglishEssay(request, env, corsHeaders) {
  try {
    const { essay, level = 'intermediate', type = 'general' } = await request.json();

    if (!essay || essay.trim().length < 10) {
      return jsonResponse({
        success: false,
        error: '英文が短すぎます。10文字以上で入力してください。'
      }, 400, corsHeaders);
    }

    if (essay.length > 2000) {
      return jsonResponse({
        success: false,
        error: '英文が長すぎます。2000文字以内で入力してください。'
      }, 400, corsHeaders);
    }

    // DeepSeek APIにリクエスト
    const deepseekPrompt = createEssayCorrectionPrompt(essay, level, type);
    const deepseekResponse = await callDeepSeekAPI(deepseekPrompt, env.DEEPSEEK_API_KEY);

    if (!deepseekResponse.success) {
      return jsonResponse({
        success: false,
        error: '添削処理でエラーが発生しました。後でもう一度お試しください。',
        details: deepseekResponse.error
      }, 500, corsHeaders);
    }

    const correctionData = parseDeepSeekResponse(deepseekResponse.content);

    // 添削結果にメタデータを追加
    const result = {
      success: true,
      original_essay: essay,
      level: level,
      type: type,
      correction_id: generateCorrectionId(),
      timestamp: new Date().toISOString(),
      ...correctionData
    };

    return jsonResponse(result, 200, corsHeaders);

  } catch (error) {
    console.error('Essay correction error:', error);
    return jsonResponse({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500, corsHeaders);
  }
}

// 英作文添削プロンプト生成
function createEssayCorrectionPrompt(essay, level, type) {
  const levelInstructions = {
    beginner: '基本的な文法や単語の間違いを指摘してください。',
    intermediate: 'より自然な表現や適切な語彙を提案してください。',
    advanced: '洗練された表現、適切な接続詞、論理構成を提案してください。'
  };

  const typeInstructions = {
    general: '一般的な英作文として添削してください。',
    business: 'ビジネスメールやビジネス文書として適切な表現に添削してください。',
    academic: '学術的な文章として、論理構成や適切な表現を提案してください。'
  };

  return `以下の英作文を添削してください。

レベル: ${level} - ${levelInstructions[level]}
種類: ${type} - ${typeInstructions[type]}

添削要件:
1. 文法エラーを修正
2. より自然な英語表現を提案
3. スペルミスを訂正
4. 適切な語彙や表現を提案
5. 文章構造や論理の改善点を指摘

原文:
"""
${essay}
"""

以下のJSON形式で出力してください:
{
  "corrected_text": "修正された英文全体",
  "corrections": [
    {
      "type": "grammar|spelling|vocabulary|structure|fluency",
      "original": "元の表現",
      "corrected": "修正後の表現",
      "explanation": "なぜそう修正するのかの説明",
      "position": { "start": 0, "end": 10 }
    }
  ],
  "overall_feedback": {
    "score": 85,
    "strengths": ["良い点1", "良い点2"],
    "improvements": ["改善点1", "改善点2"],
    "suggestions": "全体的なアドバイス"
  },
  "grammar_score": 90,
  "vocabulary_score": 85,
  "structure_score": 80,
  "fluency_score": 85
}`;
}

// DeepSeek API呼び出し
async function callDeepSeekAPI(prompt, apiKey) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'system',
          content: `You are an expert English composition and writing correction system. Focus on improving English writing quality while preserving the writer's intent.

**Core Correction Areas:**

1. **Grammar & Syntax:**
- Subject-verb agreement, proper tenses, articles (a/an/the)
- Prepositions, conjunctions, and sentence structure
- Punctuation and capitalization rules

2. **Vocabulary & Expression:**
- Word choice appropriateness for context
- Natural phrasing and idiomatic expressions
- Avoiding awkward literal translations
- Academic and informal register differences

3. **Fluency & Flow:**
- Sentence transitions and coherence
- Paragraph structure and logical flow
- Redundancy elimination and clarity improvement

4. **Writing Quality:**
- Conciseness without losing meaning
- Variety in sentence structure
- Appropriate formality level
- Cultural and contextual naturalness

**Output Format:**
Return ONLY a valid JSON object with this exact structure:
{
  "corrected_text": "the fully corrected essay text",
  "corrections": [
    {
      "type": "grammar|spelling|vocabulary|structure|fluency",
      "original": "original phrase",
      "corrected": "corrected phrase",
      "explanation": "why this correction was made",
      "position": { "start": 0, "end": 10 }
    }
  ],
  "overall_feedback": {
    "score": 85,
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"],
    "suggestions": "overall advice"
  },
  "grammar_score": 90,
  "vocabulary_score": 85,
  "structure_score": 80,
  "fluency_score": 85
}

Do not include any markdown formatting, code blocks, or explanatory text outside the JSON.`
        }, {
          role: 'user',
          content: prompt
        }],
        max_tokens: 2048,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', response.status, errorData);
      return {
        success: false,
        error: `DeepSeek API error: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return {
        success: true,
        content: data.choices[0].message.content
      };
    } else {
      return {
        success: false,
        error: 'Invalid response from DeepSeek API'
      };
    }
  } catch (error) {
    console.error('DeepSeek API call error:', error);
    return {
      success: false,
      error: `API call failed: ${error.message}`
    };
  }
}

// DeepSeekレスポンス解析
function parseDeepSeekResponse(content) {
  try {
    // JSONブロックを抽出（markdown形式の場合）
    let jsonContent = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    } else {
      // markdown形式でない場合は直接パース
      jsonContent = content.trim();
    }

    const parsed = JSON.parse(jsonContent);

    // 必須フィールドの検証
    if (!parsed.corrected_text) {
      throw new Error('Missing corrected_text in response');
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse DeepSeek response:', error);
    console.error('Original content:', content);

    // フォールバック：解析できない場合は基本的な構造を返す
    return {
      corrected_text: content,
      corrections: [],
      overall_feedback: {
        score: 70,
        strengths: ["Attempted to write in English"],
        improvements: ["Check grammar and spelling"],
        suggestions: "Please review your essay for basic errors."
      },
      grammar_score: 70,
      vocabulary_score: 70,
      structure_score: 70,
      fluency_score: 70
    };
  }
}

// 添削ID生成
function generateCorrectionId() {
  return 'essay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 英作文添削履歴取得
async function getEssayCorrectionHistory(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({
        success: false,
        error: '認証が必要です'
      }, 401, corsHeaders);
    }

    const token = authHeader.substring(7);
    const user = await verifyJwtToken(token, env);

    if (!user) {
      return jsonResponse({
        success: false,
        error: '無効なトークンです'
      }, 401, corsHeaders);
    }

    // D1から添削履歴を取得
    const query = `
      SELECT * FROM essay_corrections
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await env.TESTAPP_DB.prepare(query)
      .bind(user.userId, limit, offset)
      .all();

    return jsonResponse({
      success: true,
      corrections: result.results || [],
      hasMore: result.results.length === limit
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Get essay history error:', error);
    return jsonResponse({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500, corsHeaders);
  }
}

// 英作文添削結果保存
async function saveEssayCorrection(request, env, corsHeaders) {
  try {
    const {
      original_essay,
      corrected_text,
      corrections,
      overall_feedback,
      level,
      type
    } = await request.json();

    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({
        success: false,
        error: '認証が必要です'
      }, 401, corsHeaders);
    }

    const token = authHeader.substring(7);
    const user = await verifyJwtToken(token, env);

    if (!user) {
      return jsonResponse({
        success: false,
        error: '無効なトークンです'
      }, 401, corsHeaders);
    }

    // D1に保存
    const correctionId = generateCorrectionId();
    const insertQuery = `
      INSERT INTO essay_corrections (
        id, user_id, original_essay, corrected_text, corrections,
        overall_feedback, level, type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await env.TESTAPP_DB.prepare(insertQuery)
      .bind(
        correctionId,
        user.userId,
        original_essay,
        corrected_text,
        JSON.stringify(corrections),
        JSON.stringify(overall_feedback),
        level,
        type,
        new Date().toISOString()
      )
      .run();

    return jsonResponse({
      success: true,
      correction_id: correctionId
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Save essay correction error:', error);
    return jsonResponse({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500, corsHeaders);
  }
}

// JWTトークン検証
async function verifyJwtToken(token, env) {
  try {
    const isValid = await verify(token, env.JWT_SECRET);
    if (!isValid) {
      return null;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
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
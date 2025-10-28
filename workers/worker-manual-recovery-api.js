// ============================================
// 手動リカバリーシステム用API
// cloudflare-worker-learning-notebook-complete.js に追加
// ============================================

// ===== ルーティングに追加 =====
/*
  // ユーザー用リカバリー要求API
  if (url.pathname === '/api/recovery/request' && request.method === 'POST') {
    return await handleRecoveryRequest(request, env, corsHeaders);
  }

  // 管理者用API
  if (url.pathname.startsWith('/api/admin/user/') && request.method === 'GET') {
    return await handleAdminGetUser(request, env, corsHeaders);
  }

  if (url.pathname === '/api/admin/recovery/approve' && request.method === 'POST') {
    return await handleAdminApproveRecovery(request, env, corsHeaders);
  }

  if (url.pathname === '/api/admin/recovery/requests' && request.method === 'GET') {
    return await handleAdminGetRecoveryRequests(request, env, corsHeaders);
  }
*/

// ===== ユーザー用API =====

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

// ===== 管理者用API =====

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

// ===== ヘルパー: jsonResponse (既存のものを使用) =====
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

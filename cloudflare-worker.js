/**
 * Cloudflare Workers - Questa R2 API
 * R2バケットへの直接アクセスでサーバーレス問題管理
 */

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

      // 管理者認証チェック
      if (path.startsWith('/api/')) {
        const authHeader = request.headers.get('Authorization');
        const adminToken = env.ADMIN_TOKEN || 'questa-admin-2024';
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return jsonResponse({ error: '認証ヘッダーが必要です' }, 401, corsHeaders);
        }
        
        const token = authHeader.replace('Bearer ', '');
        if (token !== adminToken) {
          return jsonResponse({ error: '認証に失敗しました' }, 401, corsHeaders);
        }
      }

      // ルーティング
      if (path === '/api/health') {
        return jsonResponse({ 
          status: 'ok', 
          service: 'questa-workers-r2',
          timestamp: new Date().toISOString()
        }, 200, corsHeaders);
      }

      // 問題保存 API
      if (path.match(/^\/api\/questions\/(\w+)$/) && request.method === 'POST') {
        const subject = path.match(/^\/api\/questions\/(\w+)$/)[1];
        return await saveQuestions(request, env, subject, corsHeaders);
      }

      // 問題取得 API
      if (path.match(/^\/api\/questions\/(\w+)$/) && request.method === 'GET') {
        const subject = path.match(/^\/api\/questions\/(\w+)$/)[1];
        return await loadQuestions(env, subject, corsHeaders);
      }

      // 音声アップロード API
      if (path === '/api/upload/audio' && request.method === 'POST') {
        return await uploadAudio(request, env, corsHeaders);
      }

      // ファイル一覧取得 API
      if (path.match(/^\/api\/files\/(\w+)$/) && request.method === 'GET') {
        const type = path.match(/^\/api\/files\/(\w+)$/)[1];
        return await listFiles(env, type, corsHeaders);
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

// 問題保存機能
async function saveQuestions(request, env, subject, corsHeaders) {
  try {
    const { questions } = await request.json();
    
    if (!questions || !Array.isArray(questions)) {
      return jsonResponse({ error: '無効な問題データです' }, 400, corsHeaders);
    }

    const timestamp = Date.now();
    const filename = `questions/${subject}/${timestamp}.json`;
    
    // R2に問題データを保存
    await env.QUESTA_BUCKET.put(filename, JSON.stringify(questions, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
      },
      customMetadata: {
        'uploaded-by': 'admin',
        'timestamp': timestamp.toString(),
        'subject': subject,
        'count': questions.length.toString()
      }
    });

    // インデックスファイル更新
    await updateQuestionIndex(env, subject, filename);

    const publicUrl = `https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/${filename}`;

    return jsonResponse({
      success: true,
      url: publicUrl,
      filename: filename,
      count: questions.length,
      timestamp: new Date(timestamp).toISOString()
    }, 200, corsHeaders);

  } catch (error) {
    console.error('問題保存エラー:', error);
    return jsonResponse({ 
      error: '問題の保存に失敗しました',
      details: error.message 
    }, 500, corsHeaders);
  }
}

// 問題取得機能
async function loadQuestions(env, subject, corsHeaders) {
  try {
    const indexKey = `questions/${subject}/index.json`;
    
    // インデックスファイルを取得
    const indexObject = await env.QUESTA_BUCKET.get(indexKey);
    if (!indexObject) {
      return jsonResponse({ 
        questions: [], 
        metadata: null,
        message: `${subject}の問題データが見つかりません`
      }, 200, corsHeaders);
    }

    const index = JSON.parse(await indexObject.text());
    
    if (!index.files || index.files.length === 0) {
      return jsonResponse({ 
        questions: [], 
        metadata: null 
      }, 200, corsHeaders);
    }

    // 最新の問題ファイルを取得
    const latestFile = index.files[0];
    const questionObject = await env.QUESTA_BUCKET.get(latestFile.filename);
    
    if (!questionObject) {
      return jsonResponse({ 
        error: '問題データファイルが見つかりません' 
      }, 404, corsHeaders);
    }

    const questions = JSON.parse(await questionObject.text());

    return jsonResponse({
      questions: questions,
      metadata: latestFile
    }, 200, corsHeaders);

  } catch (error) {
    console.error('問題取得エラー:', error);
    return jsonResponse({ 
      error: '問題の取得に失敗しました',
      details: error.message 
    }, 500, corsHeaders);
  }
}

// インデックスファイル更新
async function updateQuestionIndex(env, subject, filename) {
  try {
    const indexKey = `questions/${subject}/index.json`;
    let index = { files: [], lastUpdated: Date.now() };

    // 既存のインデックス取得
    const existingIndex = await env.QUESTA_BUCKET.get(indexKey);
    if (existingIndex) {
      index = JSON.parse(await existingIndex.text());
    }

    // 新しいファイルをインデックスに追加
    const publicUrl = `https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/${filename}`;
    index.files.unshift({
      filename: filename,
      timestamp: Date.now(),
      url: publicUrl
    });

    // 古いファイルは10個まで保持
    if (index.files.length > 10) {
      const oldFiles = index.files.slice(10);
      // 古いファイルを削除
      for (const oldFile of oldFiles) {
        try {
          await env.QUESTA_BUCKET.delete(oldFile.filename);
        } catch (error) {
          console.warn('古いファイル削除失敗:', error);
        }
      }
      index.files = index.files.slice(0, 10);
    }

    index.lastUpdated = Date.now();

    // インデックス更新
    await env.QUESTA_BUCKET.put(indexKey, JSON.stringify(index, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
      }
    });

  } catch (error) {
    console.error('インデックス更新エラー:', error);
    throw error;
  }
}

// 音声アップロード機能
async function uploadAudio(request, env, corsHeaders) {
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
        'uploaded-by': 'admin',
        'timestamp': timestamp.toString()
      }
    });

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

// ファイル一覧取得
async function listFiles(env, type, corsHeaders) {
  try {
    const prefix = `${type}/`;
    const objects = await env.QUESTA_BUCKET.list({ prefix: prefix, limit: 100 });

    const files = objects.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      url: `https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/${obj.key}`
    }));

    return jsonResponse({ files }, 200, corsHeaders);

  } catch (error) {
    console.error('ファイル一覧取得エラー:', error);
    return jsonResponse({ 
      error: 'ファイル一覧の取得に失敗しました',
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
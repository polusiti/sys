/**
 * 🌟 統合AI英作文API Worker
 * 
 * eisakujikken + 学習機能 + 既存機能を統合
 * DeepSeek API一本化
 */
import { sign, verify } from '@tsndr/cloudflare-worker-jwt';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    
    // CORS設定
    const allowedOrigins = [
      'https://allfrom0.top',
      'https://www.allfrom0.top',
      'https://api.allfrom0.top'
    ];
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'https://allfrom0.top',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    // OPTIONSリクエスト（CORS preflight）
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // APIルーティング
      const path = url.pathname;
      
      // 📝 英文添削エンドポイント
      if (path === '/api/v2/grammar' && request.method === 'POST') {
        return await handleGrammarCorrection(request, env, corsHeaders);
      }
      
      // 📚 学習サポートエンドポイント
      if (path === '/api/v2/learning/examples' && request.method === 'GET') {
        return await handleLearningExamples(request, corsHeaders);
      }
      
      // 🏥 Health check
      if (path === '/api/v2/health') {
        return jsonResponse({
          status: 'ok',
          service: 'unified-api',
          version: '2.0.0',
          endpoints: ['/api/v2/grammar', '/api/v2/learning/examples'],
          timestamp: new Date().toISOString()
        }, 200, corsHeaders);
      }
      
      // 既存の学習機能（互換性のため維持）
      if (path.startsWith('/api/note/')) {
        return await legacyNotebookHandler(request, env, corsHeaders);
      }
      
      // デフォルトは404
      return new Response('Not Found', { status: 404, headers: corsHeaders });
      
    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
      }, 500, corsHeaders);
    }
  }
};

/**
 * 📝 英文添削処理
 */
async function handleGrammarCorrection(request, env, corsHeaders) {
  try {
    const { text } = await request.json();
    
    // 入力検証
    if (!text || typeof text !== 'string') {
      return jsonResponse({
        error: 'Invalid input',
        message: 'Text is required and must be a string'
      }, 400, corsHeaders);
    }
    
    if (text.length > 1000) {
      return jsonResponse({
        error: 'Text too long',
        message: 'Text must be 1000 characters or less'
      }, 400, corsHeaders);
    }
    
    // XSS保護
    if (/<script|javascript:|on\w+\s*=/i.test(text)) {
      return jsonResponse({
        error: 'Invalid content',
        message: 'Text contains invalid content'
      }, 400, corsHeaders);
    }
    
    // DeepSeek API呼出し
    const startTime = Date.now();
    const deepseekResponse = await callDeepSeekAPI(env, text);
    const responseTime = Date.now() - startTime;
    
    if (deepseekResponse.error) {
      return jsonResponse({
        error: 'AI Service Error',
        message: deepseekResponse.error
      }, 502, corsHeaders);
    }
    
    // 文法エラー分析
    const grammarAnalysis = analyzeGrammarErrors(text);
    
    return jsonResponse({
      corrected: deepseekResponse.corrected || text,
      explanation: deepseekResponse.explanation || 'No errors found',
      responseTime: `${responseTime}ms`,
      layer: 'deepseek-api',
      analysis: grammarAnalysis,
      timestamp: new Date().toISOString()
    }, 200, corsHeaders);
    
  } catch (error) {
    console.error('Grammar correction error:', error);
    return jsonResponse({
      error: 'Processing Error',
      message: error.message
    }, 500, corsHeaders);
  }
}

/**
 * 🚀 DeepSeek API呼出し
 */
async function callDeepSeekAPI(env, text) {
  if (!env.DEEPSEEk_API_KEY) {
    throw new Error('DeepSeek API key not configured');
  }
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.DEEPSEEk_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an English grammar correction assistant. Please correct any grammatical errors in the given text and provide a clear explanation. Be concise but thorough.'
        },
        {
          role: 'user',
          content: `Please correct the English text: "${text}"`
        }
      ],
      temperature: 0.2,
      max_tokens: 500
    })
  });
  
  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  const content = result.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('Invalid response from DeepSeek API');
  }
  
  // JSONレスポンスを安全にパース
  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error('DeepSeek response parsing error:', parseError);
    return {
      corrected: text,
      explanation: 'Error processing AI response. Please try again.',
      error: 'parse_error'
    };
  }
}

/**
 * 📚 学習例文処理
 */
async function handleLearningExamples(request, env, corsHeaders) {
  const examples = [
    {
      id: 'subject_verb',
      title: '主語・動詞',
      incorrect: 'I goes to school.',
      correct: 'I go to school.',
      explanation: '三人称単数の現在形では-sをつけない'
    },
    {
      id: 'articles',
      title: '冠詞',
      incorrect: 'a apple',
      correct: 'an apple',
      explanation: '母音で始まる単語にはanをつける'
    },
    {
      id: 'tenses',
      title: '時制',
      incorrect: 'I goed yesterday.',
      correct: 'I went yesterday.',
      explanation: '不規則動詞は過去形を使用'
    }
  ];
  
  return jsonResponse({
    examples,
    total: examples.length,
    timestamp: new Date().toISOString()
  }, 200, corsHeaders);
}

/**
 * 📊 互換性のためのレガシーハンドラー
 */
async function legacyNotebookHandler(request, env, corsHeaders) {
  // 既存の学習機能を呼出し（互換性維持）
  // 注意：これは一時的な互換性対策
  console.log('Legacy notebook handler called for path:', new URL(request.url).pathname);
  
  try {
    const path = new URL(request.url).pathname;
    
    if (path === '/api/health') {
      return jsonResponse({
        status: 'ok',
        service: 'legacy-notebook',
        message: 'Legacy functionality maintained for compatibility'
      }, 200, corsHeaders);
    }
    
    return new Response('Legacy functionality - use unified API', { 
      status: 410, 
      headers: { ...corsHeaders, 'Deprecation': 'true' }
    });
    
  } catch (error) {
    return jsonResponse({
      error: 'Legacy handler error',
      message: error.message
    }, 500, corsHeaders);
  }
}

/**
 * 🔧 ユーティリティ関数
 */
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

/**
 * 📝 文法エラー分析
 */
function analyzeGrammarErrors(text) {
  const errors = [];
  
  const patterns = [
    { type: '三人称単数', pattern: /\b(he|she|it)\s+\w+s\b/gi, example: 'He goes → He goes' },
    { type: 'be動詞', pattern: /\b(I|you|we|they)\s+is\b|\b(he|she|it)\s+are\b/gi, example: 'I are → I am' },
    { type: '時制', pattern: /\b(go|eat|see|come|take|make)\s+ed\b/gi, example: 'goed → went' },
    { type: '冠詞', pattern: /\b(a|an)\s+(?:apple|banana|orange|book|car|house)\b/gi, example: 'apple → an apple' }
  ];
  
  patterns.forEach(patternObj => {
    const matches = text.match(patternObj.pattern);
    if (matches) {
      errors.push({
        type: patternObj.type,
        count: matches.length,
        example: patternObj.example
      });
    }
  });
  
  return {
    detectedErrors: errors.length > 0,
    errors: errors,
    summary: errors.length > 0 ? `${errors.length}種類の文法エラーを検出` : '文法エラーは検出されませんでした'
  };
}

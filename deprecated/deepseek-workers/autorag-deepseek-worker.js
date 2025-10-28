/**
 * 🚀 AutoRAG + DeepSeek 英作文添削 Worker
 *
 * Cloudflare AI Search (AutoRAG) と DeepSeek API を連携させ、
** 高度な文脈理解に基づく英作文添削を実現する
 */

// エクスポートメインハンドラ
export default {
  async fetch(request, env) {
    // CORS対応
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // OPTIONSリクエスト処理
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);

      // GETパラメータからクエリを取得
      let query = url.searchParams.get('q');

      // POSTボディからも取得可能に
      if (!query && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        query = body.q || body.query || body.text;
      }

      // クエリが存在しない場合のエラー処理
      if (!query) {
        return new Response('Missing query parameter. Use ?q=your_english_text', {
          status: 400,
          headers: corsHeaders
        });
      }

      console.log(`🔍 Processing English correction query: "${query}"`);

      // ステップ1: AutoRAG検索で文法コンテキストを取得
      let ragContext = '';
      let ragResults = [];

      try {
        console.log('📚 Step 1: Searching AutoRAG for grammar context...');

        // Workers AI AutoRAGを使用 - 新しいAPI方式
        const ragResponse = await env.AI.autorag("rough-bread-ff9e11").search({
          query: `English grammar correction for: ${query}`,
          max_num_results: 5,
          // 必要に応じてフィルタリング
          filters: {
            content_type: "grammar_rule"
          }
        });

        ragResults = ragResponse.results || [];
        console.log(`✅ Found ${ragResults.length} relevant grammar contexts`);

        // コンテキストを構築
        if (ragResults.length > 0) {
          ragContext = ragResults.map((result, index) => {
            return `[Grammar Context ${index + 1}]\n${result.data?.text || result.content || result.text || 'No content available'}\nRelevance: ${result.score || 'N/A'}`;
          }).join('\n\n');

          console.log('📝 RAG Context successfully built');
        }

      } catch (ragError) {
        console.warn('⚠️ AutoRAG search failed, proceeding without context:', ragError.message);
        // RAGが利用できなくてもDeepSeekだけで機能するように続行
      }

      // ステップ2: DeepSeek APIで添削を実行
      console.log('🤖 Step 2: Calling DeepSeek API for grammar correction...');

      const deepseekResponse = await callDeepSeekAPI(env, query, ragContext);

      if (!deepseekResponse.success) {
        throw new Error(deepseekResponse.error);
      }

      // ステップ3: レスポンスを返す
      console.log('✅ Grammar correction completed successfully');

      // JSONレスポンス（推奨）
      if (url.searchParams.get('format') === 'json' || request.method === 'POST') {
        return new Response(JSON.stringify({
          success: true,
          original: query,
          corrected: deepseekResponse.corrected,
          rag_used: ragResults.length > 0,
          rag_results_count: ragResults.length,
          rag_context_provided: ragContext.length > 0,
          response_time: deepseekResponse.response_time,
          timestamp: new Date().toISOString(),
          rag_sources: ragResults.map(r => ({
            filename: r.filename || 'Unknown',
            score: r.score || 0,
            snippet: (r.data?.text || r.content || r.text || '').substring(0, 100) + '...'
          }))
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // プレーンテキストレスポンス（シンプル）
      return new Response(deepseekResponse.corrected, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });

    } catch (error) {
      console.error('❌ Grammar correction error:', error);

      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};

/**
 * 🤖 DeepSeek API呼び出し関数
 *
 * @param {Object} env - 環境変数
 * @param {string} originalText - 元の英文
 * @param {string} ragContext - AutoRAGから取得した文脈
 * @returns {Object} 添削結果
 */
async function callDeepSeekAPI(env, originalText, ragContext = '') {
  const startTime = Date.now();

  // プロンプト構築
  let systemPrompt = `You are an expert English grammar correction assistant. Your task is to correct grammatical errors and improve the naturalness of English text.

## Correction Guidelines:
1. Fix all grammatical errors (subject-verb agreement, tense, articles, etc.)
2. Improve sentence structure for better flow
3. Maintain the original meaning and intent
4. Provide natural, fluent English

## Response Format:
Return ONLY the corrected English text. No explanations or additional comments.

## Examples:
Input: "I has a pen and go to school yesterday."
Output: "I have a pen and went to school yesterday."

Input: "She don't like apples but she likes banana."
Output: "She doesn't like apples but she likes bananas."`;

  // RAGコンテキストがあれば追加
  if (ragContext) {
    systemPrompt += `\n\n## Grammar Context from Knowledge Base:\n${ragContext}\n\nUse this grammar context to provide more accurate and contextual corrections.`;
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Please correct this English text: "${originalText}"`
          }
        ],
        temperature: 0.1,  // 低めの温度で一貫性を確保
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const corrected = result.choices?.[0]?.message?.content?.trim();

    if (!corrected) {
      throw new Error('Empty response from DeepSeek API');
    }

    const responseTime = Date.now() - startTime;
    console.log(`🎯 DeepSeek correction completed in ${responseTime}ms`);

    return {
      success: true,
      corrected: corrected,
      response_time: responseTime,
      tokens_used: result.usage?.total_tokens || 0
    };

  } catch (error) {
    console.error('DeepSeek API call failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
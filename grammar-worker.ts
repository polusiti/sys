interface Env {
  AI: any;
  DB: D1Database;
  LANGUAGE_CACHE: KVNamespace;
}

interface CorrectionResult {
  corrected: string;
  explanation: string;
  category: "grammar" | "vocabulary" | "punctuation" | "style";
  correct?: boolean;
}

// RAG検索機能 - D1データベースから類似文を取得
async function ragSearch(input: string, env: Env): Promise<string | null> {
  try {
    // 簡単なキーワード検索（将来的にはVectorizeによるベクトル検索に置換可能）
    const keywords = input.toLowerCase().split(' ').filter(word => word.length > 3);

    if (keywords.length === 0) return null;

    // D1から類似の文法パターンを検索
    const searchQuery = `
      SELECT original_sentence, corrected_sentence, explanation
      FROM grammar_examples
      WHERE LOWER(original_sentence) LIKE '%${keywords[0]}%'
      LIMIT 3
    `;

    const result = await env.DB.prepare(searchQuery).all();

    if (result.results.length > 0) {
      const examples = result.results.map(row =>
        `Original: ${row.original_sentence}\nCorrected: ${row.corrected_sentence}\nExplanation: ${row.explanation}`
      ).join('\n\n');

      return examples;
    }

    return null;
  } catch (error) {
    console.error('RAG search error:', error);
    return null;
  }
}

// 改善されたプロンプト生成関数
function generateCorrectionPrompt(input: string, context?: string): string {
  const basePrompt = `
You are an expert English writing instructor.
Analyze and correct the following English sentence.
Return a JSON object with the following structure:
{
  "corrected": "...",
  "explanation": "...",
  "category": "grammar | vocabulary | punctuation | style",
  "correct": true (if already perfect)
}

Sentence:
"${input}"

Make the explanation concise but instructive.
If the sentence is already correct, respond with "correct": true.
`;

  if (context) {
    return `
You are correcting an English sentence using reference examples.
Reference examples:
${context}

Now correct and explain this input sentence:
"${input}"

Return a JSON object with:
{
  "corrected": "...",
  "explanation": "...",
  "category": "grammar | vocabulary | punctuation | style"
}
`;
  }

  return basePrompt;
}

// 改善されたAI実行関数
async function executeAICorrection(prompt: string, env: Env): Promise<CorrectionResult> {
  try {
    const raw = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt,
      max_output_tokens: 250,
      temperature: 0.3
    });

    const response = raw.response || raw;

    // 改善されたJSONパース処理
    try {
      // マークダウンコードブロックを除去
      const cleanResponse = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);

      // 既に正しい場合の処理
      if (parsed.correct === true) {
        return {
          corrected: "✅ This sentence is already correct!",
          explanation: "No corrections needed - your sentence is grammatically perfect.",
          category: "grammar" as const,
          correct: true
        };
      }

      return {
        corrected: parsed.corrected || input,
        explanation: parsed.explanation || "Correction completed.",
        category: parsed.category || "grammar" as const
      };

    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);

      // パース失敗時のフォールバック
      return {
        corrected: response || input,
        explanation: "AI response processed. Please review the correction.",
        category: "unknown" as const
      };
    }

  } catch (error) {
    console.error('AI execution error:', error);

    return {
      corrected: input,
      explanation: "Unable to process correction at this time. Please try again.",
      category: "unknown" as const
    };
  }
}

// メインの文法修正関数
export async function correctGrammar(input: string, env: Env, useRAG: boolean = true): Promise<CorrectionResult> {
  if (!input || typeof input !== 'string') {
    throw new Error('Valid text input is required');
  }

  if (input.length > 1000) {
    throw new Error('Text must be 1000 characters or less');
  }

  try {
    let context: string | undefined;

    // RAG検索（有効な場合）
    if (useRAG) {
      context = await ragSearch(input, env);
    }

    // プロンプト生成
    const prompt = generateCorrectionPrompt(input, context);

    // AI実行
    const result = await executeAICorrection(prompt, env);

    // キャッシュに保存（オプション）
    if (env.LANGUAGE_CACHE) {
      const cacheKey = `grammar:${input.substring(0, 50)}`;
      await env.LANGUAGE_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });
    }

    return result;

  } catch (error) {
    console.error('Grammar correction error:', error);
    throw error;
  }
}

// Workers APIエンドポイント
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    };

    // CORS対応
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ヘルスチェック
    if (request.method === 'GET') {
      if (new URL(request.url).pathname === '/health') {
        return Response.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          features: ['grammar_correction', 'rag_search', 'ai_llm']
        }, { headers: corsHeaders });
      }
    }

    // 文法修正エンドポイント
    if (request.method === 'POST' && new URL(request.url).pathname === '/api/v2/grammar') {
      try {
        const { text, useRAG = true } = await request.json() as {
          text: string;
          useRAG?: boolean;
        };

        const result = await correctGrammar(text, env, useRAG);

        return Response.json(result, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });

      } catch (error) {
        console.error('API error:', error);

        return Response.json({
          error: 'Correction failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, {
          status: 400,
          headers: corsHeaders
        });
      }
    }

    return new Response('Not found', {
      status: 404,
      headers: corsHeaders
    });
  }
};
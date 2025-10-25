interface Env {
  LANGUAGE_CACHE: KVNamespace;
  DB: D1Database;
  AI: any;
  DEEPSEEK_API_KEY: string;
}

interface CorrectionResult {
  corrected: string;
  explanation: string;
}

interface Pattern {
  pattern: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
  explanation: string;
}

const PATTERNS: Pattern[] = [
  { pattern: /\bi\s+/gi, replacement: 'I ', explanation: 'Pronoun "I" should be capitalized' },
  { pattern: /\bdont\b/gi, replacement: "don't", explanation: 'Use apostrophe in contractions' },
  { pattern: /\bwont\b/gi, replacement: "won't", explanation: 'Use apostrophe in contractions' },
  { pattern: /\bcant\b/gi, replacement: "can't", explanation: 'Use apostrophe in contractions' },
  { pattern: /\bdoesnt\b/gi, replacement: "doesn't", explanation: 'Use apostrophe in contractions' },
  { pattern: /\bisnt\b/gi, replacement: "isn't", explanation: 'Use apostrophe in contractions' },
  { pattern: /\barent\b/gi, replacement: "aren't", explanation: 'Use apostrophe in contractions' },
  { pattern: /\bwasnt\b/gi, replacement: "wasn't", explanation: 'Use apostrophe in contractions' },
  { pattern: /\bwerent\b/gi, replacement: "weren't", explanation: 'Use apostrophe in contractions' },
  { pattern: /\bhes\b/gi, replacement: "he's", explanation: 'Use apostrophe in contractions' },
  { pattern: /\bshes\b/gi, replacement: "she's", explanation: 'Use apostrophe in contractions' },
  { pattern: /\bits\b\s+\b(a|an|the)\b/gi, replacement: "it's $1", explanation: 'Use "it\'s" (it is) instead of "its"' },
  { pattern: /\btheir\s+(is|are)\b/gi, replacement: "there $1", explanation: 'Use "there" instead of "their" for existence' },
  { pattern: /\byour\s+welcome\b/gi, replacement: "you're welcome", explanation: 'Use "you\'re" (you are) instead of "your"' },
  { pattern: /\btheyre\b/gi, replacement: "they're", explanation: 'Use "they\'re" (they are) instead of "there"' },
  { pattern: /\.{2,}/g, replacement: '.', explanation: 'Use single period for sentence endings' },
  { pattern: /\s{2,}/g, replacement: ' ', explanation: 'Remove extra spaces' }
];

// 文末句読点チェック
function checkSentenceEndings(text: string): CorrectionResult | null {
  // すでに句読点で終わっているかチェック
  if (text.trim().match(/[.!?]$/)) {
    return null;
  }

  // 文の構造を分析（簡易的）
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const lastSentence = sentences[sentences.length - 1];

  if (!lastSentence || lastSentence.trim().length === 0) {
    return null;
  }

  // 短すぎる文や単一単語の場合はピリオドを追加しない
  const cleanLastSentence = lastSentence.trim();
  const words = cleanLastSentence.split(/\s+/);

  if (words.length <= 2 && words[0].length <= 3) {
    return null;
  }

  // 文末が大文字で始まる固有名詞の場合はピリオドを追加しない可能性
  if (cleanLastSentence.match(/^(I|We|They|He|She|It)\s+\w+$/i)) {
    return null;
  }

  return {
    corrected: text.trim() + '.',
    explanation: 'Add period at the end of the sentence'
  };
}

function checkRegexPatterns(text: string): CorrectionResult | null {
  for (const { pattern, replacement, explanation } of PATTERNS) {
    if (pattern.test(text)) {
      const corrected = typeof replacement === 'function'
        ? text.replace(pattern, replacement as any)
        : text.replace(pattern, replacement as string);
      return { corrected, explanation };
    }
  }
  return null;
}

async function queryKnowledgeBase(env: Env, text: string): Promise<CorrectionResult | null> {
  if (!env.DB) return null;

  try {
    // パターンをtext内に含むものを検索
    const result = await env.DB.prepare(`
      SELECT pattern, replacement, explanation
      FROM knowledge_base
      WHERE ?1 LIKE '%' || pattern || '%'
      ORDER BY LENGTH(pattern) DESC
      LIMIT 1
    `).bind(text.toLowerCase()).first();

    if (result) {
      const corrected = text.replace(new RegExp(result.pattern as string, 'gi'), result.replacement as string);
      return { corrected, explanation: result.explanation as string };
    }
  } catch (error) {
    console.error('Knowledge base error:', error);
  }
  return null;
}

async function callDeepSeek(env: Env, text: string): Promise<CorrectionResult | null> {
  if (!env.DEEPSEEK_API_KEY) return null;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'system',
          content: `You are an expert English grammar checker, proofreader, and cultural-linguistic consultant. For Japanese-to-English translations, provide comprehensive analysis:

**Basic Grammar & Punctuation:**
1. Subject-verb agreement, tenses, articles, prepositions
2. Sentence structure and flow
3. Word choice and clarity
4. Cultural appropriateness in English

**Philosophical & Ethical Considerations:**
1. Identify potentially biased or one-sided expressions
2. Suggest more balanced, nuanced alternatives
3. Consider cultural context in translation choices
4. Maintain the original philosophical depth
5. Flag expressions that might sound judgmental

**Special Focus for Complex Themes:**
- Human relationships and reciprocity
- Gratitude, indebtedness, and social dynamics
- Philosophical statements about human nature
- Cultural differences in expressing gratitude

**Output Format:**
Return JSON: {"corrected": "improved translation", "explanation": "comprehensive feedback covering grammar, cultural nuances, and ethical considerations"}

If the text is already excellent, respond: {"corrected": "original text", "explanation": "Well-expressed with good balance and cultural sensitivity"}

**Important Rules:**
- Preserve the original philosophical meaning
- Suggest more balanced alternatives for one-sided expressions
- Consider cultural differences in expressing gratitude
- Improve clarity without losing complexity
- Add appropriate sentence endings when missing`
        }, {
          role: 'user',
          content: `Please analyze this Japanese-to-English translation for grammar, cultural appropriateness, and philosophical balance: "${text}"`
        }],
        max_tokens: 300,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in DeepSeek response');
    }

    // JSONを安全にパース
    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanedContent);

      // 特別処理：哲学的テーマの検出
      const philosophicalKeywords = ['人間', '恩', '情け', '世', '真理', '徳', '善', '正義', '倫理'];
      const hasPhilosophicalContent = philosophicalKeywords.some(keyword => text.includes(keyword));

      if (hasPhilosophicalContent && result.explanation) {
        result.explanation += '\n\n💭 Note: This text touches on deep philosophical themes about human nature and ethics.';
      }

      // AIがピリオドを追加しない場合に備える
      if (result.corrected && !result.corrected.match(/[.!?]$/) &&
          text.length > 5 && !text.match(/[.!?]/)) {
        result.corrected = result.corrected + '.';
        if (result.explanation === 'No errors found') {
          result.explanation = 'Add period at the end of the sentence';
        }
      }

      return result;
    } catch (parseError) {
      console.error('Failed to parse DeepSeek response:', content);
      return null;
    }
  } catch (error) {
    console.error('DeepSeek error:', error);
    return null;
  }
}

async function callWorkersAI(env: Env, text: string): Promise<CorrectionResult | null> {
  if (!env.AI) return null;

  try {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{
        role: 'system',
        content: `You are an expert English proofreader and cultural consultant specializing in Japanese-to-English translation. Analyze texts for:

**Linguistic Analysis:**
1. Grammar, punctuation, and sentence structure
2. Word choice and naturalness in English
3. Clarity and flow

**Cultural & Philosophical Awareness:**
1. Balance in human relationship descriptions
2. Cultural appropriateness in expressing gratitude
3. Nuance in philosophical statements
4. Avoid one-sided or judgmental expressions

**Special Focus Areas:**
- Human nature and ethical considerations
- Gratitude, indebtedness, and social harmony
- Complex philosophical or moral statements
- Cross-cultural communication sensitivity

**Output Requirement:**
Return JSON: {"corrected": "improved translation", "explanation": "detailed feedback covering grammar, cultural balance, and philosophical nuance"}

If already excellent: {"corrected": "original text", "explanation": "Well-balanced translation with cultural sensitivity"}

**Guidelines:**
- Maintain philosophical depth while improving clarity
- Suggest balanced alternatives for one-sided views
- Consider cultural differences in social expressions
- Provide context-aware recommendations`
      }, {
        role: 'user',
        content: `Analyze this Japanese-to-English translation for linguistic and cultural balance: "${text}"`
      }],
      max_tokens: 250,
      temperature: 0.2
    });

    const content = response?.response;
    if (!content) {
      throw new Error('No content in Workers AI response');
    }

    // JSONを安全にパース
    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanedContent);

      // 哲学的テーマ検出
      const philosophicalKeywords = ['人間', '恩', '情け', '世', '真理', '倫理', '正義'];
      const hasPhilosophicalContent = philosophicalKeywords.some(keyword => text.includes(keyword));

      if (hasPhilosophicalContent && result.explanation) {
        result.explanation += '\n\n🧠 This text explores deep themes about human nature and ethics.';
      }

      // 文末ピリオドチェック
      if (result.corrected && !result.corrected.match(/[.!?]$/) &&
          text.length > 8 && !text.match(/[.!?]/)) {
        result.corrected = result.corrected + '.';
        if (result.explanation === 'No errors found' || !hasPhilosophicalContent) {
          result.explanation = 'Add period at the end of the sentence';
        }
      }

      return result;
    } catch (parseError) {
      console.error('Failed to parse Workers AI response:', content);
      return null;
    }
  } catch (error) {
    console.error('Workers AI error:', error);
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS対応
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    try {
      if (request.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, {
          status: 405,
          headers: corsHeaders
        });
      }

      const { text } = await request.json() as { text: string };

      if (!text || typeof text !== 'string') {
        return Response.json({ error: 'Invalid text input' }, {
          status: 400,
          headers: corsHeaders
        });
      }

      if (text.length > 1000) {
        return Response.json({ error: 'Text too long (max 1000 characters)' }, {
          status: 400,
          headers: corsHeaders
        });
      }

      const cacheKey = `correction:${encodeURIComponent(text)}`;

      // 1. KV Cache check
      if (env.LANGUAGE_CACHE) {
        try {
          const cached = await env.LANGUAGE_CACHE.get(cacheKey);
          if (cached) return Response.json(JSON.parse(cached));
        } catch (cacheError) {
          console.error('Cache error:', cacheError);
        }
      }

      let result: CorrectionResult = { corrected: text, explanation: 'No errors found' };

      // 2. Sentence ending check (highest priority for basic structure)
      const sentenceResult = checkSentenceEndings(text);
      if (sentenceResult) {
        result = sentenceResult;
      } else {
        // 3. Regex pattern matching
        const regexResult = checkRegexPatterns(text);
        if (regexResult) {
          result = regexResult;
        } else {
          // 4. Knowledge base lookup
          const kbResult = await queryKnowledgeBase(env, text);
          if (kbResult) {
            result = kbResult;
          } else {
            // 5. DeepSeek API (if configured)
            const deepseekResult = await callDeepSeek(env, text);
            if (deepseekResult) {
              result = deepseekResult;
            } else {
              // 6. Workers AI fallback
              const aiResult = await callWorkersAI(env, text);
              if (aiResult) {
                result = aiResult;
              }
            }
          }
        }
      }

      // 変更がない場合はNo errors
      if (result.corrected === text) {
        result = { corrected: text, explanation: 'No errors found' };
      }

      // Cache result
      if (env.LANGUAGE_CACHE) {
        try {
          await env.LANGUAGE_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });
        } catch (cacheError) {
          console.error('Cache write error:', cacheError);
        }
      }

      return Response.json(result, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      return Response.json(
        { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }
  }
};
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
  // 主語-動詞の一致（最重要）
  { pattern: /\b(he|she|it)\s+(are)\b/gi, replacement: '$1 is', explanation: 'Subject-verb agreement: use "is" with he/she/it' },
  { pattern: /\b(I)\s+(are)\b/g, replacement: '$1 am', explanation: 'Subject-verb agreement: use "am" with I' },
  { pattern: /\b(I)\s+(is)\b/g, replacement: '$1 am', explanation: 'Subject-verb agreement: use "am" with I' },
  { pattern: /\b(they|we|you)\s+(is)\b/gi, replacement: '$1 are', explanation: 'Subject-verb agreement: use "are" with they/we/you' },

  // 短縮形（重要度：高）
  { pattern: /\bdont\b/gi, replacement: "don't", explanation: 'Use apostrophe in contractions: "don\'t"' },
  { pattern: /\bwont\b/gi, replacement: "won't", explanation: 'Use apostrophe in contractions: "won\'t"' },
  { pattern: /\bcant\b/gi, replacement: "can't", explanation: 'Use apostrophe in contractions: "can\'t"' },
  { pattern: /\bdoesnt\b/gi, replacement: "doesn't", explanation: 'Use apostrophe in contractions: "doesn\'t"' },
  { pattern: /\bisnt\b/gi, replacement: "isn't", explanation: 'Use apostrophe in contractions: "isn\'t"' },
  { pattern: /\barent\b/gi, replacement: "aren't", explanation: 'Use apostrophe in contractions: "aren\'t"' },
  { pattern: /\bwasnt\b/gi, replacement: "wasn't", explanation: 'Use apostrophe in contractions: "wasn\'t"' },
  { pattern: /\bwerent\b/gi, replacement: "weren't", explanation: 'Use apostrophe in contractions: "weren\'t"' },
  { pattern: /\bdidnt\b/gi, replacement: "didn't", explanation: 'Use apostrophe in contractions: "didn\'t"' },

  // 一般的な間違い
  { pattern: /\b(go)\s+to\s+the\s+(store|school|park|hospital|library)\b/gi, replacement: 'go to $1', explanation: 'Remove "the" after "go to" for places like store, school' },
  { pattern: /\bbread(s)?\b/gi, replacement: 'bread', explanation: '"Bread" is usually uncountable' },
  { pattern: /\btelled\b/gi, replacement: 'told', explanation: 'Past tense of "tell" is "told"' },
  { pattern: /\bpeoples?\b/gi, replacement: 'people', explanation: '"People" is already plural' },

  // 少し優先度低いルール
  { pattern: /\bi\s+/gi, replacement: 'I ', explanation: 'Pronoun "I" should be capitalized' },
  { pattern: /\bits\b\s+\b(a|an|the)\b/gi, replacement: "it's $1", explanation: 'Use "it\'s" (it is) instead of "its"' },
  { pattern: /\btheir\s+(is|are)\b/gi, replacement: "there $1", explanation: 'Use "there" instead of "their" for existence' },
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
  let corrected = text;
  const explanations: string[] = [];

  for (const { pattern, replacement, explanation } of PATTERNS) {
    if (pattern.test(corrected)) {
      corrected = typeof replacement === 'function'
        ? corrected.replace(pattern, replacement as any)
        : corrected.replace(pattern, replacement as string);
      explanations.push(explanation);
    }
  }

  if (explanations.length > 0) {
    return {
      corrected,
      explanation: explanations.join('; ')
    };
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
          content: `You are an expert English grammar checker specializing in common errors. Focus on these key areas:

**Priority 1: Subject-Verb Agreement**
- I + am/is/are → correct form
- He/She/It + is/are → use "is"
- They/We/You + is/are → use "are"

**Priority 2: Contractions & Common Errors**
- dont → don't
- wont → won't
- cant → can't
- doesnt → doesn't
- isnt → isn't
- arent → aren't
- wasnt → wasn't
- werent → weren't
- didnt → didn't

**Priority 3: Common Grammar Mistakes**
- go to the store/school/park → go to store/school/park
- breads → bread (uncountable)
- telled → told (past tense)
- peoples → people (already plural)

**Priority 4: Basic Formatting**
- Capitalize first letter of sentences
- Add periods at sentence endings
- Remove extra spaces

**Output Format:**
Return JSON: {"corrected": "corrected text", "explanation": "clear explanation of all corrections made"}

**Important Rules:**
- Correct ALL errors found in the text
- Provide clear explanations for each correction
- If no errors, return: {"corrected": "original text", "explanation": "No errors found"}
- Keep changes minimal but effective`
        }, {
          role: 'user',
          content: `Please check and correct this English text for grammar errors: "${text}"`
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

      // 2. DeepSeek API (highest priority for accurate grammar checking)
      const deepseekResult = await callDeepSeek(env, text);
      if (deepseekResult) {
        result = deepseekResult;
      } else {
        // 3. Sentence ending check
        const sentenceResult = checkSentenceEndings(text);
        if (sentenceResult) {
          result = sentenceResult;
        } else {
          // 4. Regex pattern matching
          const regexResult = checkRegexPatterns(text);
          if (regexResult) {
            result = regexResult;
          } else {
            // 5. Knowledge base lookup
            const kbResult = await queryKnowledgeBase(env, text);
            if (kbResult) {
              result = kbResult;
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
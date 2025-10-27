interface Env {
  LANGUAGE_CACHE: KVNamespace;
  DB: D1Database;
  AI: any;
  DEEPSEEk_API_KEY: string;
}

interface CorrectionResult {
  corrected: string;
  explanation: string;
}

interface EssayCorrectionResult {
  success: boolean;
  original_essay: string;
  level: string;
  type: string;
  correction_id: string;
  timestamp: string;
  corrected_text: string;
  corrections: Array<{
    type: string;
    original: string;
    corrected: string;
    explanation: string;
    position?: { start: number; end: number };
  }>;
  overall_feedback: {
    score: number;
    strengths: string[];
    improvements: string[];
    suggestions: string;
  };
  grammar_score: number;
  vocabulary_score: number;
  structure_score: number;
  fluency_score: number;
}

interface Pattern {
  pattern: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
  explanation: string;
}

const PATTERNS: Pattern[] = [
  // 英作文特化：基本文法
  { pattern: /\b(I)\s+(are)\b/g, replacement: '$1 am', explanation: 'Subject-verb agreement: use "am" with I' },
  { pattern: /\b(he|she|it)\s+(are)\b/gi, replacement: '$1 is', explanation: 'Subject-verb agreement: use "is" with he/she/it' },
  { pattern: /\b(they|we|you)\s+(is)\b/gi, replacement: '$1 are', explanation: 'Subject-verb agreement: use "are" with they/we/you' },
  { pattern: /\b(I)\s+(is)\b/g, replacement: '$1 am', explanation: 'Subject-verb agreement: use "am" with I' },

  // 英作文特化：時制と動詞形
  { pattern: /\b(I|he|she|it|we|they)\s+(go)\s+to\s+the\s+(store|school|park|beach|movies)\b/gi, replacement: '$1 $2 to $3', explanation: 'Remove unnecessary "the" before place names' },
  { pattern: /\byesterday\s+(I|he|she|we|they)\s+(go)\b/gi, replacement: 'Yesterday $1 $2', explanation: 'Use past tense: "went" instead of "go"' },
  { pattern: /\btomorrow\s+(I|he|she|we|they)\s+(will\s+go)\b/gi, replacement: 'Tomorrow $1 will go', explanation: 'Redundant: "will go" is implied' },

  // 英作文特化：冠詞の適切な使用
  { pattern: /\b(a|an)\s+(hour|hour|university|university|unique|honest|useful)\b/gi, replacement: 'an $2', explanation: 'Use "an" before words starting with vowel sounds' },
  { pattern: /\b(a)\s+(european|university|hour|honest)\b/gi, replacement: 'an $2', explanation: 'Use "an" before words starting with vowel sounds' },
  { pattern: /\b(the)\s+(school|hospital|park|cinema|theater|internet)\b/gi, replacement: '$2', explanation: 'Remove unnecessary "the" before specific place names' },

  // 英作文特化：前置詞と自然な表現
  { pattern: /\bin\s+(the)\s+(home|school|office|city)\b/gi, replacement: 'at $3', explanation: 'Use "at" instead of "in the" for buildings/places' },
  { pattern: /\bon\s+(the)\s+(weekend|holiday|morning|evening)\b/gi, replacement: 'over $3', explanation: 'Use "over" instead of "on the" for time periods' },
  { pattern: /\binterested\s+(for)\s+(to)\s+learn/gi, replacement: 'interested in learning', explanation: 'Use "interested in" instead of "interested for to learn"' },

  // 英作文特化：頻出間違い
  { pattern: /\b(very|really|quite|rather)\s+(too|very|really|quite)\b/gi, replacement: '$1', explanation: 'Remove redundant intensifiers' },
  { pattern: /\bbecause\s+(of)\s+(this|that|it)\b/gi, replacement: 'because $3', explanation: 'Remove unnecessary "of" after "because"' },
  { pattern: /\bdue\s+(to)\s+(the\s+fact|because)\b/gi, replacement: 'due to', explanation: 'Redundant: use only "due to" or "because"' },
  { pattern: /\b(ask|tell|say)\s+(me)\s+(about)\s+(of)\b/gi, replacement: '$1 me about $4', explanation: 'Remove redundant "of" after "about"' },

  // 一般的な短縮形の誤り
  { pattern: /\bdont\b/gi, replacement: "don't", explanation: 'Use apostrophe in contractions: "don\'t"' },
  { pattern: /\bwont\b/gi, replacement: "won't", explanation: 'Use apostrophe in contractions: "won\'t"' },
  { pattern: /\bcant\b/gi, replacement: "can't", explanation: 'Use apostrophe in contractions: "can\'t"' },
  { pattern: /\bdoesnt\b/gi, replacement: "doesn't", explanation: 'Use apostrophe in contractions: "doesn\'t"' },
  { pattern: /\bisnt\b/gi, replacement: "isn't", explanation: 'Use apostrophe in contractions: "isn\'t"' },
  { pattern: /\barent\b/gi, replacement: "aren't", explanation: 'Use apostrophe in contractions: "aren\'t"' },
  { pattern: /\bwasnt\b/gi, replacement: "wasn't", explanation: 'Use apostrophe in contractions: "wasn\'t"' },
  { pattern: /\bwerent\b/gi, replacement: "weren't", explanation: 'Use apostrophe in contractions: "weren\'t"' },
  { pattern: /\bdidnt\b/gi, replacement: "didn't", explanation: 'Use apostrophe in contractions: "didn\'t"' },

  // 一般的な間違い（維持）
  { pattern: /\b(go)\s+to\s+the\s+(store|school|park|hospital|library)\b/gi, replacement: 'go to $1', explanation: 'Remove "the" after "go to" for places' },
  { pattern: /\bbread(s)?\b/gi, replacement: 'bread', explanation: '"Bread" is usually uncountable' },
  { pattern: /\btelled\b/gi, replacement: 'told', explanation: 'Past tense of "tell" is "told"' },
  { pattern: /\bpeoples?\b/gi, replacement: 'people', explanation: '"People" is already plural' },

  // 基本的なルール（維持）
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
    const isMatch = pattern.test(corrected);
    if (isMatch) {
      corrected = typeof replacement === 'function'
        ? corrected.replace(pattern, replacement as any)
        : corrected.replace(pattern, replacement as string);
      explanations.push(explanation);
    }
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
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
  if (!env.DEEPSEEk_API_KEY) {
    console.error('DEEPSEEk_API_KEY is not set');
    return null;
  }

  console.log('Calling DeepSeek API for text:', text.substring(0, 50));

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DEEPSEEk_API_KEY}`,
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

**Correction Principles:**
- Make minimal necessary changes
- Explain reasoning for each correction
- Preserve original meaning and tone
- Suggest alternatives when multiple options exist
- Consider the writer's likely intent

**Output Format:**
Return JSON: {"corrected": "improved English text", "explanation": "detailed correction feedback"}

**Quality Standards:**
- If the text is already excellent: {"corrected": "original", "explanation": "Well-written with natural English expression"}
- Always provide constructive feedback
- Focus on clarity, accuracy, and naturalness`
        }, {
          role: 'user',
          content: `Please check and correct this English text for grammar errors and improve natural English expression: "${text}"`
        }],
        max_tokens: 300,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DeepSeek API error: ${response.status} - ${errorText}`);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in DeepSeek response');
      throw new Error('No content in DeepSeek response');
    }

    console.log('DeepSeek response received, length:', content.length);
    console.log('DeepSeek raw content:', content);

    // JSONを安全にパース
    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned content:', cleanedContent);
      const result = JSON.parse(cleanedContent);

      // AIがピリオドを追加しない場合に備える
      if (result.corrected && !result.corrected.match(/[.!?]$/) &&
          text.length > 5 && !text.match(/[.!?]/)) {
        result.corrected = result.corrected + '.';
        if (result.explanation === 'No errors found') {
          result.explanation = 'Add period at the end of the sentence';
        }
      }

      // JSONを安全にパース

      return result;
    } catch (parseError) {
      console.error('Failed to parse DeepSeek response:', content);
      console.error('Parse error:', parseError);
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

// 英作文添削用のDeepSeek API呼び出し
async function callDeepSeekForEssay(env: Env, essay: string, level: string, type: string): Promise<EssayCorrectionResult | null> {
  if (!env.DEEPSEEk_API_KEY) return null;

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

  const prompt = `以下の英作文を添削してください。

レベル: ${level} - ${levelInstructions[level as keyof typeof levelInstructions]}
種類: ${type} - ${typeInstructions[type as keyof typeof typeInstructions]}

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

以下のJSON形式のみで出力してください（マークダウンのコードブロックは不要）:
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

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DEEPSEEk_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'system',
          content: `You are an expert English composition and writing correction system. Return ONLY valid JSON without any markdown formatting or code blocks.`
        }, {
          role: 'user',
          content: prompt
        }],
        max_tokens: 2048,
        temperature: 0.3
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
      const parsed = JSON.parse(cleanedContent);

      const correctionId = `essay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        original_essay: essay,
        level: level,
        type: type,
        correction_id: correctionId,
        timestamp: new Date().toISOString(),
        corrected_text: parsed.corrected_text || essay,
        corrections: parsed.corrections || [],
        overall_feedback: parsed.overall_feedback || {
          score: 70,
          strengths: ["Attempted to write in English"],
          improvements: ["Check grammar and spelling"],
          suggestions: "Please review your essay for basic errors."
        },
        grammar_score: parsed.grammar_score || 70,
        vocabulary_score: parsed.vocabulary_score || 70,
        structure_score: parsed.structure_score || 70,
        fluency_score: parsed.fluency_score || 70
      };
    } catch (parseError) {
      console.error('Failed to parse DeepSeek essay response:', content);
      return null;
    }
  } catch (error) {
    console.error('DeepSeek essay API error:', error);
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
      const url = new URL(request.url);
      const path = url.pathname;

      // 英作文添削エンドポイント
      if (path === '/essay/correct' && request.method === 'POST') {
        const { essay, level = 'intermediate', type = 'general' } = await request.json() as {
          essay: string;
          level?: string;
          type?: string;
        };

        if (!essay || typeof essay !== 'string') {
          return Response.json({ error: 'Invalid essay input' }, {
            status: 400,
            headers: corsHeaders
          });
        }

        if (essay.trim().length < 10) {
          return Response.json({
            success: false,
            error: '英文が短すぎます。10文字以上で入力してください。'
          }, { status: 400, headers: corsHeaders });
        }

        if (essay.length > 2000) {
          return Response.json({
            success: false,
            error: '英文が長すぎます。2000文字以内で入力してください。'
          }, { status: 400, headers: corsHeaders });
        }

        const result = await callDeepSeekForEssay(env, essay, level, type);

        if (!result) {
          return Response.json({
            success: false,
            error: '添削処理でエラーが発生しました。後でもう一度お試しください。'
          }, { status: 500, headers: corsHeaders });
        }

        return Response.json(result, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // 短文文法チェックエンドポイント（既存機能）
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

      // 2. DeepSeek API (highest priority for English composition correction)
      const deepseekResult = await callDeepSeek(env, text);
      console.log('DeepSeek result:', deepseekResult);
      if (deepseekResult) {
        result = deepseekResult;
      } else {
        // 3. Advanced pattern matching for common English errors
        const regexResult = checkRegexPatterns(text);

        // 4. Basic sentence structure check (apply both if needed)
        const sentenceResult = checkSentenceEndings(text);

        // Combine results if we have both types of corrections
        if (regexResult && sentenceResult) {
          result = {
            corrected: regexResult.corrected + (regexResult.corrected !== text ? '.' : ''),
            explanation: regexResult.explanation + '; ' + sentenceResult.explanation
          };
        } else if (regexResult) {
          result = regexResult;
        } else if (sentenceResult) {
          result = sentenceResult;
        } else {
          // 5. Knowledge base lookup for specific rules
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
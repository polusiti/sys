/**
 * Unified API Worker for polusiti/sys with AI Features
 * Handles authentication, passkey registration, user management, and AI-powered features
 * Includes English composition correction, audio generation, and math explanation
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // Route requests
            if (url.pathname === '/api/health' || url.pathname === '/') {
                return new Response(JSON.stringify({
                    status: 'ok',
                    service: 'unified-api-worker-with-ai',
                    database: 'connected',
                    timestamp: new Date().toISOString(),
                    version: 'ai-v1.0'
                }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            if (url.pathname === '/api/debug') {
                return new Response(JSON.stringify({
                    message: 'Debug endpoint working',
                    timestamp: new Date().toISOString()
                }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            if (url.pathname === '/api/auth/register' && request.method === 'POST') {
                return handleRegister(request, env, corsHeaders);
            }

            if (url.pathname.startsWith('/api/auth/passkey/')) {
                return handlePasskeyAuth(request, env, corsHeaders, url);
            }

            // 評価・コメントAPIエンドポイント
            if (url.pathname.startsWith('/api/ratings/')) {
                return handleRatingAPI(request, env, corsHeaders, url);
            }

            // AI機能APIエンドポイント
            if (url.pathname.startsWith('/api/ai/')) {
                return handleAIAPI(request, env, corsHeaders, url);
            }

            // 英作文添削APIエンドポイント
            if (url.pathname.startsWith('/api/english/')) {
                return handleEnglishAPI(request, env, corsHeaders, url);
            }

            // 音声生成APIエンドポイント
            if (url.pathname.startsWith('/api/audio/')) {
                return handleAudioAPI(request, env, corsHeaders, url);
            }

            // Legacy endpoints for compatibility
            if (url.pathname.startsWith('/api/d1/')) {
                return handleD1API(request, env, corsHeaders, url);
            }

            if (url.pathname.startsWith('/api/r2/')) {
                return handleR2API(request, env, corsHeaders, url);
            }

            // Unknown endpoint
            return new Response(JSON.stringify({
                error: 'Endpoint not found',
                path: url.pathname
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });

        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({
                error: 'Internal server error',
                details: error.message,
                timestamp: new Date().toISOString()
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }
};

/**
 * Handle AI API endpoints
 */
async function handleAIAPI(request, env, corsHeaders, url) {
    const path = url.pathname.replace('/api/ai', '');

    try {
        // AI機能状態確認
        if (path === '/status' && request.method === 'GET') {
            return new Response(JSON.stringify({
                success: true,
                data: {
                    available_models: {
                        text_generation: ['@cf/meta/llama-3.1-8b-instruct-fp8', '@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
                        text_embeddings: ['@cf/baai/bge-large-en-v1.5', '@cf/baai/bge-m3'],
                        tts: ['@cf/myshell-ai/melotts', '@cf/deepgram/aura-2-es'],
                        math: ['@cf/deepseek-ai/deepseek-math-7b-instruct'],
                        translation: ['@cf/meta/m2m100-1.2b']
                    },
                    features: {
                        english_correction: true,
                        audio_generation: true,
                        math_explanation: true,
                        question_generation: true,
                        translation: true
                    }
                }
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({
            error: 'AI endpoint not found',
            path: path
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('AI API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process AI request',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Handle English Composition API endpoints
 */
async function handleEnglishAPI(request, env, corsHeaders, url) {
    const path = url.pathname.replace('/api/english', '');

    try {
        // 英作文添削の提出
        if (path === '/compose' && request.method === 'POST') {
            return handleEnglishComposition(request, env, corsHeaders);
        }

        // 添削結果の取得
        if (path.match(/^\/compose\/([^\/]+)$/) && request.method === 'GET') {
            const compositionId = path.split('/')[2];
            return handleGetComposition(compositionId, request, env, corsHeaders);
        }

        // ユーザーの添削履歴
        if (path === '/compose/history' && request.method === 'GET') {
            return handleCompositionHistory(request, env, corsHeaders);
        }

        return new Response(JSON.stringify({
            error: 'English endpoint not found',
            path: path
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('English API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process English request',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Handle Audio Generation API endpoints
 */
async function handleAudioAPI(request, env, corsHeaders, url) {
    const path = url.pathname.replace('/api/audio', '');

    try {
        // 音声生成
        if (path === '/generate' && request.method === 'POST') {
            return handleAudioGeneration(request, env, corsHeaders);
        }

        // 音声ファイル取得
        if (path.match(/^\/([^\/]+)$/) && request.method === 'GET') {
            const audioId = path.substring(1);
            return handleGetAudio(audioId, request, env, corsHeaders);
        }

        // 音声ファイル削除
        if (path.match(/^\/([^\/]+)$/) && request.method === 'DELETE') {
            const audioId = path.substring(1);
            return handleDeleteAudio(audioId, request, env, corsHeaders);
        }

        return new Response(JSON.stringify({
            error: 'Audio endpoint not found',
            path: path
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Audio API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process audio request',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 英作文添削処理 - AutoRAG + SGIF実装
 */
async function handleEnglishComposition(request, env, corsHeaders) {
    const startTime = Date.now();

    try {
        const { userId, text, title = '' } = await request.json();

        if (!userId || !text) {
            return new Response(JSON.stringify({
                error: 'userId and text are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // テキスト長チェック（最大5000文字）
        if (text.length > 5000) {
            return new Response(JSON.stringify({
                error: 'Text is too long. Maximum 5000 characters allowed.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Cloudflare AIを使用した英作文添削
        const correctionResult = await correctEnglishComposition(text, env);

        const processingTime = Date.now() - startTime;

        // データベースに保存
        const result = await env.LEARNING_DB.prepare(`
            INSERT INTO english_compositions (
                user_id, original_text, corrected_text, error_analysis,
                suggestions, sgif_category, confidence_score, processing_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            userId,
            text,
            correctionResult.correctedText,
            JSON.stringify(correctionResult.errorAnalysis),
            JSON.stringify(correctionResult.suggestions),
            correctionResult.sgifCategory,
            correctionResult.confidenceScore,
            processingTime
        ).run();

        return new Response(JSON.stringify({
            success: true,
            data: {
                id: result.meta.last_row_id,
                originalText: text,
                correctedText: correctionResult.correctedText,
                errorAnalysis: correctionResult.errorAnalysis,
                suggestions: correctionResult.suggestions,
                sgifCategory: correctionResult.sgifCategory,
                confidenceScore: correctionResult.confidenceScore,
                processingTime: processingTime
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('English composition error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to correct English composition',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Cloudflare AIを使用した英作文添削 - SGIFフレームワーク実装
 */
async function correctEnglishComposition(text, env) {
    try {
        // SGIFシステムプロンプト
        const systemPrompt = `ROLE: You are an English writing correction instructor trained in the SafeProof Grammar Intelligence Framework (SGIF).

SGIF ERROR CATEGORIES:
S1: Semantic Misalignment - Words used in wrong context or meaning
S2: Syntactic Misconstruction - Incorrect sentence structure or word order
S3: Grammatical Particle Misuse - Wrong prepositions, articles, or particles
S4: Lexical/Collocational Mischoice - Inappropriate word choices or collocations
S5: Stylistic/Pragmatic Inappropriateness - Inappropriate tone, register, or style
S6: Coherence/Consistency Error - Lack of logical flow or consistency

TASK: Analyze the English text and provide corrections following this JSON format:
{
  "correctedText": "fully corrected version",
  "errorAnalysis": [
    {
      "original": "incorrect phrase",
      "corrected": "correct phrase",
      "category": "S1-S6",
      "explanation": "why this is wrong and why the correction is better",
      "position": {"start": 0, "end": 10}
    }
  ],
  "suggestions": [
    {
      "type": "vocabulary",
      "suggestion": "better word choice",
      "reason": "explanation"
    }
  ],
  "sgifCategory": "most relevant SGIF category",
  "confidenceScore": 0.85
}

Important: Return only valid JSON. Be constructive and educational in your corrections.`;

        // Cloudflare AIでテキスト添削
        const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Please correct this English text: ${text}` }
            ],
            temperature: 0.1,  // 低い温度で一貫性を確保
            max_tokens: 2000
        });

        // 結果をパース
        const aiResponse = response.response;
        let correctionResult;

        try {
            correctionResult = JSON.parse(aiResponse);
        } catch (parseError) {
            // JSONパース失敗時のフォールバック
            correctionResult = {
                correctedText: text,
                errorAnalysis: [],
                suggestions: [],
                sgifCategory: "S6",
                confidenceScore: 0.5
            };
        }

        // 必須フィールドの保証
        return {
            correctedText: correctionResult.correctedText || text,
            errorAnalysis: correctionResult.errorAnalysis || [],
            suggestions: correctionResult.suggestions || [],
            sgifCategory: correctionResult.sgifCategory || "S6",
            confidenceScore: correctionResult.confidenceScore || 0.7
        };

    } catch (error) {
        console.error('AI correction error:', error);
        // エラー時は元のテキストを返す
        return {
            correctedText: text,
            errorAnalysis: [],
            suggestions: [],
            sgifCategory: "S6",
            confidenceScore: 0.5
        };
    }
}

/**
 * 添削結果取得
 */
async function handleGetComposition(compositionId, request, env, corsHeaders) {
    try {
        const composition = await env.LEARNING_DB.prepare(`
            SELECT * FROM english_compositions WHERE id = ?
        `).bind(compositionId).first();

        if (!composition) {
            return new Response(JSON.stringify({
                error: 'Composition not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // JSONフィールドをパース
        composition.errorAnalysis = JSON.parse(composition.errorAnalysis || '[]');
        composition.suggestions = JSON.parse(composition.suggestions || '[]');

        return new Response(JSON.stringify({
            success: true,
            data: composition
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Get composition error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get composition',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 添削履歴取得
 */
async function handleCompositionHistory(request, env, corsHeaders) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        if (!userId) {
            return new Response(JSON.stringify({
                error: 'userId is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const compositions = await env.LEARNING_DB.prepare(`
            SELECT id, original_text, corrected_text, sgif_category, confidence_score,
                   processing_time, created_at
            FROM english_compositions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `).bind(userId, limit, offset).all();

        return new Response(JSON.stringify({
            success: true,
            data: {
                compositions: compositions.results,
                hasMore: compositions.results.length === limit
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Composition history error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get composition history',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 音声生成処理
 */
async function handleAudioGeneration(request, env, corsHeaders) {
    try {
        const { userId, text, subject = 'english', questionId } = await request.json();

        if (!userId || !text) {
            return new Response(JSON.stringify({
                error: 'userId and text are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // テキスト長チェック（最大1000文字）
        if (text.length > 1000) {
            return new Response(JSON.stringify({
                error: 'Text is too long. Maximum 1000 characters allowed.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Cloudflare AIで音声生成
        const audioResult = await generateAudioFromText(text, env);

        // R2に音声ファイルを保存
        const audioUrl = await saveAudioToR2(audioResult.audioData, userId, subject, env);

        // データベースに保存
        const result = await env.LEARNING_DB.prepare(`
            INSERT INTO audio_files (
                user_id, subject, question_id, text_content, audio_url,
                file_size, duration, generation_model
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            userId,
            subject,
            questionId || null,
            text,
            audioUrl,
            audioResult.fileSize,
            audioResult.duration,
            audioResult.model
        ).run();

        return new Response(JSON.stringify({
            success: true,
            data: {
                id: result.meta.last_row_id,
                audioUrl: audioUrl,
                duration: audioResult.duration,
                fileSize: audioResult.fileSize,
                model: audioResult.model,
                text: text
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Audio generation error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to generate audio',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Cloudflare AIで音声生成
 */
async function generateAudioFromText(text, env) {
    try {
        // MeloTTSモデルで音声生成
        const response = await env.AI.run('@cf/myshell-ai/melotts', {
            text: text
        });

        // 音声データとメタデータを返す
        return {
            audioData: response.audio,
            duration: response.duration || 0,
            fileSize: response.audio ? response.audio.length : 0,
            model: '@cf/myshell-ai/melotts'
        };

    } catch (error) {
        console.error('TTS generation error:', error);
        throw new Error('Failed to generate audio from text');
    }
}

/**
 * R2に音声ファイルを保存
 */
async function saveAudioToR2(audioData, userId, subject, env) {
    try {
        const fileName = `audio/${subject}/${userId}/${Date.now()}.mp3`;

        await env.QUESTA_BUCKET.put(fileName, audioData, {
            contentType: 'audio/mpeg'
        });

        return `https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/${fileName}`;

    } catch (error) {
        console.error('R2 upload error:', error);
        throw new Error('Failed to save audio to R2');
    }
}

/**
 * 音声ファイル取得
 */
async function handleGetAudio(audioId, request, env, corsHeaders) {
    try {
        const audio = await env.LEARNING_DB.prepare(`
            SELECT * FROM audio_files WHERE id = ?
        `).bind(audioId).first();

        if (!audio) {
            return new Response(JSON.stringify({
                error: 'Audio file not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            data: audio
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Get audio error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get audio',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 音声ファイル削除
 */
async function handleDeleteAudio(audioId, request, env, corsHeaders) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return new Response(JSON.stringify({
                error: 'userId is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // 音声ファイル情報取得
        const audio = await env.LEARNING_DB.prepare(`
            SELECT * FROM audio_files WHERE id = ? AND user_id = ?
        `).bind(audioId, userId).first();

        if (!audio) {
            return new Response(JSON.stringify({
                error: 'Audio file not found or access denied'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // R2からファイル削除
        const fileName = audio.audio_url.split('/').pop();
        const objectKey = `audio/${audio.subject}/${userId}/${fileName}`;

        try {
            await env.QUESTA_BUCKET.delete(objectKey);
        } catch (r2Error) {
            console.warn('Failed to delete from R2:', r2Error);
        }

        // データベースから削除
        await env.LEARNING_DB.prepare(`
            DELETE FROM audio_files WHERE id = ? AND user_id = ?
        `).bind(audioId, userId).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Audio file deleted successfully'
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Delete audio error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to delete audio',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// Note: 以下の関数は元のunified-api-worker.jsからコピーして追加する必要があります
// - handleRegister
// - handlePasskeyAuth
// - handleRatingAPI
// - handleD1API
// - handleR2API
// これらの関数は既存の実装を維持してください
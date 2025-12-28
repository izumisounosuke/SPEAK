import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { audioBase64, conversationHistory, textMessage } = await request.json()

    console.log('Chat API called:', {
      hasAudio: !!audioBase64,
      hasText: !!textMessage,
      historyLength: conversationHistory?.length || 0,
    })

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      console.error('API key not configured')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    // 利用可能なモデル名を使用（gemini-2.5-flash または gemini-flash-latest）
    // 音声入力に対応しているため gemini-2.5-flash を使用
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // System instructionを最初のメッセージに含める
    const systemPrompt = `You are an English conversation teacher. When you receive audio input, you MUST first transcribe EXACTLY what the user said in English, then respond in English.

CRITICAL: You must respond ONLY in valid JSON format with NO other text:
{
  "user_transcript": "The EXACT English words the user spoke (transcribe the audio accurately)",
  "ai_response_en": "Your English response to continue the conversation",
  "ai_response_jp": "Japanese translation of your English response"
}

RULES:
1. user_transcript MUST contain the actual English words from the audio - transcribe it accurately
2. If the audio is unclear, write what you heard as best as possible
3. Return ONLY the JSON object - no markdown, no code blocks, no explanations, no extra text
4. The JSON must be valid and parseable
5. RESPONSE LENGTH (STRICT): Your English response (ai_response_en) MUST be SHORT and MUST NOT exceed 200 characters (not words). Aim for 1-2 sentences maximum. If your response exceeds 200 characters, it will be rejected. Keep responses extremely brief and concise
6. NO MARKUP: STRICTLY PROHIBITED to use any markdown or formatting symbols such as asterisks (*), bold markers (**), or any other decorative markup in ai_response_en or ai_response_jp. Use plain text only
7. CONVERSATION FLOW: Always ask questions to the user to maintain conversation tempo and continuity. Prioritize keeping the conversation engaging and active
8. JSON FORMAT STRICT: You MUST maintain the exact JSON structure specified above. Do not deviate from this format under any circumstances`

    // 会話履歴を構築（Gemini APIの形式に合わせる）
    const history = conversationHistory?.map((msg: { role: string; parts: string }) => {
      try {
        // partsが文字列の場合はJSONとしてパースを試みる
        let partsContent = msg.parts
        if (typeof partsContent === 'string') {
          try {
            const parsed = JSON.parse(partsContent)
            if (parsed.ai_response_en) {
              // AI応答の場合は英語応答をテキストとして使用
              partsContent = parsed.ai_response_en
            }
          } catch {
            // JSONでない場合はそのまま使用
          }
        }
        return {
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: String(partsContent) }],
        }
      } catch (e) {
        return {
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: String(msg.parts) }],
        }
      }
    }) || []

    // リクエストを構築（systemInstructionを使わない）
    const chat = model.startChat({
      history: history,
    })

    let result

    // テキストメッセージがある場合（会話開始時）
    if (textMessage) {
      // 最初のメッセージにシステムプロンプトを含める
      const fullMessage = history.length === 0 
        ? `${systemPrompt}\n\n${textMessage}`
        : textMessage
      result = await chat.sendMessage(fullMessage)
    } 
    // 音声データがある場合
    else if (audioBase64) {
      // 最初のメッセージの場合はシステムプロンプトを含める
      if (history.length === 0) {
        result = await chat.sendMessage([
          { text: systemPrompt },
          {
            inlineData: {
              data: audioBase64,
              mimeType: 'audio/webm',
            },
          },
        ])
      } else {
        result = await chat.sendMessage([
          {
            inlineData: {
              data: audioBase64,
              mimeType: 'audio/webm',
            },
          },
        ])
      }
    } else {
      return NextResponse.json(
        { error: 'No audio or text provided' },
        { status: 400 }
      )
    }

    const response = await result.response
    let text = response.text()
    
    console.log('Gemini response text (full):', text)
    console.log('Gemini response text (first 500 chars):', text.substring(0, 500))

    // マークダウンのコードブロック記号を削除（```json と ```）
    text = text.trim()
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    text = text.trim()

    // JSONをパース
    let jsonResponse
    try {
      jsonResponse = JSON.parse(text)
      console.log('Parsed JSON response:', JSON.stringify(jsonResponse, null, 2))
      
      // user_transcriptが空またはデフォルト値の場合は警告
      if (!jsonResponse.user_transcript || jsonResponse.user_transcript === '音声を認識しました') {
        console.warn('Warning: user_transcript is missing or default value')
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.log('Raw response text (full):', text)
      
      // JSONパースに失敗した場合、英語の応答を抽出してDeepLで翻訳
      const englishResponse = text.trim()
      
      // DeepL APIで日本語に翻訳
      let japaneseTranslation = '応答を解析できませんでした'
      try {
        const deeplApiKey = process.env.DEEPL_API_KEY
        if (deeplApiKey) {
          const translateResponse = await fetch('https://api-free.deepl.com/v2/translate', {
            method: 'POST',
            headers: {
              'Authorization': `DeepL-Auth-Key ${deeplApiKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              text: englishResponse,
              source_lang: 'EN',
              target_lang: 'JA',
            }),
          })
          
          if (translateResponse.ok) {
            const translateData = await translateResponse.json()
            japaneseTranslation = translateData.translations[0].text
          }
        }
      } catch (translateError) {
        console.error('Translation error:', translateError)
      }
      
      jsonResponse = {
        user_transcript: textMessage || '音声を認識しました',
        ai_response_en: englishResponse,
        ai_response_jp: japaneseTranslation,
      }
    }
    
    return NextResponse.json(jsonResponse)
  } catch (error: any) {
    console.error('Chat API error:', error)
    const errorMessage = error?.message || 'Failed to process chat request'
    return NextResponse.json(
      { error: errorMessage, details: error?.toString() },
      { status: 500 }
    )
  }
}


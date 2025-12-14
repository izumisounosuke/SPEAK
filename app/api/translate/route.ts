import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLang, targetLang } = await request.json()

    const apiKey = process.env.DEEPL_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // DeepL API v2を使用
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: text,
        source_lang: sourceLang,
        target_lang: targetLang,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DeepL API error:', errorText)
      return NextResponse.json(
        { error: 'Translation failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ translatedText: data.translations[0].text })
  } catch (error) {
    console.error('Translate API error:', error)
    return NextResponse.json(
      { error: 'Failed to translate' },
      { status: 500 }
    )
  }
}







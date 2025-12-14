import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // REST APIで直接利用可能なモデルをリストアップ
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Failed to list models: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // generateContentをサポートするモデルをフィルタリング
    const availableModels = data.models
      ?.filter((model: any) => 
        model.supportedGenerationMethods?.includes('generateContent')
      )
      .map((model: any) => ({
        name: model.name,
        displayName: model.displayName,
        supportedMethods: model.supportedGenerationMethods,
      })) || []

    return NextResponse.json({
      allModels: data.models?.map((m: any) => m.name) || [],
      availableForGenerateContent: availableModels,
    })
  } catch (error: any) {
    console.error('Error listing models:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}





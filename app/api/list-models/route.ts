import { GoogleGenerativeAI } from '@google/generative-ai'
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

    const genAI = new GoogleGenerativeAI(apiKey)
    
    // 利用可能なモデルをリストアップ
    // 注意: @google/generative-aiパッケージには直接ListModelsメソッドがないため、
    // 一般的なモデル名を試す
    const modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-001',
      'gemini-1.5-flash-latest',
    ]

    const availableModels = []
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        // 簡単なテストリクエストを送信してモデルが利用可能か確認
        const result = await model.generateContent('test')
        await result.response
        availableModels.push(modelName)
      } catch (error: any) {
        console.log(`Model ${modelName} is not available:`, error.message)
      }
    }

    return NextResponse.json({ availableModels })
  } catch (error: any) {
    console.error('Error listing models:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}







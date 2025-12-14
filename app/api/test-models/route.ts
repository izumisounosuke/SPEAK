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
    
    // 試すモデル名のリスト
    const modelsToTry = [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-002',
      'gemini-1.5-pro-002',
      'gemini-1.5-flash-001',
      'gemini-pro',
      'gemini-1.0-pro',
    ]

    const results: { model: string; status: string; error?: string }[] = []

    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing model: ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })
        // 簡単なテストリクエスト
        const result = await model.generateContent('Hello')
        const response = await result.response
        const text = response.text()
        results.push({
          model: modelName,
          status: 'success',
        })
        console.log(`✓ ${modelName} works!`)
        // 最初に動作したモデルが見つかったら終了
        break
      } catch (error: any) {
        const errorMsg = error?.message || 'Unknown error'
        results.push({
          model: modelName,
          status: 'failed',
          error: errorMsg,
        })
        console.log(`✗ ${modelName} failed: ${errorMsg}`)
      }
    }

    const workingModel = results.find(r => r.status === 'success')
    
    return NextResponse.json({
      workingModel: workingModel?.model || null,
      allResults: results,
    })
  } catch (error: any) {
    console.error('Error testing models:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}





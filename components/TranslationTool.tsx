'use client'

import { useState } from 'react'
import { Languages, ArrowRightLeft } from 'lucide-react'

export default function TranslationTool() {
  const [inputText, setInputText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('JA')
  const [targetLang, setTargetLang] = useState('EN')
  const [isTranslating, setIsTranslating] = useState(false)

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      return
    }

    setIsTranslating(true)
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          sourceLang: sourceLang,
          targetLang: targetLang,
        }),
      })

      if (!response.ok) {
        throw new Error('Translation failed')
      }

      const data = await response.json()
      setTranslatedText(data.translatedText)
    } catch (error) {
      console.error('Translation error:', error)
      alert('翻訳に失敗しました。もう一度お試しください。')
    } finally {
      setIsTranslating(false)
    }
  }

  const swapLanguages = () => {
    const temp = sourceLang
    setSourceLang(targetLang)
    setTargetLang(temp)
    setInputText(translatedText)
    setTranslatedText(inputText)
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Languages className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">DeepL翻訳ツール</h2>
        </div>

        <div className="space-y-4">
          {/* 言語選択 */}
          <div className="flex items-center gap-4">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="JA">日本語</option>
              <option value="EN">英語</option>
            </select>

            <button
              onClick={swapLanguages}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="言語を入れ替え"
            >
              <ArrowRightLeft className="w-5 h-5 text-gray-600" />
            </button>

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="JA">日本語</option>
              <option value="EN">英語</option>
            </select>
          </div>

          {/* 入力エリア */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {sourceLang === 'JA' ? '日本語' : '英語'} テキスト
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={sourceLang === 'JA' ? '日本語を入力...' : 'Enter English text...'}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 翻訳ボタン */}
          <button
            onClick={handleTranslate}
            disabled={!inputText.trim() || isTranslating}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isTranslating ? '翻訳中...' : '翻訳'}
          </button>

          {/* 出力エリア */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {targetLang === 'JA' ? '日本語' : '英語'} 翻訳結果
            </label>
            <div className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 overflow-y-auto">
              {translatedText || (
                <span className="text-gray-400">
                  {targetLang === 'JA' ? '翻訳結果がここに表示されます' : 'Translation will appear here'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}







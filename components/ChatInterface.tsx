'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Volume2, Languages, ArrowRightLeft, Settings, X } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  userTranscript?: string
  userTranscriptEn?: string
  userTranscriptJp?: string
  aiResponseEn?: string
  aiResponseJp?: string
}

export default function ChatInterface() {
  const [isStarted, setIsStarted] = useState(false)
  const [showTopicModal, setShowTopicModal] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  
  // 翻訳ツールの状態
  const [translationInput, setTranslationInput] = useState('')
  const [translationOutput, setTranslationOutput] = useState('')
  const [translationSourceLang, setTranslationSourceLang] = useState('EN')
  const [translationTargetLang, setTranslationTargetLang] = useState('JA')
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslationModal, setShowTranslationModal] = useState(false)
  
  // 設定の状態
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [speechRate, setSpeechRate] = useState(1.0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // トピック選択肢
  const topics = [
    '日常会話',
    '旅行',
    '仕事・ビジネス',
  ]

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const startConversation = () => {
    setIsStarted(true)
    setShowTopicModal(true)
  }

  const handleTopicSelect = async (topic: string) => {
    setSelectedTopic(topic)
    setShowTopicModal(false)
    
    // 会話開始メッセージをAIに送信
    const startMessage = `Let's start a conversation about ${topic}. Please greet me in English.`
    
    try {
      setIsProcessing(true)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: '',
          conversationHistory: [],
          textMessage: startMessage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `API request failed with status ${response.status}`)
      }

      const data = await response.json()
      
      setMessages([{
        role: 'assistant',
        aiResponseEn: data.ai_response_en || data.aiResponseEn,
        aiResponseJp: data.ai_response_jp || data.aiResponseJp,
      }])

      // 音声読み上げ
      if (data.ai_response_en || data.aiResponseEn) {
        speakText(data.ai_response_en || data.aiResponseEn)
      }

      setConversationHistory([
        { role: 'user', parts: startMessage },
        { role: 'model', parts: JSON.stringify(data) },
      ])
    } catch (error: any) {
      console.error('Error starting conversation:', error)
      alert(`エラーが発生しました: ${error?.message || '不明なエラー'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const startRecording = async () => {
    try {
      // 音声読み上げを中断
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await sendAudioToAPI(audioBlob)
        
        // ストリームを停止
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendAudioToAPI = async (audioBlob: Blob) => {
    try {
      setIsSending(true)
      
      // BlobをBase64に変換
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1]

          setIsSending(false)
          setIsProcessing(true)

          // タイムアウト処理（30秒）
          const timeoutId = setTimeout(() => {
            setIsProcessing(false)
            alert('リクエストがタイムアウトしました。もう一度お試しください。')
          }, 30000)

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              conversationHistory: conversationHistory,
            }),
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(errorData.error || `API request failed with status ${response.status}`)
          }

          const data = await response.json()
          console.log('API response:', data)

          // エラーチェック
          if (data.error) {
            throw new Error(data.error)
          }

          // ユーザーの発言を英語と日本語で取得
          const userTranscriptEn = data.user_transcript_en || data.userTranscriptEn || data.user_transcript || data.userTranscript || ''
          const userTranscriptJp = data.user_transcript_jp || data.userTranscriptJp || ''
          
          // ユーザーの発言が英語のみの場合、日本語に翻訳
          let finalUserTranscriptJp = userTranscriptJp
          if (!finalUserTranscriptJp && userTranscriptEn && userTranscriptEn !== '音声を認識しました' && userTranscriptEn.trim() !== '') {
            try {
              const translateResponse = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: userTranscriptEn,
                  sourceLang: 'EN',
                  targetLang: 'JA',
                }),
              })
              if (translateResponse.ok) {
                const translateData = await translateResponse.json()
                finalUserTranscriptJp = translateData.translatedText
              }
            } catch (e) {
              console.error('Translation error:', e)
            }
          }

          // メッセージを追加（ユーザーの発言も含める）
          const newMessage: Message = {
            role: 'assistant',
            userTranscriptEn: userTranscriptEn && userTranscriptEn !== '音声を認識しました' ? userTranscriptEn : '',
            userTranscriptJp: finalUserTranscriptJp,
            aiResponseEn: data.ai_response_en || data.aiResponseEn || '',
            aiResponseJp: data.ai_response_jp || data.aiResponseJp || '',
          }

          setMessages((prev) => [...prev, newMessage])

          // 会話履歴を更新
          setConversationHistory((prev) => [
            ...prev,
            { role: 'user', parts: userTranscriptEn || data.user_transcript || data.userTranscript },
            { role: 'model', parts: JSON.stringify(data) },
          ])

          // 音声読み上げ
          if (data.ai_response_en || data.aiResponseEn) {
            speakText(data.ai_response_en || data.aiResponseEn)
          }
        } catch (error: any) {
          console.error('Error in sendAudioToAPI:', error)
          alert(`エラーが発生しました: ${error?.message || '不明なエラー'}`)
        } finally {
          setIsSending(false)
          setIsProcessing(false)
        }
      }

      reader.onerror = () => {
        setIsSending(false)
        setIsProcessing(false)
        alert('音声データの読み込みに失敗しました。')
      }

      reader.readAsDataURL(audioBlob)
    } catch (error: any) {
      console.error('Error sending audio:', error)
      alert(`エラーが発生しました: ${error?.message || '不明なエラー'}`)
      setIsSending(false)
      setIsProcessing(false)
    }
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = speechRate
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleTextClick = (text: string) => {
    speakText(text)
  }

  const handleQuickTranslate = async () => {
    if (!translationInput.trim()) return

    setIsTranslating(true)
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: translationInput,
          sourceLang: translationSourceLang,
          targetLang: translationTargetLang,
        }),
      })

      if (!response.ok) {
        throw new Error('Translation failed')
      }

      const data = await response.json()
      setTranslationOutput(data.translatedText)
    } catch (error) {
      console.error('Translation error:', error)
      alert('翻訳に失敗しました。もう一度お試しください。')
    } finally {
      setIsTranslating(false)
    }
  }

  const swapTranslationLanguages = () => {
    const temp = translationSourceLang
    setTranslationSourceLang(translationTargetLang)
    setTranslationTargetLang(temp)
    setTranslationInput(translationOutput)
    setTranslationOutput(translationInput)
  }

  // 翻訳言語の自動切り替えロジック
  const handleSourceLangChange = (newLang: string) => {
    setTranslationSourceLang(newLang)
    // 入力言語を変更したら、出力言語を自動的に反対にする
    if (newLang === 'EN') {
      setTranslationTargetLang('JA')
    } else if (newLang === 'JA') {
      setTranslationTargetLang('EN')
    }
  }

  const handleTargetLangChange = (newLang: string) => {
    setTranslationTargetLang(newLang)
    // 出力言語を変更したら、入力言語を自動的に反対にする
    if (newLang === 'EN') {
      setTranslationSourceLang('JA')
    } else if (newLang === 'JA') {
      setTranslationSourceLang('EN')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">AI英会話アプリ</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTranslationModal(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="翻訳ツール"
            >
              <Languages className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="設定"
            >
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col max-w-4xl mx-auto w-full px-4">
            {!isStarted ? (
              <div className="flex-1 flex items-center justify-center">
                <button
                  onClick={startConversation}
                  className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  英会話を始める
                </button>
              </div>
            ) : (
              <>
                {/* チャットエリア */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <>
                            {/* ユーザーの発言認識結果 */}
                            {message.userTranscriptEn && message.userTranscriptEn !== '音声を認識しました' && (
                              <div className="mb-3 pb-3 border-b border-gray-200">
                                <div className="text-xs font-semibold text-gray-500 mb-1">あなたの発言:</div>
                                <div className="text-sm font-medium text-gray-800 mb-1">
                                  {message.userTranscriptEn}
                                </div>
                                {message.userTranscriptJp && (
                                  <div className="text-xs text-gray-600">
                                    {message.userTranscriptJp}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* AIの応答 */}
                            {message.aiResponseEn && (
                              <div
                                className="text-base mb-2 cursor-pointer hover:underline flex items-center gap-2"
                                onClick={() => handleTextClick(message.aiResponseEn!)}
                              >
                                <Volume2 className="w-4 h-4" />
                                {message.aiResponseEn}
                              </div>
                            )}
                            {message.aiResponseJp && (
                              <div className="text-sm text-gray-600">
                                {message.aiResponseJp}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {(isRecording || isSending || isProcessing) && (
                    <div className="flex justify-start">
                      <div className="bg-blue-50 rounded-lg px-4 py-3 shadow-sm border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                          <span className="text-sm text-blue-700 font-medium">
                            {isRecording ? '録音中...' : isSending ? '送信中...' : '考え中...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* 録音コントロールと翻訳ツール */}
                <div className="border-t border-gray-200 bg-white px-4 py-4 space-y-4">
                  {/* 録音ボタン */}
                  <div className="flex justify-center items-center gap-4">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        <Mic className="w-5 h-5" />
                        録音開始
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors shadow-lg animate-pulse"
                      >
                        <MicOff className="w-5 h-5" />
                        送信（録音終了）
                      </button>
                    )}
                  </div>

                </div>
              </>
            )}
          </div>
      </main>

      {/* トピック選択モーダル */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">トピックを選択してください</h2>
            <div className="space-y-3 mb-4">
              {topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicSelect(topic)}
                  className="w-full px-4 py-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                >
                  {topic}
                </button>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自由入力
              </label>
              <input
                type="text"
                placeholder="トピックを入力..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    handleTopicSelect(e.currentTarget.value)
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 翻訳ツールモーダル */}
      {showTranslationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] flex flex-col">
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Languages className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">翻訳ツール</h2>
              </div>
              <button
                onClick={() => setShowTranslationModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="閉じる"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* モーダルコンテンツ */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {/* 言語選択 */}
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={translationSourceLang}
                  onChange={(e) => handleSourceLangChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                >
                  <option value="EN">英語</option>
                  <option value="JA">日本語</option>
                </select>

                <button
                  onClick={swapTranslationLanguages}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="言語を入れ替え"
                >
                  <ArrowRightLeft className="w-5 h-5 text-gray-600" />
                </button>

                <select
                  value={translationTargetLang}
                  onChange={(e) => handleTargetLangChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                >
                  <option value="EN">英語</option>
                  <option value="JA">日本語</option>
                </select>
              </div>

              {/* 入力エリア */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {translationSourceLang === 'EN' ? '英語' : '日本語'} テキスト
                </label>
                <textarea
                  value={translationInput}
                  onChange={(e) => setTranslationInput(e.target.value)}
                  placeholder={translationSourceLang === 'EN' ? '英語を入力...' : '日本語を入力...'}
                  className="w-full h-32 md:h-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
                />
              </div>

              {/* 翻訳ボタン */}
              <button
                onClick={handleQuickTranslate}
                disabled={!translationInput.trim() || isTranslating}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base"
              >
                {isTranslating ? '翻訳中...' : '翻訳'}
              </button>

              {/* 出力エリア */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {translationTargetLang === 'JA' ? '日本語' : '英語'} 翻訳結果
                </label>
                <div className="w-full h-32 md:h-40 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 overflow-y-auto text-sm md:text-base">
                  {translationOutput || (
                    <span className="text-gray-400">
                      {translationTargetLang === 'JA' ? '翻訳結果がここに表示されます' : 'Translation will appear here'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 設定モーダル */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">設定</h2>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="閉じる"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* モーダルコンテンツ */}
            <div className="p-4 md:p-6 space-y-6">
              {/* 読み上げ速度設定 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    読み上げ速度
                  </label>
                  <span className="text-sm font-semibold text-blue-600">
                    {speechRate.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5x (遅い)</span>
                  <span>1.0x (標準)</span>
                  <span>2.0x (速い)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


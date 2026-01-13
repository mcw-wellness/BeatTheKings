'use client'

/**
 * Dev Page - Video Analysis Testing
 * Upload videos and see Gemini analysis results
 * For internal testing and prompt refinement
 * TODO: Hide or protect this page in production
 */

import { useState, useRef } from 'react'
import { MATCH_ANALYSIS_PROMPT } from '@/lib/gemini/prompts'

interface AnalysisResult {
  success: boolean
  promptUsed: string
  rawResponse: string
  parsedResult: {
    player1Score: number
    player2Score: number
    player1ShotsMade: number
    player1ShotsAttempted: number
    player2ShotsMade: number
    player2ShotsAttempted: number
    durationSeconds: number
    confidence: number
  } | null
  parseError: string | null
  metadata: {
    fileName: string
    fileSize: number
    contentType: string
    model: string
    analysisTimeMs: number
    geminiFile: { name: string; uri: string }
  }
  error?: string
}

export default function VideoAnalysisTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setVideoPreview(URL.createObjectURL(file))
      setResult(null)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('video', selectedFile)
      if (useCustomPrompt && customPrompt.trim()) {
        formData.append('prompt', customPrompt.trim())
      }

      const response = await fetch('/api/dev/analyze-video', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
      } as AnalysisResult)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-amber-400">Video Analysis Test</h1>
          <p className="text-gray-400 text-sm mt-1">
            Upload a video to test Gemini analysis. For internal testing only.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">1. Select Video</h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-600 rounded-lg p-8
                       hover:border-amber-500 transition-colors text-center"
          >
            {selectedFile ? (
              <div>
                <p className="text-amber-400 font-medium">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {formatBytes(selectedFile.size)} - {selectedFile.type}
                </p>
                <p className="text-gray-500 text-xs mt-2">Click to change</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-400">Click to select a video file</p>
                <p className="text-gray-500 text-sm mt-1">MP4, MOV, WebM supported</p>
              </div>
            )}
          </button>

          {/* Video Preview */}
          {videoPreview && (
            <div className="mt-4">
              <video src={videoPreview} controls className="w-full rounded-lg max-h-64 bg-black" />
            </div>
          )}
        </div>

        {/* Prompt Section */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">2. Prompt Configuration</h2>

          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useCustomPrompt}
              onChange={(e) => setUseCustomPrompt(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
            <span className="text-sm">Use custom prompt</span>
          </label>

          {useCustomPrompt ? (
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter your custom prompt..."
              className="w-full bg-gray-700 rounded-lg p-3 text-sm font-mono
                         min-h-[200px] resize-y border border-gray-600
                         focus:border-amber-500 focus:outline-none"
            />
          ) : (
            <div className="bg-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-2">Default prompt:</p>
              <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">
                {MATCH_ANALYSIS_PROMPT}
              </pre>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || isAnalyzing}
          className="w-full bg-amber-500 text-black font-bold py-3 rounded-lg
                     disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed
                     hover:bg-amber-400 transition-colors mb-4"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">&#9696;</span>
              Analyzing... (this may take 30-60s)
            </span>
          ) : (
            'Analyze Video'
          )}
        </button>

        {/* Results Section */}
        {result && (
          <div className="space-y-4">
            {/* Status */}
            <div
              className={`p-4 rounded-lg ${result.success ? 'bg-green-900/50' : 'bg-red-900/50'}`}
            >
              <h2 className="text-lg font-semibold mb-2">
                {result.success ? 'Analysis Complete' : 'Analysis Failed'}
              </h2>
              {result.error && <p className="text-red-400">{result.error}</p>}
              {result.metadata && (
                <div className="text-sm text-gray-300 space-y-1">
                  <p>Model: {result.metadata.model}</p>
                  <p>Analysis Time: {(result.metadata.analysisTimeMs / 1000).toFixed(1)}s</p>
                </div>
              )}
            </div>

            {/* Parsed Result */}
            {result.parsedResult && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-amber-400 mb-3">Parsed Result</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-900/30 rounded-lg p-3">
                    <h4 className="text-blue-400 font-medium mb-2">Player 1</h4>
                    <p className="text-2xl font-bold">{result.parsedResult.player1Score} pts</p>
                    <p className="text-sm text-gray-400">
                      {result.parsedResult.player1ShotsMade}/
                      {result.parsedResult.player1ShotsAttempted} shots (
                      {result.parsedResult.player1ShotsAttempted > 0
                        ? Math.round(
                            (result.parsedResult.player1ShotsMade /
                              result.parsedResult.player1ShotsAttempted) *
                              100
                          )
                        : 0}
                      %)
                    </p>
                  </div>
                  <div className="bg-red-900/30 rounded-lg p-3">
                    <h4 className="text-red-400 font-medium mb-2">Player 2</h4>
                    <p className="text-2xl font-bold">{result.parsedResult.player2Score} pts</p>
                    <p className="text-sm text-gray-400">
                      {result.parsedResult.player2ShotsMade}/
                      {result.parsedResult.player2ShotsAttempted} shots (
                      {result.parsedResult.player2ShotsAttempted > 0
                        ? Math.round(
                            (result.parsedResult.player2ShotsMade /
                              result.parsedResult.player2ShotsAttempted) *
                              100
                          )
                        : 0}
                      %)
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-400">
                  <p>Duration: {result.parsedResult.durationSeconds}s</p>
                  <p>Confidence: {(result.parsedResult.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
            )}

            {/* Parse Error */}
            {result.parseError && (
              <div className="bg-yellow-900/30 rounded-lg p-4">
                <h3 className="text-yellow-400 font-semibold mb-2">Parse Warning</h3>
                <p className="text-sm">{result.parseError}</p>
              </div>
            )}

            {/* Raw Response */}
            {result.rawResponse && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Raw Gemini Response</h3>
                <pre
                  className="bg-gray-900 rounded-lg p-3 text-xs font-mono
                               overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto"
                >
                  {result.rawResponse}
                </pre>
              </div>
            )}

            {/* Prompt Used */}
            {result.promptUsed && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Prompt Used</h3>
                <pre
                  className="bg-gray-900 rounded-lg p-3 text-xs font-mono
                               overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto"
                >
                  {result.promptUsed}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

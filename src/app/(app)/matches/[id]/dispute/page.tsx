'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

export default function DisputeMatchPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.id as string
  const [reason, setReason] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const disputeReasons = [
    {
      id: 'incorrect_score',
      label: 'Incorrect Score',
      description: 'The final score was counted incorrectly',
    },
    {
      id: 'wrong_winner',
      label: 'Wrong Winner',
      description: 'The system identified the wrong winner',
    },
    { id: 'missed_points', label: 'Missed Points', description: 'Some points were not counted' },
    {
      id: 'technical_issue',
      label: 'Technical Issue',
      description: 'Recording or verification had technical problems',
    },
    { id: 'other', label: 'Other', description: 'Different issue not listed above' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedReason) {
      alert('Please select a reason for the dispute')
      return
    }

    setIsSubmitting(true)

    try {
      await fetch(`/api/matches/${matchId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: selectedReason,
          details: reason,
        }),
      })

      // Navigate back to match details
      router.push(`/matches/${matchId}`)
    } catch (error) {
      console.error('Failed to submit dispute:', error)
      alert('Failed to submit dispute. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="h-dvh bg-white overflow-y-auto">
      <div className="px-3 py-2 space-y-3">
        {/* Header with Logo */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2">
            <div className="w-12 h-12 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dispute Match</h1>
              <p className="text-sm text-gray-500">Report an issue with this match</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 text-sm font-medium flex-shrink-0 mt-1"
          >
            ← Back
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-yellow-900 mb-1">Important:</p>
              <p className="text-xs text-yellow-800">
                Disputes should only be filed if you believe there was a genuine error in the match
                verification. False disputes may result in penalties.
              </p>
            </div>
          </div>
        </div>

        {/* Dispute Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Selection */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Select Dispute Reason</h2>

            <div className="space-y-3">
              {disputeReasons.map((disputeReason) => (
                <label
                  key={disputeReason.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedReason === disputeReason.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="dispute-reason"
                    value={disputeReason.id}
                    checked={selectedReason === disputeReason.id}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{disputeReason.label}</p>
                    <p className="text-xs text-gray-600 mt-1">{disputeReason.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Additional Details</h2>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide detailed information about the issue (optional but recommended)"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none text-sm min-h-32 resize-none"
            />

            <p className="text-xs text-gray-500 mt-2">
              Provide as much detail as possible to help our team review your dispute quickly.
            </p>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-blue-900 mb-3">What happens next:</h2>

            <div className="space-y-2 text-xs text-blue-800">
              <div className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <p>Our team will review the match recording and your dispute</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <p>We will investigate the issue you reported</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <p>Both players will be notified of the final decision within 24 hours</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">4.</span>
                <p>If the dispute is valid, the match result will be corrected</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedReason}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

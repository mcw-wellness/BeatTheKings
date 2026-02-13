'use client'

interface ActionButtonsProps {
  isSubmitting: boolean
  isGenerating: boolean
  onGenerate: () => void
  onSave: () => void
}

export function ActionButtons({
  isSubmitting,
  isGenerating,
  onGenerate,
  onSave,
}: ActionButtonsProps): JSX.Element {
  return (
    <div className="px-3 py-2 border-t border-white/10 relative z-10 shrink-0 flex gap-2">
      <button
        onClick={onGenerate}
        disabled={isSubmitting || isGenerating}
        className="flex-1 py-2.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-semibold rounded-lg transition-all disabled:opacity-50 border border-yellow-500/30 text-sm"
      >
        {isGenerating ? 'Generating...' : 'Generate Preview'}
      </button>
      <button
        onClick={onSave}
        disabled={isSubmitting || isGenerating}
        className="flex-1 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all disabled:opacity-50 border border-white/30 text-sm"
      >
        {isSubmitting ? 'Saving...' : 'Save Avatar'}
      </button>
    </div>
  )
}

interface TabBarProps<T extends string> {
  tabs: { id: T; label: string }[]
  activeTab: T
  setActiveTab: (tab: T) => void
}

export function TabBar<T extends string>({
  tabs,
  activeTab,
  setActiveTab,
}: TabBarProps<T>): JSX.Element {
  return (
    <div className="border-t border-white/10 relative z-10 shrink-0">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-max px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-white'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

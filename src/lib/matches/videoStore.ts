const videoBlobStore = new Map<string, Blob>()

export function setRecordedVideoBlob(matchId: string, blob: Blob): void {
  videoBlobStore.set(matchId, blob)
}

export function getRecordedVideoBlob(matchId: string): Blob | null {
  return videoBlobStore.get(matchId) || null
}

export function clearRecordedVideoBlob(matchId: string): void {
  videoBlobStore.delete(matchId)
}

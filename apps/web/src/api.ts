export type RiskLevel = 'low' | 'medium' | 'high'
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low'
export type ReviewLanguage = 'en' | 'pt-BR'

export interface ReviewFinding {
  category: 'bug' | 'security' | 'performance' | 'maintainability' | 'testing'
  confidence: number
  explanation: string
  file: string
  line: number | null
  recommendation: string
  severity: FindingSeverity
  title: string
}

export interface ReviewData {
  files: Array<{ additions: number; blobUrl: string; changes: number; deletions: number; filename: string; status: string }>
  model: string
  pullRequest: { additions: number; author: string; baseRef: string; changedFiles: number; deletions: number; headRef: string; number: number; title: string; url: string }
  repository: { fullName: string; url: string }
  review: { findings: ReviewFinding[]; riskLevel: RiskLevel; suggestedTests: string[]; summary: string }
  truncated: boolean
  usage: { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null }
}

export async function reviewPullRequest(url: string, language: ReviewLanguage): Promise<ReviewData> {
  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, url }),
  })
  const payload = (await response.json()) as { data?: ReviewData; error?: { message?: string } }
  if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? 'PRism could not complete the review.')
  return payload.data
}

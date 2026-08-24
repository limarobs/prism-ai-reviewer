import type { ReviewData, ReviewFinding, ReviewLanguage } from './api'

const numberFormatter = new Intl.NumberFormat('en-US')

function EvidenceLink({ finding, data }: { finding: ReviewFinding; data: ReviewData }) {
  const file = data.files.find((candidate) => candidate.filename === finding.file)
  const href = file ? `${file.blobUrl}${finding.line ? `#L${finding.line}` : ''}` : data.pullRequest.url
  return <a className="evidence-link" href={href} target="_blank" rel="noreferrer"><span>{finding.file}</span>{finding.line && <span className="line-number">L{finding.line}</span>}<span aria-hidden="true">↗</span></a>
}

const labels = {
  en: {
    risk: { low: 'Low risk', medium: 'Medium risk', high: 'High risk' },
    files: 'files', findings: 'findings', partial: 'This pull request exceeded the analysis limit. Results cover a partial diff.',
    summary: 'Summary', findingsLabel: 'Findings', check: 'What to check', clean: 'No material issues found',
    cleanDescription: 'The analyzed diff did not reveal a concrete defect.', confidence: 'confidence', fix: 'Recommended fix',
    tests: 'Tests', coverage: 'Suggested coverage', noTests: 'No additional test cases were suggested.', by: 'by',
  },
  'pt-BR': {
    risk: { low: 'Risco baixo', medium: 'Risco médio', high: 'Risco alto' },
    files: 'arquivos', findings: 'pontos', partial: 'Este pull request excedeu o limite de análise. O resultado cobre apenas parte do diff.',
    summary: 'Resumo', findingsLabel: 'Pontos encontrados', check: 'O que verificar', clean: 'Nenhum problema relevante encontrado',
    cleanDescription: 'O diff analisado não apresentou um defeito concreto.', confidence: 'de confiança', fix: 'Correção recomendada',
    tests: 'Testes', coverage: 'Cobertura sugerida', noTests: 'Nenhum teste adicional foi sugerido.', by: 'por',
  },
} as const

const translatedValues = {
  en: {
    severity: { critical: 'critical', high: 'high', medium: 'medium', low: 'low' },
    category: { bug: 'bug', security: 'security', performance: 'performance', maintainability: 'maintainability', testing: 'testing' },
  },
  'pt-BR': {
    severity: { critical: 'crítico', high: 'alto', medium: 'médio', low: 'baixo' },
    category: { bug: 'bug', security: 'segurança', performance: 'performance', maintainability: 'manutenção', testing: 'testes' },
  },
} as const

export function ReviewReport({ data, language }: { data: ReviewData; language: ReviewLanguage }) {
  const { pullRequest, repository, review } = data
  const text = labels[language]
  const values = translatedValues[language]
  return (
    <section className="report" aria-live="polite">
      <div className="report-heading">
        <div><a className="repo-name" href={repository.url} target="_blank" rel="noreferrer">{repository.fullName}</a><h2>{pullRequest.title}</h2><p className="branch-line">#{pullRequest.number} · {pullRequest.headRef} → {pullRequest.baseRef} · {text.by} {pullRequest.author}</p></div>
        <div className={`risk-badge risk-${review.riskLevel}`}><strong>{text.risk[review.riskLevel]}</strong></div>
      </div>
      <div className="change-stats" aria-label="Pull request statistics"><span>{pullRequest.changedFiles} {text.files}</span><span className="additions">+{numberFormatter.format(pullRequest.additions)}</span><span className="deletions">−{numberFormatter.format(pullRequest.deletions)}</span><span>{review.findings.length} {text.findings}</span></div>
      {data.truncated && <p className="notice">{text.partial}</p>}
      <div className="report-grid">
        <div className="report-main">
          <article className="summary-card"><p className="section-label">{text.summary}</p><p>{review.summary}</p></article>
          <div className="findings-heading"><div><p className="section-label">{text.findingsLabel}</p><h3>{text.check}</h3></div><span>{review.findings.length}</span></div>
          {review.findings.length === 0 ? <div className="clean-state"><span aria-hidden="true">✓</span><div><strong>{text.clean}</strong><p>{text.cleanDescription}</p></div></div> : (
            <div className="findings-list">{review.findings.map((finding, index) => <article className="finding-card" key={`${finding.file}-${finding.line}-${index}`}><div className="finding-meta"><span className={`severity severity-${finding.severity}`}>{values.severity[finding.severity]}</span><span>{values.category[finding.category]}</span><span>{Math.round(finding.confidence * 100)}% {text.confidence}</span></div><h4>{finding.title}</h4><p>{finding.explanation}</p><EvidenceLink finding={finding} data={data} /><div className="recommendation"><span>{text.fix}</span><p>{finding.recommendation}</p></div></article>)}</div>
          )}
        </div>
        <aside><div className="tests-card"><p className="section-label">{text.tests}</p><h3>{text.coverage}</h3>{review.suggestedTests.length > 0 ? <ol>{review.suggestedTests.map((test) => <li key={test}>{test}</li>)}</ol> : <p>{text.noTests}</p>}</div></aside>
      </div>
    </section>
  )
}

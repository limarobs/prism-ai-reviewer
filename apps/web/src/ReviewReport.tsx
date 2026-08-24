import type { ReviewData, ReviewFinding } from './api'

const numberFormatter = new Intl.NumberFormat('en-US')

function EvidenceLink({ finding, data }: { finding: ReviewFinding; data: ReviewData }) {
  const file = data.files.find((candidate) => candidate.filename === finding.file)
  const href = file ? `${file.blobUrl}${finding.line ? `#L${finding.line}` : ''}` : data.pullRequest.url
  return <a className="evidence-link" href={href} target="_blank" rel="noreferrer"><span>{finding.file}</span>{finding.line && <span className="line-number">L{finding.line}</span>}<span aria-hidden="true">↗</span></a>
}

export function ReviewReport({ data }: { data: ReviewData }) {
  const { pullRequest, repository, review } = data
  return (
    <section className="report" aria-live="polite">
      <div className="report-heading">
        <div><a className="repo-name" href={repository.url} target="_blank" rel="noreferrer">{repository.fullName}</a><h2>{pullRequest.title}</h2><p className="branch-line">#{pullRequest.number} · {pullRequest.headRef} → {pullRequest.baseRef} · by {pullRequest.author}</p></div>
        <div className={`risk-badge risk-${review.riskLevel}`}><span>Overall risk</span><strong>{review.riskLevel}</strong></div>
      </div>
      <div className="change-stats" aria-label="Pull request statistics"><span>{pullRequest.changedFiles} files</span><span className="additions">+{numberFormatter.format(pullRequest.additions)}</span><span className="deletions">−{numberFormatter.format(pullRequest.deletions)}</span><span>{review.findings.length} findings</span></div>
      {data.truncated && <p className="notice">This pull request exceeded the analysis limit. Results cover a partial diff.</p>}
      <div className="report-grid">
        <div className="report-main">
          <article className="summary-card"><p className="section-label">Summary</p><p>{review.summary}</p></article>
          <div className="findings-heading"><div><p className="section-label">Findings</p><h3>What to check</h3></div><span>{review.findings.length}</span></div>
          {review.findings.length === 0 ? <div className="clean-state"><span aria-hidden="true">✓</span><div><strong>No material issues found</strong><p>The analyzed diff did not reveal a concrete defect.</p></div></div> : (
            <div className="findings-list">{review.findings.map((finding, index) => <article className="finding-card" key={`${finding.file}-${finding.line}-${index}`}><div className="finding-meta"><span className={`severity severity-${finding.severity}`}>{finding.severity}</span><span>{finding.category}</span><span>{Math.round(finding.confidence * 100)}% confidence</span></div><h4>{finding.title}</h4><p>{finding.explanation}</p><EvidenceLink finding={finding} data={data} /><div className="recommendation"><span>Recommended fix</span><p>{finding.recommendation}</p></div></article>)}</div>
          )}
        </div>
        <aside><div className="tests-card"><p className="section-label">Tests</p><h3>Suggested coverage</h3>{review.suggestedTests.length > 0 ? <ol>{review.suggestedTests.map((test) => <li key={test}>{test}</li>)}</ol> : <p>No additional test cases were suggested.</p>}</div></aside>
      </div>
    </section>
  )
}

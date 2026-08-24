import { useState, type FormEvent } from 'react'
import { reviewPullRequest, type ReviewData } from './api'
import { ReviewReport } from './ReviewReport'

const EXAMPLE_URL = 'https://github.com/openai/openai-node/pull/1500'

export function App() {
  const [url, setUrl] = useState('')
  const [review, setReview] = useState<ReviewData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setReview(null)
    setIsLoading(true)
    try {
      setReview(await reviewPullRequest(url))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'The review failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="/" aria-label="PRism home"><span className="brand-mark" aria-hidden="true" /><span>PRism</span></a>
        <div className="header-note"><span className="status-dot" />Powered by Gemini</div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy"><p className="eyebrow">AI-assisted code review</p><h1>See every pull request through a clearer lens.</h1><p className="lede">PRism finds concrete risks, suggests missing tests, and grounds every observation in the code that changed.</p></div>
          <div className="hero-index" aria-hidden="true"><span>01</span><div /><small>Inspect<br />before merge</small></div>
        </section>
        <form className="review-form" onSubmit={handleSubmit}>
          <label htmlFor="pull-request-url">Public GitHub pull request</label>
          <div className="input-row">
            <span className="input-icon" aria-hidden="true">⌘</span>
            <input id="pull-request-url" name="pullRequestUrl" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://github.com/owner/repository/pull/42" required disabled={isLoading} />
            <button type="submit" disabled={isLoading}>{isLoading ? 'Analyzing…' : 'Review pull request'}{!isLoading && <span aria-hidden="true">→</span>}</button>
          </div>
          <p className="form-hint">Public repositories only. <button type="button" onClick={() => setUrl(EXAMPLE_URL)} disabled={isLoading}>Try an example</button></p>
        </form>
        {error && <div className="error-message" role="alert"><strong>Review failed.</strong> {error}</div>}
        {isLoading && <section className="loading-card" aria-live="polite"><div className="loader" /><div><strong>Reading the diff</strong><p>Tracing changes, risks, and missing test coverage…</p></div></section>}
        {review && <ReviewReport data={review} />}
      </main>
      <footer><span>PRism / Evidence-based review</span><span>Built in the open</span></footer>
    </>
  )
}

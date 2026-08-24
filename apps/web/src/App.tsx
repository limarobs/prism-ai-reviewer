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
        <a className="brand" href="/" aria-label="PRism home"><span className="brand-mark" aria-hidden="true">P</span><span>PRism</span></a>
        <a className="github-link" href="https://github.com/limarobs/prism-ai-reviewer" target="_blank" rel="noreferrer">GitHub ↗</a>
      </header>
      <main>
        <section className="hero">
          <h1>Review a pull request.</h1>
          <p className="lede">Paste a public GitHub pull request link to check the changes before merging.</p>
        </section>
        <form className="review-form" onSubmit={handleSubmit}>
          <label htmlFor="pull-request-url">Public GitHub pull request</label>
          <div className="input-row">
            <input id="pull-request-url" name="pullRequestUrl" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://github.com/owner/repository/pull/42" required disabled={isLoading} />
            <button type="submit" disabled={isLoading}>{isLoading ? 'Reviewing…' : 'Review PR'}</button>
          </div>
          <p className="form-hint">Public repositories only · <button type="button" onClick={() => setUrl(EXAMPLE_URL)} disabled={isLoading}>Use an example</button></p>
        </form>
        {error && <div className="error-message" role="alert"><strong>Review failed.</strong> {error}</div>}
        {isLoading && <section className="loading-card" aria-live="polite"><div className="loader" /><div><strong>Reviewing changes</strong><p>This can take a few seconds.</p></div></section>}
        {review && <ReviewReport data={review} />}
      </main>
      <footer><span>PRism</span><span>Pull request review</span></footer>
    </>
  )
}

import { useState, type FormEvent } from 'react'
import { reviewPullRequest, type ReviewData, type ReviewLanguage } from './api'
import { ReviewReport } from './ReviewReport'

const EXAMPLE_URL = 'https://github.com/expressjs/express/pull/7332'

const copy = {
  en: {
    title: 'Review a pull request.',
    description: 'Paste a public GitHub pull request link to check the changes before merging.',
    label: 'Public GitHub pull request',
    submit: 'Review PR',
    submitting: 'Reviewing…',
    hint: 'Public repositories only',
    example: 'Use an example',
    error: 'Review failed.',
    loading: 'Reviewing changes',
    loadingHint: 'This can take a few seconds.',
    footer: 'Pull request review',
  },
  'pt-BR': {
    title: 'Revise um pull request.',
    description: 'Cole o link de um pull request público do GitHub para verificar as alterações antes do merge.',
    label: 'Pull request público do GitHub',
    submit: 'Revisar PR',
    submitting: 'Revisando…',
    hint: 'Apenas repositórios públicos',
    example: 'Usar um exemplo',
    error: 'A revisão falhou.',
    loading: 'Revisando alterações',
    loadingHint: 'Isso pode levar alguns segundos.',
    footer: 'Revisão de pull requests',
  },
} as const

export function App() {
  const [language, setLanguage] = useState<ReviewLanguage>('pt-BR')
  const [url, setUrl] = useState('')
  const [review, setReview] = useState<ReviewData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const text = copy[language]

  function changeLanguage(nextLanguage: ReviewLanguage) {
    setLanguage(nextLanguage)
    setReview(null)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setReview(null)
    setIsLoading(true)
    try {
      setReview(await reviewPullRequest(url, language))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : text.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="/" aria-label="PRism home"><span className="brand-mark" aria-hidden="true">P</span><span>PRism</span></a>
        <div className="header-actions">
          <div className="language-switch" aria-label="Language">
            <button className={language === 'pt-BR' ? 'active' : ''} type="button" onClick={() => changeLanguage('pt-BR')} disabled={isLoading}>PT</button>
            <button className={language === 'en' ? 'active' : ''} type="button" onClick={() => changeLanguage('en')} disabled={isLoading}>EN</button>
          </div>
          <a className="github-link" href="https://github.com/limarobs/prism-ai-reviewer" target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>
      </header>
      <main>
        <section className="hero"><h1>{text.title}</h1><p className="lede">{text.description}</p></section>
        <form className="review-form" onSubmit={handleSubmit}>
          <label htmlFor="pull-request-url">{text.label}</label>
          <div className="input-row">
            <input id="pull-request-url" name="pullRequestUrl" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://github.com/owner/repository/pull/42" required disabled={isLoading} />
            <button type="submit" disabled={isLoading}>{isLoading ? text.submitting : text.submit}</button>
          </div>
          <p className="form-hint">{text.hint} · <button type="button" onClick={() => setUrl(EXAMPLE_URL)} disabled={isLoading}>{text.example}</button></p>
        </form>
        {error && <div className="error-message" role="alert"><strong>{text.error}</strong> {error}</div>}
        {isLoading && <section className="loading-card" aria-live="polite"><div className="loader" /><div><strong>{text.loading}</strong><p>{text.loadingHint}</p></div></section>}
        {review && <ReviewReport data={review} language={language} />}
      </main>
      <footer><span>PRism</span><span>{text.footer}</span></footer>
    </>
  )
}

export function App() {
  return (
    <main>
      <p className="eyebrow">AI-assisted code review</p>
      <h1>See every pull request through a clearer lens.</h1>
      <p className="lede">
        PRism finds risks, suggests tests, and grounds every observation in the
        code that changed.
      </p>
      <form>
        <label htmlFor="pull-request-url">Public GitHub pull request</label>
        <div className="input-row">
          <input
            id="pull-request-url"
            name="pullRequestUrl"
            type="url"
            placeholder="https://github.com/owner/repository/pull/42"
          />
          <button type="submit">Review pull request</button>
        </div>
      </form>
    </main>
  )
}

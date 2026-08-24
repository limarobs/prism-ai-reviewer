const GITHUB_API_URL = 'https://api.github.com'
const MAX_FILE_PAGES = 5
const FILES_PER_PAGE = 100

export interface PullRequestLocator {
  owner: string
  repository: string
  number: number
}

interface GithubPullRequestResponse {
  additions: number
  base: { ref: string }
  body: string | null
  changed_files: number
  deletions: number
  head: { ref: string; sha: string }
  html_url: string
  number: number
  title: string
  user: { login: string }
}

interface GithubFileResponse {
  additions: number
  blob_url: string
  changes: number
  deletions: number
  filename: string
  patch?: string
  status: string
}

export interface PullRequestFile {
  additions: number
  blobUrl: string
  changes: number
  deletions: number
  filename: string
  patch: string | null
  status: string
}

export interface PullRequestSnapshot {
  files: PullRequestFile[]
  pullRequest: {
    additions: number
    author: string
    baseRef: string
    body: string | null
    changedFiles: number
    deletions: number
    headRef: string
    headSha: string
    number: number
    title: string
    url: string
  }
  repository: {
    fullName: string
    name: string
    owner: string
    url: string
  }
  truncated: boolean
}

export class GithubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'GithubApiError'
  }
}

export function parsePullRequestUrl(value: string): PullRequestLocator | null {
  try {
    const url = new URL(value)
    const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/)

    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || !match) {
      return null
    }

    const [, owner, repository, pullRequestNumber] = match
    const number = Number(pullRequestNumber)

    if (!owner || !repository || !Number.isSafeInteger(number) || number < 1) {
      return null
    }

    return { owner, repository, number }
  } catch {
    return null
  }
}

export function createGithubClient(options: {
  fetch?: typeof fetch
  token?: string
}) {
  const request = options.fetch ?? fetch
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'prism-ai-reviewer',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  async function get<T>(path: string): Promise<T> {
    const response = await request(`${GITHUB_API_URL}${path}`, { headers })

    if (!response.ok) {
      const message =
        response.status === 404
          ? 'Pull request not found or not publicly accessible.'
          : 'GitHub could not provide this pull request.'
      throw new GithubApiError(message, response.status)
    }

    return response.json<T>()
  }

  return {
    async getPullRequest(locator: PullRequestLocator): Promise<PullRequestSnapshot> {
      const { owner, repository, number } = locator
      const basePath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${number}`
      const pullRequest = await get<GithubPullRequestResponse>(basePath)
      const files: GithubFileResponse[] = []

      for (let page = 1; page <= MAX_FILE_PAGES; page += 1) {
        const pageFiles = await get<GithubFileResponse[]>(
          `${basePath}/files?per_page=${FILES_PER_PAGE}&page=${page}`,
        )
        files.push(...pageFiles)

        if (pageFiles.length < FILES_PER_PAGE) {
          break
        }
      }

      return {
        repository: {
          owner,
          name: repository,
          fullName: `${owner}/${repository}`,
          url: `https://github.com/${owner}/${repository}`,
        },
        pullRequest: {
          number: pullRequest.number,
          title: pullRequest.title,
          body: pullRequest.body,
          author: pullRequest.user.login,
          baseRef: pullRequest.base.ref,
          headRef: pullRequest.head.ref,
          headSha: pullRequest.head.sha,
          url: pullRequest.html_url,
          additions: pullRequest.additions,
          deletions: pullRequest.deletions,
          changedFiles: pullRequest.changed_files,
        },
        files: files.map((file) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch ?? null,
          blobUrl: file.blob_url,
        })),
        truncated: pullRequest.changed_files > files.length,
      }
    },
  }
}

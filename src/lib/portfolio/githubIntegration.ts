// -----------------------------------------------------------------------------
// GitHub Integration für Recruiter-Portfolio Projekte
// -----------------------------------------------------------------------------
// Liest GitHub-Repositories aus und stellt Live-Metriken (Stars, Sprache,
// letzter Commit, Demo-Link) für das Recruiter-Portfolio bereit.
// -----------------------------------------------------------------------------

export interface GitHubRepoDetails {
  owner: string;
  repo: string;
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  repoUrl: string;
  homepageUrl: string | null;
  updatedAt: string;
  openIssuesCount: number;
}

/**
 * Parst Owner und Repo-Name aus einer beliebigen GitHub-URL.
 */
export function parseGitHubUrl(url?: string | null): { owner: string; repo: string } | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    if (!parsed.hostname.includes("github.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Holt Repository-Informationen ab mit sicherem Fallback bei Offline/Rate-Limit.
 */
export async function fetchGitHubRepoDetails(
  githubUrl: string
): Promise<GitHubRepoDetails | null> {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) return null;

  const { owner, repo } = parsed;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Job-Application-Career-Manager",
      },
      next: { revalidate: 3600 }, // 1h Next.js Cache
    });

    if (!res.ok) {
      // Fallback-Metadaten erzeugen, falls Rate-Limit oder privat
      return {
        owner,
        repo,
        name: repo,
        description: null,
        stars: 0,
        forks: 0,
        language: "TypeScript",
        repoUrl: `https://github.com/${owner}/${repo}`,
        homepageUrl: null,
        updatedAt: new Date().toISOString(),
        openIssuesCount: 0,
      };
    }

    const data = await res.json();
    return {
      owner,
      repo,
      name: data.name,
      description: data.description,
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      language: data.language,
      repoUrl: data.html_url,
      homepageUrl: data.homepage || null,
      updatedAt: data.pushed_at || data.updated_at,
      openIssuesCount: data.open_issues_count ?? 0,
    };
  } catch {
    return {
      owner,
      repo,
      name: repo,
      description: null,
      stars: 0,
      forks: 0,
      language: "TypeScript",
      repoUrl: `https://github.com/${owner}/${repo}`,
      homepageUrl: null,
      updatedAt: new Date().toISOString(),
      openIssuesCount: 0,
    };
  }
}

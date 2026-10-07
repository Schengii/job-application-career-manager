"use client";

import useSWR from "swr";
import { Star, GitFork, ExternalLink, Code2 } from "lucide-react";
import { fetcher } from "@/lib/core/api";
import { GitHubRepoDetails, parseGitHubUrl } from "@/lib/portfolio/githubIntegration";

interface GitHubRepoCardProps {
  url?: string | null;
}

export function GitHubRepoCard({ url }: GitHubRepoCardProps) {
  const parsed = parseGitHubUrl(url);

  const { data: repo, isLoading } = useSWR<GitHubRepoDetails>(
    parsed ? `/api/portfolio/github?url=${encodeURIComponent(url!)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (!parsed) return null;

  if (isLoading) {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 animate-pulse">
        <div className="h-3 w-3 rounded-full bg-slate-700" />
        <span>Lade GitHub Live-Metriken …</span>
      </div>
    );
  }

  if (!repo) return null;

  return (
    <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-900/90 p-3 text-xs shadow-2xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Code2 className="h-3.5 w-3.5 text-indigo-400" />
          <span>{repo.name}</span>
          {repo.language && (
            <span className="ml-1 rounded bg-indigo-950/80 border border-indigo-500/30 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-300">
              {repo.language}
            </span>
          )}
        </div>

        <a
          href={repo.repoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>Repository</span> <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {repo.description && (
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {repo.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 border-t border-slate-800/80">
        <span className="flex items-center gap-1 text-amber-400">
          <Star className="h-3 w-3 fill-amber-400" /> {repo.stars}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-3 w-3" /> {repo.forks}
        </span>
        {repo.homepageUrl && (
          <a
            href={repo.homepageUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:underline font-medium"
          >
            <span>Live Demo</span> <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}

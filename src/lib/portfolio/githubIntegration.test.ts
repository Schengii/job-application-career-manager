import { describe, expect, it } from "vitest";
import { parseGitHubUrl, fetchGitHubRepoDetails } from "./githubIntegration";

describe("githubIntegration", () => {
  it("parst GitHub-URLs zuverlässig", () => {
    expect(parseGitHubUrl("https://github.com/Schengii/electroCheck-ai")).toEqual({
      owner: "Schengii",
      repo: "electroCheck-ai",
    });
    expect(parseGitHubUrl("https://github.com/facebook/react/issues")).toEqual({
      owner: "facebook",
      repo: "react",
    });
    expect(parseGitHubUrl("https://gitlab.com/user/project")).toBeNull();
    expect(parseGitHubUrl(null)).toBeNull();
  });

  it("liefert Fallback-Daten, wenn GitHub offline oder URL ungültig ist", async () => {
    const data = await fetchGitHubRepoDetails("https://github.com/test-owner/test-repo");
    expect(data).not.toBeNull();
    expect(data?.name).toBe("test-repo");
    expect(data?.repoUrl).toBe("https://github.com/test-owner/test-repo");
  });
});

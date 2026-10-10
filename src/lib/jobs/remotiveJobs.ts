// -----------------------------------------------------------------------------
// Remotive API Integration — Remote Frontend Jobs
// -----------------------------------------------------------------------------
// Fragt die kostenfreie, öffentliche Remotive-API für weltweite & europäische
// Remote-Softwareentwickler-Stellen ab (ohne API-Key erforderlich).
// -----------------------------------------------------------------------------
import { SimulatedJobPosting } from "@/lib/jobs/mockJobPortals";
import { extractTechKeywordsFromText } from "@/lib/jobs/realJobSearch";

interface RemotiveApiJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

interface RemotiveApiResponse {
  "0-legal-notice": string;
  "job-count": number;
  jobs: RemotiveApiJob[];
}

/**
 * Ruft Remote-Entwickler-Jobs von Remotive ab.
 */
export async function searchRemotiveJobs(
  query: string = "Frontend",
  limit: number = 10
): Promise<SimulatedJobPosting[]> {
  const url = `https://remotive.com/api/remote-jobs?category=software-dev&search=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Job-Application-Career-Manager",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data: RemotiveApiResponse = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    return data.jobs.slice(0, limit).map((job) => {
      const cleanDesc = job.description ? job.description.replace(/<[^>]*>/g, " ").slice(0, 500) : "";
      const techStack = job.tags && job.tags.length > 0 ? job.tags : extractTechKeywordsFromText(job.title + " " + cleanDesc);

      return {
        title: job.title,
        description: cleanDesc,
        portalSource: "REMOTIVE",
        sourceUrl: job.url,
        location: job.candidate_required_location || "100% Remote (Worldwide / EU)",
        remote: true,
        requirementsProfile: `Remote Job (${job.candidate_required_location || "Global"}). Tags: ${job.tags?.join(", ") || "Frontend"}`,
        techStack: Array.isArray(techStack) ? techStack.join(",") : String(techStack),
        salaryInfo: job.salary || "Verhandlungsbasis (EU-Transparenz)",
        companyName: job.company_name,
      };
    });
  } catch {
    return [];
  }
}

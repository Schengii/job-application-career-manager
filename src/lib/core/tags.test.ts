import { describe, it, expect } from "vitest";
import { parseTags, stringifyTags, addTag, removeTag, matchesTags, getTagStyle } from "@/lib/core/tags";

describe("tags library", () => {
  it("parses comma separated tags correctly and removes hash prefixes", () => {
    const parsed = parseTags("#Prio1, #Startup, Remote,  React19 ");
    expect(parsed).toEqual(["Prio1", "Startup", "Remote", "React19"]);
  });

  it("handles empty or null strings gracefully", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags(null)).toEqual([]);
    expect(parseTags(undefined)).toEqual([]);
  });

  it("stringifies tags properly", () => {
    expect(stringifyTags(["Prio1", "Remote"])).toBe("Prio1,Remote");
  });

  it("adds tags without duplicates", () => {
    let tags = "Prio1,Remote";
    tags = addTag(tags, "#Startup");
    expect(tags).toBe("Prio1,Remote,Startup");

    // Case insensitive duplicate avoidance
    tags = addTag(tags, "prio1");
    expect(tags).toBe("Prio1,Remote,Startup");
  });

  it("removes tags correctly", () => {
    const tags = "Prio1,Startup,Remote";
    const updated = removeTag(tags, "#Startup");
    expect(updated).toBe("Prio1,Remote");
  });

  it("matches tags accurately", () => {
    const tags = "Prio1,Startup,Remote";
    expect(matchesTags(tags, "Startup")).toBe(true);
    expect(matchesTags(tags, "#prio1")).toBe(true);
    expect(matchesTags(tags, "Konzern")).toBe(false);
    expect(matchesTags(tags, "ALL")).toBe(true);
  });

  it("returns appropriate color style", () => {
    expect(getTagStyle("Prio1")).toContain("rose");
    expect(getTagStyle("Startup")).toContain("emerald");
    expect(getTagStyle("unknown-tag")).toContain("slate");
  });
});

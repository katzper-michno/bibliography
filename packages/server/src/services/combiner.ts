import { VaultEntry } from "@paper-vault/shared";
import { OpenAlexWork } from "./open-alex.js";
import { SemanticScholarPaper } from "./semantic-scholar.js";

/**
 * Combines results from different external sources into a joint list of Vault entries.
 *     - Filters out thrash.
 *     - Combines entries with the same DOI into one, merging information from all sources.
 *     - Decides what is the type of the entry - a journal article, a book, a conference paper or a preprint.
 *     - Populates entries with additional external links, like Sci-Hub or arXiv.
 */
const combineResults = (oa: OpenAlexWork[], ss: SemanticScholarPaper[]): VaultEntry[] => {
  // Filter out thrash, that is, entries without DOI.
  // Then, normalize DOI for consistency.
  const oaWithDOI = oa
    .filter((work: OpenAlexWork) => Boolean(work.doi))
    .map((work: OpenAlexWork) => ({
      ...work,
      doi: normalizeDOI(work.doi!)
    }))
  const ssWithDOI = ss.filter((paper: SemanticScholarPaper) => Boolean(paper.externalIds?.DOI))
    .map((paper: SemanticScholarPaper) => ({
      ...paper,
      externalIds: {
        ...paper.externalIds,
        DOI: normalizeDOI(paper.externalIds!.DOI!)
      }
    }))

  // Combine entries with matching DOI into a VaultEntry with proper entry type.
  // TODO

  // Populate with external urls to Sci-Hub, arXiv etc.
  // TODO

  return [];
}

/**
 * Normalizes DOI: trim, lower-case, remove "https://doi.org" prefix.
 */
const normalizeDOI = (doi: string): string => {
  let normalDoi = doi.trim();

  if (doi.startsWith("https://doi.org/")) {
    normalDoi = doi.slice("https://doi.org/".length)
  }

  if (doi && doi.startsWith("http://doi.org/")) {
    normalDoi = doi.slice("http://doi.org/".length)
  }

  return normalDoi.toLowerCase();
}

export const CombineService = {
  combineResults
}

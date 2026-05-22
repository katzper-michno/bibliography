import { Request, Response } from "express";
import { OpenAlexClient, OpenAlexWork } from "../services/open-alex.js";
import { SemanticScholarClient, SemanticScholarPaper } from "../services/semantic-scholar.js";
import { VaultEntry } from "@paper-vault/shared";
import { CombineService } from "../services/combiner.js";

/**
 * Aggregates potential vault entries from various external sources, such as Semantic Scholar and OpenAlex.
 */
const aggregate = async (
  req: Request<{}, {}, {}, { q: string }>,
  res: Response<VaultEntry[] | { message: string }>,
) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Query phrase is required' });
  }

  const searchQuery = q.trim().toLowerCase();

  const semanticScholarResults: SemanticScholarPaper[] = await SemanticScholarClient.searchPapers(searchQuery);
  const openAlexResults: OpenAlexWork[] = await OpenAlexClient.searchPapers(searchQuery);

  const combinedResults = CombineService.combineResults(openAlexResults, semanticScholarResults);

  res.status(200).json(combinedResults);

  /* const searchResults = mergeEnhanceAndFilterResults(
    openAlexResults,
    semanticScholarResults,
  ); */

  /* try {
    const resultsWithLinks = await Promise.all(
      searchResults.map(async (paper: Paper) => ({
        ...paper,
        urls: {
          ...paper.urls,
          arxiv: ArXivClient.generateLink(paper),
          sciHub: await SciHubClient.generateLink(paper),
        },
      })),
    );

    console.log("[Controller] Resolved urls:");
    printUrlResolutionTable(resultsWithLinks);

    res.status(200).json(resultsWithLinks);
  } catch (error: any) {
    console.log("[Controller] Error when searching for papers:", error);
    res.status(500).json({ message: "Internal server error" });
    } */
};

// Sometimes, we are able to deduce some information in a non-direct way
const extrapolateMoreData = (paper: Paper) => {
  let venue = paper.venue;

  if (
    Boolean(paper.venue) === false &&
    paper.doi.toLowerCase().includes("arxiv")
  ) {
    venue = "arXiv";
  }

  return {
    ...paper,
    venue,
  };
};

const mergeEnhanceAndFilterResults = (oa: Paper[], ss: Paper[]) => {
  // Semantic Scholar results usually contain more information, so we remove duplicates prioritizing them
  const ssWithOALinks: Paper[] = ss.map((paper: Paper) => {
    const oaEntry = oa.find((other: Paper) => other.doi === paper.doi);
    return oaEntry
      ? {
          ...paper,
          abstract: Boolean(paper.abstract) ? paper.abstract : oaEntry.abstract, // For some reason, sometimes SS returns no abstract
          urls: {
            ...paper.urls,
            openAlex: oaEntry.urls.openAlex,
          },
        }
      : paper;
  });

  const oaWithoutDuplicates = oa.filter(
    (paper: Paper) => !ss.some((other: Paper) => other.doi == paper.doi),
  );

  const isNotGarbage = (_: Paper) => {
    // TODO: What is garbage?
    return true;
  };

  // Interleaving to avoid pushing only one source to the top
  return interleaveResults(ssWithOALinks, oaWithoutDuplicates)
    .map(extrapolateMoreData)
    .filter(isNotGarbage);
};

const interleaveResults = (oa: Paper[], ss: Paper[]) =>
  Array.from({ length: Math.max(oa.length, ss.length) })
    .flatMap((_, i) => [oa[i], ss[i]])
    .filter((x) => x !== undefined);

export const AggregatorController = {
  aggregate
}

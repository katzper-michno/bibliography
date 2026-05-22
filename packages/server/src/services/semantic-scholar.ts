import axios from "axios";
import { logger } from "../logger.js";

export interface SemanticScholarAuthor {
  name: string;
}

export interface SemanticScholarPaper {
  title: string;
  authors: SemanticScholarAuthor[];
  year: number;
  venue?: string;
  abstract: string;
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
  };
  url: string;
  openAccessPdf?: {
    url?: string;
  };
}

interface SemanticScholarResponse {
  total: number;
  offset: number;
  next: number;
  data: SemanticScholarPaper[];
}

const SEMANTIC_SCHOLAR_BASE_URL = "https://api.semanticscholar.org"

const SEARCH_FIELDS = [
  "title", "authors", "year", "venue", "abstract", "externalIds", "url", "openAccessPdf"
]

/**
 * Calls the Semantic Scholar search API with provided query and returns the results.
 */
const searchPapers = async (query: string): Promise<SemanticScholarPaper[]> => {
  const API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY;

  const searchTerm = query.trim().toLowerCase();

  // Use Semantic Scholar API to search for papers.
  const searchUrl =
    `${SEMANTIC_SCHOLAR_BASE_URL}/graph/v1/paper/search` +
    `?query=${encodeURIComponent(searchTerm)}` +
    "&limit=10" +
    "&fields=" + SEARCH_FIELDS.join(",");

  const headers = API_KEY ? { "x-api-key": API_KEY } : {};

  // Log a downstream request.
  logger.info(`Calling Semantic Scholar with request: ${searchUrl}`)

  try {
    const response = await axios.get<SemanticScholarResponse>(searchUrl, {
      headers,
      timeout: 10000
    });

    logger.info(`Successfully obtained ${response.data.data.length} results from Semantic Scholar search.`);

    return (response.data.data || [])
      .map(deduceDOI);
  } catch (error: any) {
    logger.warn(`Semantic Scholar downstream failed with error: ${error}`);

    return [];
  }
  /* return response.data.data
    .filter(
      (work: SemanticScholarWork) =>
        Boolean(work.externalIds?.DOI) || Boolean(work.externalIds?.ArXiv),
    )
    .map((work: SemanticScholarWork): Paper => {
      let doi = work.externalIds?.DOI?.startsWith("https://doi.org/")
        ? work.externalIds?.DOI?.slice("https://doi.org/".length)
        : work.externalIds?.DOI;

      if (doi == undefined && Boolean(work.externalIds?.ArXiv)) {
        doi = "10.48550/arxiv." + work.externalIds!.ArXiv!;
      }

      doi = doi!.toLowerCase();

      return {
        id: VaultService.convertDOIToId(doi!),
        title: work.title,
        authors: work.authors.map((auth: any) => auth.name),
        abstract: work.abstract || "",
        year: work.year,
        venue: work.venue || "",
        doi: doi!,
        urls: {
          semanticScholar: work.url,
        },
      };
    }); */
};

/**
 * Tries to deduce DOI if it is missing.
 */
const deduceDOI = (paper: SemanticScholarPaper): SemanticScholarPaper => {
  if (paper.externalIds?.DOI) {
    return paper;
  }

  const doi = (paper.externalIds?.ArXiv) ?
    "10.48550/arxiv." + paper.externalIds.ArXiv : undefined

  return {
    ...paper,
    externalIds: {
      ...paper.externalIds,
      DOI: doi
    }
  }
}

export const SemanticScholarClient = {
  searchPapers,
};

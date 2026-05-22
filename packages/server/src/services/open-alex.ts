import axios from "axios";
import { logger } from "../logger.js";

export interface OpenAlexWork {
  id: string;
  title: string;
  authorships: { author: { display_name: string } }[];
  abstract_inverted_index: Record<string, number[]> | null;
  publication_year: number;
  primary_location?: {
    source?: {
      display_name?: string;
    };
    raw_source_name?: string;
  };
  doi?: string;
}

interface OpenAlexResponse {
  meta: {
    count: number;
  };
  results: OpenAlexWork[];
}

const OPEN_ALEX_BASE_URL = "https://api.openalex.org"

/**
 * Calls the Open Alex search API with provided query and returns the results.
 */
const searchPapers = async (query: string): Promise<OpenAlexWork[]> => {
  const API_KEY = process.env.OPEN_ALEX_API_KEY;

  const searchUrl =
    `${OPEN_ALEX_BASE_URL}/works?` +
    `search=${encodeURIComponent(query)}` +
    "&per-page=10" +
    "&include_xpac=true" +
    (API_KEY ? `&api_key=${API_KEY}` : "");

  // Log a downstream request.
  logger.info(`Calling Open Alex with request: ${searchUrl}`)

  try {
    const response = await axios.get<OpenAlexResponse>(searchUrl, {
      timeout: 20000
    });

    logger.info(`Successfully obtained ${response.data.results.length} results from Open Alex search.`);

    return response.data.results || [];
  } catch (error: any) {
    logger.warn(`Open Alex downstream failed with error: ${error}`);

    return [];
  }

  /* return response.data.results
    .filter((work: OpenAlexWork) => Boolean(work.doi))
    .map((work: OpenAlexWork) => {
      const venue =
        work.primary_location?.source?.display_name ??
        work.primary_location?.raw_source_name ??
        "";

      const doi: string = (
        work.doi!.startsWith("https://doi.org/")
          ? work.doi!.slice("https://doi.org/".length)
          : work.doi!
      ).toLowerCase();

      return {
        id: VaultService.convertDOIToId(doi),
        title: work.title,
        authors: work.authorships.map((a) => a.author.display_name),
        abstract: reconstructAbstract(work.abstract_inverted_index),
        year: work.publication_year,
        venue: venue,
        doi: doi,
        urls: {
          openAlex: work.id,
        },
      };
      }); */
}

/**
 * Reconstructs the abstract from given OpenAlexWork instance.
 * The abstract is stored in an inverted index format.
 */
const reconstructAbstract = (work: OpenAlexWork): string => {
  const invertedIndex = work.abstract_inverted_index;

  if (!invertedIndex) return "";

  const words: string[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }

  return words.filter(Boolean).join(" ");
}

export const OpenAlexClient = {
  searchPapers,
  reconstructAbstract
};

export type Date = string; // ISO 8601 timestamp with zero offset, e.g. "2026-05-22T12:00:00Z".

export type EntryType = "article" | "book" | "inproceedings" | "misc"

export type PagesRange = [number, number];

/**
 * The set of urls pointing to location of the entry in external sources.
 */
export interface ExternalUrls {
  openAlex?: string;
  semanticScholar?: string;
  arxiv?: string;
  sciHub?: string;
}

/**
 * The basis of a paper-vault entry.
 */
export interface VaultEntry {
  entryType: EntryType;
  id: string; // A unique id generated based on the DOI number, so that the entry can be recognized consistently across different external sources.
  authors: string[];
  title: string;
  year: number;
  doi: string; // The DOI number in the format 10.XXXX/YYYYYY is mandatory and should be lower-case for consistency (in general, DOI identifiers are case-insensitive).
  urls: ExternalUrls;
  abstract?: string;
  note?: string; // A note attached by the PaperVault user. Not a part of extracted citation.
  createdAt: Date; // When the Entry was added to the Vault.
}

/**
 * @article
 *
 * A paper published in a peer-reviewed journal or magazine.
 */
export interface ArticleEntry extends VaultEntry {
  entryType: "article";
  journal: string; // Full name of the journal, e.g. "SIAM Journal on Computing".
  volume?: string;
  number?: string; // Issue number.
  pages?: PagesRange;
}

/**
 * @book
 *
 * A complete, standalone published book with its own ISBN.
 *
 * Either `author` or `editor` must be present.
 */
export interface BookEntry extends VaultEntry {
  entryType: "book";
  publisher?: string;
  edition?: string; // E.g. "3rd" or "Third".
  address?: string; // Publisher's location.
  isbn?: string;
}

/**
 * @inproceedings  (alias: @conference)
 *
 * A paper presented at and published in a conference proceedings.
 */
export interface InproceedingsEntry extends VaultEntry {
  entryType: "inproceedings";
  booktitle: string; // Full proceedings title, e.g. "27th Annual IEEE Symposium on Logic in Computer Science".
  shorttitle?: string; // Abbrieviated booktitle, e.g. "LICS '23".
  publisher?: string; // E.g. "ACM".
  pages?: PagesRange;
}

/**
 * @misc
 *
 * A preprint submitted to a public repository
 * that has not (yet) been formally peer-reviewed or published.
 */
export interface MiscEntry extends VaultEntry {
  entryType: "misc";
  repository: string; // E.g. "arXiv".
}

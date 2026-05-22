import { Request, Response } from "express";
import { Paper } from "./types.js";
import { VaultService } from "./services/vault.js";
import { BibTeXService } from "./services/bibtex.js";
import { ArXivClient } from "./services/arxiv.js";
import { SciHubClient } from "./services/sciHub.js";

const getPapers = async (
  _: Request,
  res: Response<Paper[] | { message: string }>,
) => {
  try {
    res.status(200).json(VaultService.getPapers());
  } catch (error: any) {
    console.log("[Controller] Error when obtaining saved papers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addPaper = async (
  req: Request,
  res: Response<Paper | { message: string }>,
) => {
  const paper = req.body as Paper;

  if (!paper || !paper.id) {
    return res.status(400).json({ message: "Paper data with id is required" });
  }

  if (VaultService.paperExists(paper.id)) {
    return res
      .status(400)
      .json({ message: `Paper with id ${paper.id} already exists` });
  }

  try {
    VaultService.addPaper(paper);

    try {
      if (paper.urls.arxiv) {
        const arxivPdf = await ArXivClient.downloadPdf(paper.doi);
        VaultService.addFile(paper.id, arxivPdf);
      }
      if (paper.urls.sciHub) {
        const sciHubPdf = await SciHubClient.downloadPdf(paper.doi);
        VaultService.addFile(paper.id, sciHubPdf);
      }
    } catch (error: any) {
      // We do not want the entire request to fail.
      console.warn(
        "[Controller] There was an error when downloading pdfs: ",
        error,
      );
    }

    res.status(201).json(VaultService.getPaper(paper.id));
  } catch (error: any) {
    console.log("[Controller] Error when adding new paper:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updatePaper = async (
  req: Request,
  res: Response<Paper | { message: string }>,
) => {
  const paper = req.body as Paper;

  if (!VaultService.paperExists(paper.id)) {
    return res
      .status(404)
      .json({ message: `Paper with id ${paper.id} not found` });
  }

  try {
    VaultService.updatePaper(paper);
    res.status(200).json(VaultService.getPaper(paper.id));
  } catch (error: any) {
    console.log("[Controller] Error when updating paper:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deletePaper = async (
  req: Request<{ id: string }>,
  res: Response<{ message: string }>,
) => {
  const { id } = req.params;

  if (!VaultService.paperExists(id)) {
    return res.status(404).json({ message: `Paper with id ${id} not found` });
  }

  try {
    VaultService.deletePaper(id);
    res.status(204).json({ message: `Paper ${id} deleted successfuly` });
  } catch (error: any) {
    console.log("[Controller] Error when removing paper:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const generateBibTeX = async (
  req: Request<{ id: string }>,
  res: Response<{ bibtex: string } | { message: string }>,
) => {
  const { id } = req.params;

  if (!VaultService.paperExists(id)) {
    return res.status(404).json({ message: `Paper with id ${id} not found` });
  }

  try {
    res
      .status(200)
      .json({ bibtex: BibTeXService.generate(VaultService.getPaper(id)) });
  } catch (error: any) {
    console.log("[Controller] Error when generating BibTeX:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

interface UploadFileRequest extends Request<{ id: string }> {
  file?: Express.Multer.File;
}

const addFile = async (
  req: UploadFileRequest,
  res: Response<{ name: string } | { message: string }>,
) => {
  const { id } = req.params;
  const file = req.file;

  if (!VaultService.paperExists(id)) {
    return res.status(404).json({ message: `Paper with id ${id} not found` });
  }

  if (!file) {
    return res.status(400).json({ message: "No file to add" });
  }

  try {
    res.status(200).json({ name: VaultService.addFile(id, file) });
  } catch (error: any) {
    console.log("[Controller] Error when adding new file:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteFile = async (
  req: Request<{ id: string; name: string }>,
  res: Response<{ message: string }>,
) => {
  const { id, name } = req.params;
  const decodedName = decodeURIComponent(name);

  if (!VaultService.paperExists(id)) {
    return res.status(404).json({ message: `Paper with id ${id} not found` });
  }

  try {
    VaultService.deleteFile(id, decodedName);
    res.status(204).json({
      message: `File ${name} attached to paper ${id} deleted successfuly`,
    });
  } catch (error: any) {
    console.log("[Controller] Error when removing file:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const openFilesDir = async (
  req: Request<{ id: string }>,
  res: Response<{ message: string }>,
) => {
  const { id } = req.params;

  if (!VaultService.paperExists(id)) {
    return res.status(404).json({ message: `Paper with id ${id} not found` });
  }

  try {
    VaultService.openFilesDir(id);
    res.status(200).json({
      message: `Directory of files attached to ${id} opened successfuly`,
    });
  } catch (error: any) {
    console.log("[Controller] Error when opening files directory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const openFile = async (
  req: Request<{ id: string; name: string }>,
  res: Response<{ message: string }>,
) => {
  const { id, name } = req.params;
  const decodedName = decodeURIComponent(name);

  if (!VaultService.paperExists(id)) {
    return res.status(404).json({ message: `Paper with id ${id} not found` });
  }

  try {
    VaultService.openFile(id, decodedName);
    res.status(200).json({
      message: `File ${name} attached to paper ${id} opened successfuly`,
    });
  } catch (error: any) {
    console.log("[Controller] Error when opening file:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const Controller = {
  getPapers,
  addPaper,
  updatePaper,
  deletePaper,
  generateBibTeX,
  addFile,
  deleteFile,
  openFilesDir,
  openFile,
};

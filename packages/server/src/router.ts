import { Router } from "express";
import { Controller } from "./controller.js";
import multer from "multer";
import { HealthcheckController } from "./controllers/healthcheck-controller.js";
import { AggregatorController } from "./controllers/aggregator-controller.js";

const upload = multer({ storage: multer.memoryStorage() });

export const router = Router();

// Healthcheck.
router.get("/healthcheck", HealthcheckController.healthcheck);

// Web papers aggregator.
router.get("/aggregate", AggregatorController.aggregate);

// Vault entries fetch/create/patch/delete.
router.get("/vault-entries", Controller.getPapers);
router.post("/vault-entries", Controller.addPaper);
router.patch("/vault-entries/:id", Controller.updatePaper);
router.delete("/vault-entries/:id", Controller.deletePaper);

// Generate BibTeX.
router.get("/vault-entries/:id/bibtex", Controller.generateBibTeX);

// Attached files fetch/create/delete.
router.post("/vault-entries/:id/files", upload.single("file"), Controller.addFile);
router.delete("/vault-entries/:id/files/:filename", Controller.deleteFile);

// Open attached files directory/a specific file.
router.get("/vault-entries/:id/files/open", Controller.openFilesDir);
router.get("/vault-entries/:id/files/:filename/open", Controller.openFile);

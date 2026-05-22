import express from "express";
import cors from "cors";
import { router } from "./router.js";
import { pinoHttp } from "pino-http";
import { logger } from "./logger.js";

const app = express();

app.use(pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  redact: ['req.headers.authorization', 'req.headers.cookie'],
}));

app.use(cors());

app.use(express.json());

app.use("/", router);

app.listen(process.env.BACKEND_PORT, () => {
  logger.info(`PaperVault server running on http://localhost:${process.env.BACKEND_PORT}`)
});

process.on('uncaughtException', (err) => { logger.fatal({ err }, 'Uncaught exception'); process.exit(1); });
process.on('unhandledRejection', (reason) => { logger.error({ reason }, 'Unhandled rejection'); });

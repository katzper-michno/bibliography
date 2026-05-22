import { Request, Response } from "express";

const healthcheck = async (_: Request, res: Response) => {
  res.status(200).json({ message: "PaperVault service is OK:)" });
};

export const HealthcheckController = {
  healthcheck
}

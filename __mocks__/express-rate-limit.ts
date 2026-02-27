import type { Request, Response, NextFunction } from "express";

const passthrough = () => (_req: Request, _res: Response, next: NextFunction) =>
  next();

export const rateLimit = passthrough;
export default passthrough;

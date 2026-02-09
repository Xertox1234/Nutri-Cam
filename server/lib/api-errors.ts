import type { Response } from "express";

interface ErrorOptions {
  code?: string;
  details?: unknown;
}

export function sendError(
  res: Response,
  status: number,
  error: string,
  options?: ErrorOptions,
): void {
  const body: Record<string, unknown> = { error };
  if (options?.code) body.code = options.code;
  if (options?.details) body.details = options.details;
  res.status(status).json(body);
}

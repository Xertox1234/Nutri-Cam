import type { Response } from "express";

interface ApiErrorOptions {
  code?: string;
  details?: unknown;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Send a standardized error response.
 * All API errors should use this function for consistency.
 */
export function sendError(
  res: Response,
  status: number,
  error: string,
  options?: ApiErrorOptions,
): void {
  const response: ApiErrorResponse = {
    success: false,
    error,
  };

  if (options?.code) {
    response.code = options.code;
  }
  if (options?.details) {
    response.details = options.details;
  }

  res.status(status).json(response);
}

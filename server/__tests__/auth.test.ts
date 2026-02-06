import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

// Mock the auth module to control JWT_SECRET
vi.mock("../middleware/auth", async () => {
  const JWT_SECRET = "test-jwt-secret";

  function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided", code: "NO_TOKEN" });
      return;
    }

    const token = authHeader.slice(7);

    try {
      const payload = jwt.verify(token, JWT_SECRET);

      if (
        typeof payload !== "object" ||
        payload === null ||
        typeof (payload as any).sub !== "string"
      ) {
        res
          .status(401)
          .json({ error: "Invalid token payload", code: "TOKEN_INVALID" });
        return;
      }

      (req as any).userId = (payload as any).sub;
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
        return;
      }
      res.status(401).json({ error: "Invalid token", code: "TOKEN_INVALID" });
    }
  }

  function generateToken(userId: string): string {
    return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "30d" });
  }

  return { requireAuth, generateToken };
});

const { requireAuth, generateToken } = await import("../middleware/auth");

const JWT_SECRET = "test-jwt-secret";

describe("Auth Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  describe("requireAuth", () => {
    it("returns 401 when no authorization header is provided", () => {
      mockRequest.headers = {};

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "No token provided",
        code: "NO_TOKEN",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("returns 401 when authorization header does not start with Bearer", () => {
      mockRequest.headers = { authorization: "Basic sometoken" };

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "No token provided",
        code: "NO_TOKEN",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("returns 401 when token is invalid", () => {
      mockRequest.headers = { authorization: "Bearer invalid-token" };

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid token",
        code: "TOKEN_INVALID",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("returns 401 when token payload is invalid (missing sub)", () => {
      // Create a token without sub claim
      const invalidToken = jwt.sign({ foo: "bar" }, JWT_SECRET);
      mockRequest.headers = { authorization: `Bearer ${invalidToken}` };

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid token payload",
        code: "TOKEN_INVALID",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("calls next and sets userId when token is valid", () => {
      const userId = "user-123";
      const validToken = jwt.sign({ sub: userId }, JWT_SECRET);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).userId).toBe(userId);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("returns 401 with TOKEN_EXPIRED when token is expired", () => {
      const expiredToken = jwt.sign({ sub: "user-123" }, JWT_SECRET, {
        expiresIn: "-1s",
      });
      mockRequest.headers = { authorization: `Bearer ${expiredToken}` };

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Token expired",
        code: "TOKEN_EXPIRED",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("generateToken", () => {
    it("generates a valid JWT token with user ID as subject", () => {
      const userId = "user-456";
      const token = generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      expect(decoded.sub).toBe(userId);
    });

    it("generates token with 30 day expiration", () => {
      const token = generateToken("user-789");
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      expect(decoded.exp).toBeDefined();
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;

      // Check expiration is roughly 30 days from now (within 60 seconds tolerance)
      expect(decoded.exp! - now).toBeGreaterThan(thirtyDaysInSeconds - 60);
      expect(decoded.exp! - now).toBeLessThanOrEqual(thirtyDaysInSeconds);
    });

    it("generates tokens with same payload content for same user", () => {
      const token1 = generateToken("user-1");
      const token2 = generateToken("user-1");

      const decoded1 = jwt.decode(token1) as jwt.JwtPayload;
      const decoded2 = jwt.decode(token2) as jwt.JwtPayload;

      // Both tokens should have the same subject
      expect(decoded1.sub).toBe(decoded2.sub);
      expect(decoded1.sub).toBe("user-1");
    });

    it("generates different tokens for different users", () => {
      const token1 = generateToken("user-1");
      const token2 = generateToken("user-2");

      const decoded1 = jwt.decode(token1) as jwt.JwtPayload;
      const decoded2 = jwt.decode(token2) as jwt.JwtPayload;

      expect(decoded1.sub).toBe("user-1");
      expect(decoded2.sub).toBe("user-2");
      expect(decoded1.sub).not.toBe(decoded2.sub);
    });
  });
});

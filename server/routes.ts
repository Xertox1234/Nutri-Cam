import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import bcrypt from "bcrypt";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";
import { z, ZodError } from "zod";
import { storage } from "./storage";
import { requireAuth, generateToken } from "./middleware/auth";
import {
  insertUserProfileSchema,
  insertScannedItemSchema,
  insertDailyLogSchema,
  allergySchema,
} from "@shared/schema";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour
  message: { error: "Too many registration attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Registration validation schema with username format and password strength
const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

// Profile update validation schema
const profileUpdateSchema = z.object({
  displayName: z.string().max(100).optional(),
  dailyCalorieGoal: z.number().int().min(500).max(10000).optional(),
  onboardingCompleted: z.boolean().optional(),
});

// Enhanced user profile schema with proper validation for nested objects
const userProfileInputSchema = insertUserProfileSchema.extend({
  allergies: z.array(allergySchema).optional(),
  healthConditions: z.array(z.string()).optional(),
  foodDislikes: z.array(z.string()).optional(),
  cuisinePreferences: z.array(z.string()).optional(),
  householdSize: z.number().int().min(1).max(20).optional(),
  dietType: z.string().max(50).optional().nullable(),
  primaryGoal: z.string().max(100).optional().nullable(),
  activityLevel: z.string().max(50).optional().nullable(),
  cookingSkillLevel: z.string().max(50).optional().nullable(),
  cookingTimeAvailable: z.string().max(50).optional().nullable(),
});

// Helper to parse numeric ID parameters
function parseIdParam(id: string | string[]): number {
  const idStr = Array.isArray(id) ? id[0] : id;
  const parsed = parseInt(idStr, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new ZodError([
      {
        code: "custom",
        path: ["id"],
        message: "ID must be a positive integer",
      },
    ]);
  }
  return parsed;
}

// Helper to format Zod errors for API response
function formatZodError(error: ZodError): { error: string; details: z.ZodIssue[] } {
  const messages = error.errors.map((e) => {
    const path = e.path.join(".");
    return path ? `${path}: ${e.message}` : e.message;
  });
  return {
    error: messages.join("; "),
    details: error.errors,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/register", registerLimiter, async (req: Request, res: Response) => {
    try {
      const validated = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(validated.username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(validated.password, 10);
      const user = await storage.createUser({
        username: validated.username,
        password: hashedPassword,
      });

      const token = generateToken(user.id.toString());

      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          dailyCalorieGoal: user.dailyCalorieGoal,
          onboardingCompleted: user.onboardingCompleted,
        },
        token,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(formatZodError(error));
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user.id.toString());

      res.json({
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          dailyCalorieGoal: user.dailyCalorieGoal,
          onboardingCompleted: user.onboardingCompleted,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    // Stateless JWT - no session to destroy
    res.json({ success: true });
  });

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.userId!);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      dailyCalorieGoal: user.dailyCalorieGoal,
      onboardingCompleted: user.onboardingCompleted,
    });
  });

  app.put(
    "/api/auth/profile",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const validated = profileUpdateSchema.parse(req.body);
        const updates: Record<string, unknown> = {};
        if (validated.displayName !== undefined) updates.displayName = validated.displayName;
        if (validated.dailyCalorieGoal !== undefined)
          updates.dailyCalorieGoal = validated.dailyCalorieGoal;
        if (validated.onboardingCompleted !== undefined)
          updates.onboardingCompleted = validated.onboardingCompleted;

        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ error: "No valid fields to update" });
        }

        const user = await storage.updateUser(req.userId!, updates);

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          dailyCalorieGoal: user.dailyCalorieGoal,
          onboardingCompleted: user.onboardingCompleted,
        });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json(formatZodError(error));
        }
        console.error("Profile update error:", error);
        res.status(500).json({ error: "Failed to update profile" });
      }
    },
  );

  app.get(
    "/api/user/dietary-profile",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const profile = await storage.getUserProfile(req.userId!);
        res.json(profile || null);
      } catch (error) {
        console.error("Error fetching dietary profile:", error);
        res.status(500).json({ error: "Failed to fetch dietary profile" });
      }
    },
  );

  app.post(
    "/api/user/dietary-profile",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const validated = userProfileInputSchema.parse({
          ...req.body,
          userId: req.userId!,
        });

        // Use transaction to ensure profile creation/update and onboarding flag are atomic
        const { profile } = await storage.createOrUpdateProfileWithOnboarding(
          req.userId!,
          {
            allergies: validated.allergies,
            healthConditions: validated.healthConditions,
            dietType: validated.dietType,
            foodDislikes: validated.foodDislikes,
            primaryGoal: validated.primaryGoal,
            activityLevel: validated.activityLevel,
            householdSize: validated.householdSize,
            cuisinePreferences: validated.cuisinePreferences,
            cookingSkillLevel: validated.cookingSkillLevel,
            cookingTimeAvailable: validated.cookingTimeAvailable,
          },
        );

        res.status(201).json(profile);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json(formatZodError(error));
        }
        console.error("Error saving dietary profile:", error);
        res.status(500).json({ error: "Failed to save dietary profile" });
      }
    },
  );

  app.put(
    "/api/user/dietary-profile",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // For partial updates, make all fields optional
        const updateSchema = userProfileInputSchema.partial().omit({ userId: true });
        const validated = updateSchema.parse(req.body);

        const profile = await storage.updateUserProfile(req.userId!, validated);

        if (!profile) {
          return res.status(404).json({ error: "Profile not found" });
        }

        res.json(profile);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json(formatZodError(error));
        }
        console.error("Error updating dietary profile:", error);
        res.status(500).json({ error: "Failed to update dietary profile" });
      }
    },
  );

  app.get(
    "/api/scanned-items",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const limit = Math.min(
          Math.max(parseInt(req.query.limit as string) || 50, 1),
          100,
        );
        const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

        const result = await storage.getScannedItems(req.userId!, limit, offset);
        res.json(result);
      } catch (error) {
        console.error("Error fetching scanned items:", error);
        res.status(500).json({ error: "Failed to fetch items" });
      }
    },
  );

  app.get("/api/scanned-items/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);

      const item = await storage.getScannedItem(id);

      if (!item || item.userId !== req.userId) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.json(item);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(formatZodError(error));
      }
      console.error("Error fetching scanned item:", error);
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  app.post(
    "/api/scanned-items",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Extended schema for scanned items with string coercion for numeric fields
        const scannedItemInputSchema = insertScannedItemSchema.extend({
          productName: z
            .string()
            .min(1, "Product name is required")
            .default("Unknown Product"),
          calories: z
            .union([z.string(), z.number()])
            .optional()
            .transform((v) => v?.toString()),
          protein: z
            .union([z.string(), z.number()])
            .optional()
            .transform((v) => v?.toString()),
          carbs: z
            .union([z.string(), z.number()])
            .optional()
            .transform((v) => v?.toString()),
          fat: z
            .union([z.string(), z.number()])
            .optional()
            .transform((v) => v?.toString()),
          fiber: z
            .union([z.string(), z.number()])
            .optional()
            .transform((v) => v?.toString()),
          sugar: z
            .union([z.string(), z.number()])
            .optional()
            .transform((v) => v?.toString()),
          sodium: z
            .union([z.string(), z.number()])
            .optional()
            .transform((v) => v?.toString()),
        });

        const validated = scannedItemInputSchema.parse({
          ...req.body,
          userId: req.userId!,
        });

        // Use transaction to ensure scanned item and daily log are created atomically
        const { item } = await storage.createScannedItemWithLog(
          {
            userId: validated.userId,
            barcode: validated.barcode,
            productName: validated.productName,
            brandName: validated.brandName,
            servingSize: validated.servingSize,
            calories: validated.calories,
            protein: validated.protein,
            carbs: validated.carbs,
            fat: validated.fat,
            fiber: validated.fiber,
            sugar: validated.sugar,
            sodium: validated.sodium,
            imageUrl: validated.imageUrl,
          },
          {
            userId: req.userId!,
            servings: "1",
            mealType: null,
          },
        );

        res.status(201).json(item);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json(formatZodError(error));
        }
        console.error("Error creating scanned item:", error);
        res.status(500).json({ error: "Failed to save item" });
      }
    },
  );

  app.get(
    "/api/daily-summary",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const dateParam = req.query.date as string;
        const date = dateParam ? new Date(dateParam) : new Date();

        const summary = await storage.getDailySummary(req.userId!, date);
        res.json(summary);
      } catch (error) {
        console.error("Error fetching daily summary:", error);
        res.status(500).json({ error: "Failed to fetch summary" });
      }
    },
  );

  app.post(
    "/api/items/:id/suggestions",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const itemId = parseIdParam(req.params.id);
        const item = await storage.getScannedItem(itemId);

        if (!item) {
          return res.status(404).json({ error: "Item not found" });
        }

        const userProfile = await storage.getUserProfile(req.userId!);

        let dietaryContext = "";
        if (userProfile) {
          if (
            userProfile.allergies &&
            Array.isArray(userProfile.allergies) &&
            userProfile.allergies.length > 0
          ) {
            dietaryContext += `User allergies (avoid these ingredients): ${(userProfile.allergies as any[]).map((a) => a.name).join(", ")}. `;
          }
          if (userProfile.dietType) {
            dietaryContext += `Diet: ${userProfile.dietType}. `;
          }
          if (userProfile.cookingSkillLevel) {
            dietaryContext += `Cooking skill: ${userProfile.cookingSkillLevel}. `;
          }
          if (userProfile.cookingTimeAvailable) {
            dietaryContext += `Time: ${userProfile.cookingTimeAvailable}. `;
          }
        }

        const prompt = `Given this food item: "${item.productName}"${item.brandName ? ` by ${item.brandName}` : ""}, generate creative suggestions.

${dietaryContext ? `User preferences: ${dietaryContext}` : ""}

Generate exactly 4 suggestions in this JSON format:
{
  "suggestions": [
    {
      "type": "recipe",
      "title": "Recipe name",
      "description": "Brief 1-2 sentence description of how to use this ingredient",
      "difficulty": "Easy/Medium/Hard",
      "timeEstimate": "15 min"
    },
    {
      "type": "recipe",
      "title": "Another recipe",
      "description": "Description",
      "difficulty": "Easy",
      "timeEstimate": "30 min"
    },
    {
      "type": "craft",
      "title": "Fun kid activity with food packaging or theme",
      "description": "Brief description of a creative activity for kids",
      "timeEstimate": "20 min"
    },
    {
      "type": "pairing",
      "title": "What goes well with this",
      "description": "Complementary foods or drinks that pair nicely"
    }
  ]
}

Keep descriptions concise. Make recipes practical and kid activities fun and safe. Return only valid JSON.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful culinary and crafts assistant. Always respond with valid JSON only, no markdown formatting.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 1024,
        });

        const responseText = completion.choices[0]?.message?.content || "{}";
        const suggestions = JSON.parse(responseText);

        res.json(suggestions);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json(formatZodError(error));
        }
        console.error("Error generating suggestions:", error);
        res.status(500).json({ error: "Failed to generate suggestions" });
      }
    },
  );

  const httpServer = createServer(app);

  return httpServer;
}

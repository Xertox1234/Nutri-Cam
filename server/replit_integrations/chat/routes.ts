import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { storage } from "../../storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function buildSystemPrompt(profile: {
  allergies?: { name: string; severity: string }[];
  healthConditions?: string[];
  dietType?: string | null;
  primaryGoal?: string | null;
  activityLevel?: string | null;
  cuisinePreferences?: string[];
  cookingSkillLevel?: string | null;
  cookingTimeAvailable?: string | null;
} | null): string {
  let prompt = `You are NutriScan AI, a helpful nutrition and food assistant. You help users with:
- Analyzing nutrition information from scanned food labels
- Suggesting healthy recipes and meal ideas
- Providing personalized nutrition advice
- Answering questions about food, ingredients, and dietary needs

Be conversational, supportive, and knowledgeable about nutrition science.`;

  if (profile) {
    const restrictions: string[] = [];
    
    if (profile.allergies && profile.allergies.length > 0) {
      const allergyList = profile.allergies
        .map(a => `${a.name} (${a.severity})`)
        .join(", ");
      restrictions.push(`IMPORTANT - User has these food allergies: ${allergyList}. NEVER suggest foods containing these allergens. For severe allergies, also warn about cross-contamination.`);
    }

    if (profile.healthConditions && profile.healthConditions.length > 0) {
      const conditionMap: Record<string, string> = {
        diabetes_type1: "Type 1 Diabetes - needs to monitor carbs and blood sugar",
        diabetes_type2: "Type 2 Diabetes - needs to manage blood sugar levels",
        heart_disease: "Heart condition - recommend low sodium, heart-healthy foods",
        high_blood_pressure: "High blood pressure - limit salt/sodium intake",
        high_cholesterol: "High cholesterol - limit saturated fats and cholesterol",
        ibs: "IBS - avoid trigger foods, consider low FODMAP",
        celiac: "Celiac disease - STRICT gluten-free required",
        kidney_disease: "Kidney condition - may need to limit protein, potassium, phosphorus",
        pcos: "PCOS - hormone-balancing nutrition, lower glycemic foods",
        gerd: "GERD/Acid reflux - avoid acidic, spicy, and trigger foods",
      };
      const conditions = profile.healthConditions
        .map(c => conditionMap[c] || c)
        .join("; ");
      restrictions.push(`User manages these health conditions: ${conditions}. Tailor advice accordingly.`);
    }

    if (profile.dietType) {
      const dietMap: Record<string, string> = {
        omnivore: "Omnivore (eats everything)",
        vegetarian: "Vegetarian (no meat or fish)",
        vegan: "Vegan (no animal products)",
        pescatarian: "Pescatarian (vegetarian + fish)",
        keto: "Keto (very low carb, high fat)",
        paleo: "Paleo (whole foods, no grains)",
        mediterranean: "Mediterranean (plant-based, healthy fats)",
        halal: "Halal (Islamic dietary laws)",
        kosher: "Kosher (Jewish dietary laws)",
        low_fodmap: "Low FODMAP (for digestive health)",
      };
      restrictions.push(`Diet preference: ${dietMap[profile.dietType] || profile.dietType}`);
    }

    if (profile.primaryGoal) {
      const goalMap: Record<string, string> = {
        lose_weight: "lose weight",
        gain_muscle: "build muscle",
        maintain: "maintain current weight",
        eat_healthier: "eat healthier overall",
        manage_condition: "manage a health condition",
      };
      restrictions.push(`Primary goal: ${goalMap[profile.primaryGoal] || profile.primaryGoal}`);
    }

    if (profile.activityLevel) {
      restrictions.push(`Activity level: ${profile.activityLevel}`);
    }

    if (profile.cuisinePreferences && profile.cuisinePreferences.length > 0) {
      restrictions.push(`Preferred cuisines: ${profile.cuisinePreferences.join(", ")}`);
    }

    if (profile.cookingSkillLevel) {
      restrictions.push(`Cooking skill: ${profile.cookingSkillLevel}`);
    }

    if (profile.cookingTimeAvailable) {
      restrictions.push(`Cooking time preference: ${profile.cookingTimeAvailable}`);
    }

    if (restrictions.length > 0) {
      prompt += `\n\nUSER PROFILE:\n${restrictions.join("\n")}`;
    }
  }

  return prompt;
}

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get user's dietary profile for personalized responses
      let userProfile = null;
      if (req.session.userId) {
        userProfile = await storage.getUserProfile(req.session.userId);
      }

      // Build system prompt with user profile
      const systemPrompt = buildSystemPrompt(userProfile);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}


import OpenAI from "openai";
import { z } from "zod";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Zod schemas for runtime validation (from institutional learning: unsafe-type-cast-zod-validation)
const foodItemSchema = z.object({
  name: z.string(),
  quantity: z.string(),
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean(),
  clarificationQuestion: z.string().optional(),
});

const analysisResultSchema = z.object({
  foods: z.array(foodItemSchema),
  overallConfidence: z.number().min(0).max(1),
  followUpQuestions: z.array(z.string()),
});

export type FoodItem = z.infer<typeof foodItemSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;

// Confidence threshold for triggering follow-up questions
const CONFIDENCE_THRESHOLD = 0.7;

const SYSTEM_PROMPT = `You are a nutrition analysis assistant. Analyze food photos and identify:
1. Each distinct food item visible
2. Estimated portion size (e.g., "1 cup", "6 oz", "1 medium")
3. Your confidence level (0-1)
4. If uncertain about anything, include a clarifying question

Rules:
- Be specific with food names (e.g., "grilled chicken breast" not just "chicken")
- Use standard US portion sizes
- If you see a beverage, note it separately
- If portion is unclear, set needsClarification to true

Respond with JSON only matching this schema:
{
  "foods": [
    {
      "name": "food name",
      "quantity": "portion size",
      "confidence": 0.85,
      "needsClarification": false,
      "clarificationQuestion": "optional question"
    }
  ],
  "overallConfidence": 0.8,
  "followUpQuestions": ["any general questions about the meal"]
}`;

/**
 * Analyze a photo to identify foods and estimate portions
 * Uses GPT-4o Vision with detail: "low" for optimal speed (85 tokens, 512px)
 */
export async function analyzePhoto(
  imageBase64: string,
): Promise<AnalysisResult> {
  const startTime = Date.now();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500, // Limit for speed
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify all foods in this image with portion estimates:",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "low", // 85 tokens, 512px - faster processing
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";

    // Safe parsing with Zod
    const parsed = analysisResultSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      console.error("Vision API response validation failed:", parsed.error);
      return {
        foods: [],
        overallConfidence: 0,
        followUpQuestions: ["Could not analyze the image. Please try again."],
      };
    }

    console.log(`Vision analysis completed in ${Date.now() - startTime}ms`);
    return parsed.data;
  } catch (error) {
    console.error("Photo analysis error:", error);
    return {
      foods: [],
      overallConfidence: 0,
      followUpQuestions: [
        "An error occurred during analysis. Please try again.",
      ],
    };
  }
}

/**
 * Refine analysis based on follow-up answer
 */
export async function refineAnalysis(
  previousResult: AnalysisResult,
  question: string,
  answer: string,
): Promise<AnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are a nutrition analysis assistant. You previously analyzed a meal and had a follow-up question. Based on the user's answer, update the analysis.

Previous analysis: ${JSON.stringify(previousResult)}

Respond with JSON matching the same schema, with updated foods and confidence.`,
        },
        {
          role: "user",
          content: `Question: "${question}"\nAnswer: "${answer}"\n\nUpdate the analysis based on this clarification.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";

    const parsed = analysisResultSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      console.error("Refinement validation failed:", parsed.error);
      return previousResult;
    }

    return parsed.data;
  } catch (error) {
    console.error("Refinement error:", error);
    return previousResult;
  }
}

/**
 * Check if analysis needs follow-up questions
 */
export function needsFollowUp(result: AnalysisResult): boolean {
  return (
    result.overallConfidence < CONFIDENCE_THRESHOLD ||
    result.followUpQuestions.length > 0 ||
    result.foods.some((food) => food.needsClarification)
  );
}

/**
 * Get all follow-up questions from an analysis result
 */
export function getFollowUpQuestions(result: AnalysisResult): string[] {
  const questions: string[] = [];

  // Add general follow-up questions
  questions.push(...result.followUpQuestions);

  // Add item-specific clarification questions
  for (const food of result.foods) {
    if (food.needsClarification && food.clarificationQuestion) {
      questions.push(food.clarificationQuestion);
    }
  }

  return questions;
}

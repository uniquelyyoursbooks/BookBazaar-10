import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client if API key is available
let geminiClient: GoogleGenerativeAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Gemini API client initialized successfully");
  } else {
    console.warn("GEMINI_API_KEY not found in environment variables.");
  }
} catch (error) {
  console.error("Error initializing Gemini API client:", error);
}

// Simple interface for writing prompts
export interface WritingPrompt {
  title: string;
  prompt: string;
  context?: string;
  examples?: string[];
  tips?: string[];
}

export interface WritingPromptResponse {
  prompts: WritingPrompt[];
  relatedIdeas: string[];
}

export interface WritingPromptParams {
  genre?: string;
  toneOrMood?: string;
  type?: 'scene' | 'character' | 'plot' | 'setting' | 'dialogue' | 'conflict' | 'random';
  targetAudience?: string;
  additionalContext?: string;
  includeExamples?: boolean;
  count?: number;
}

/**
 * Generate fallback writing prompts when API calls fail
 */
function generateFallbackPrompts(params: WritingPromptParams): WritingPromptResponse {
  const { genre = "", count = 3 } = params;
  
  return {
    prompts: [
      {
        title: "The Hidden Path",
        prompt: "Write about a character who discovers a hidden path in a familiar location that leads to something unexpected.",
        context: "This prompt explores themes of discovery and the unknown within familiar settings.",
        examples: ["A gardener finds a hidden door in a garden they've tended for years", "A child discovers a passage in their home that wasn't there before"],
        tips: ["Consider what emotions the character feels upon this discovery", "Think about how this discovery changes their perspective"]
      },
      {
        title: "The Unexpected Letter",
        prompt: "Your character receives a letter that was never meant for them, but it changes everything.",
        context: "This prompt explores the impact of information and misdelivered communication.",
        tips: ["What consequences arise from reading someone else's mail?", "How does your character decide to act on this information?"]
      },
      {
        title: "Strangers on a Train",
        prompt: "Two strangers meet on a journey and share a conversation that profoundly affects both of them.",
        context: "This explores the theme of brief but meaningful human connections.",
        tips: ["Consider using dialogue to reveal character", "Think about how people reveal themselves to strangers"]
      }
    ].slice(0, count),
    relatedIdeas: [
      "Write about a character who discovers something valuable was hidden in plain sight",
      "Create a story where a misunderstanding leads to an unexpected adventure",
      "Explore a narrative where a character's routine is disrupted in a way that changes their life",
      "Write about someone who learns a secret that changes their understanding of their past"
    ]
  };
}

/**
 * Generate writing prompts using Gemini AI
 */
export async function generateWritingPrompts(params: WritingPromptParams): Promise<WritingPromptResponse> {
  // If Gemini client isn't available, return fallback prompts
  if (!geminiClient) {
    console.log("Gemini client not available, using fallback prompts");
    return generateFallbackPrompts(params);
  }
  
  const { 
    genre = "", 
    toneOrMood = "", 
    type = "random", 
    targetAudience = "", 
    additionalContext = "", 
    includeExamples = false, 
    count = 3 
  } = params;
  
  try {
    // Get the model
    const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Create a prompt for generating writing prompts
    const promptText = `Generate ${count} creative writing prompts${genre ? ` for the ${genre} genre` : ""}${toneOrMood ? ` with a ${toneOrMood} tone/mood` : ""}${targetAudience ? ` targeted at ${targetAudience}` : ""}.
    
    ${type !== "random" ? `Focus on ${type}-focused prompts.` : "Provide a mix of different types of prompts (character, plot, setting, etc.)."}
    ${additionalContext ? `Additional context or requirements: ${additionalContext}` : ""}
    
    For each prompt, include:
    1. A catchy title for the prompt
    2. The actual writing prompt (1-2 paragraphs)
    3. Optional context that might help the writer
    4. ${includeExamples ? "2-3 brief examples or variations of the prompt" : ""}
    5. 2-3 writing tips related to the prompt
    
    Also include a list of 4-5 related writing ideas that could inspire the author further.
    
    Format the response as a JSON object with the following structure:
    {
      "prompts": [
        {
          "title": "Prompt Title",
          "prompt": "The actual writing prompt...",
          "context": "Optional background or context...",
          "examples": ["Example 1", "Example 2"],
          "tips": ["Tip 1", "Tip 2"]
        }
      ],
      "relatedIdeas": ["Related idea 1", "Related idea 2"]
    }`;

    // Generate content
    const result = await model.generateContent(promptText);
    const responseText = result.response.text();
    
    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(responseText);
      return parsedResponse as WritingPromptResponse;
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.log("Raw response:", responseText);
      return generateFallbackPrompts(params);
    }
  } catch (error) {
    console.error("Error generating writing prompts with Gemini:", error);
    return generateFallbackPrompts(params);
  }
}
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Generate a fallback mood board for demonstration purposes when API calls fail
 * This is only used in non-production environments
 */
function generateFallbackMoodBoard(params: MoodBoardGeneratorParams): MoodBoardResponse {
  const { genre = "Fantasy", theme = "Adventure", setting = "Medieval Kingdom" } = params;
  
  return {
    title: `${genre || "Fantasy"} ${theme || "Adventure"} in ${setting || "a Magical Realm"}`,
    description: "A captivating journey through magical landscapes, featuring heroic characters facing incredible challenges. Perfect for epic tales of courage, friendship, and discovery.",
    items: [
      { 
        type: "quote", 
        content: "Not all those who wander are lost." 
      },
      { 
        type: "quote", 
        content: "Magic exists. Who can doubt it, when there are rainbows and wildflowers, the music of the wind and the silence of the stars?" 
      },
      { 
        type: "quote", 
        content: "The greatest adventure is what lies ahead." 
      },
      { 
        type: "quote", 
        content: "Even the darkest night will end and the sun will rise." 
      },
      { 
        type: "quote", 
        content: "There's wonder all around us, we just need the courage to see it." 
      },
      { 
        type: "prompt", 
        content: "A forgotten artifact is discovered in an ancient ruin, but its magic comes with an unexpected price." 
      },
      { 
        type: "prompt", 
        content: "Two rival kingdoms must unite against a common threat that emerges from beyond the known world." 
      },
      { 
        type: "prompt", 
        content: "A reluctant hero discovers they possess a rare magical ability that marks them as either a savior or destroyer." 
      },
      { 
        type: "prompt", 
        content: "An ancient prophecy begins to unfold, but its interpretation may not be what everyone assumed." 
      },
      { 
        type: "prompt", 
        content: "A journey to a sacred location reveals secrets about the world's history that changes everything." 
      },
      { 
        type: "theme", 
        content: "The tension between destiny and free will" 
      },
      { 
        type: "theme", 
        content: "The price of power and the responsibility it brings" 
      },
      { 
        type: "theme", 
        content: "Finding light in the darkest of times" 
      }
    ],
    imagePrompts: [
      "A majestic castle perched on a cliff edge, illuminated by the golden light of sunset with dragon silhouettes circling in the distance",
      "An ancient magical forest with bioluminescent plants and floating orbs of light between towering trees",
      "A bustling medieval marketplace with vendors selling magical artifacts, exotic creatures, and rare potions",
      "A battle scene with magical energies illuminating armored warriors, set against a dramatic stormy sky",
      "A council of diverse fantasy races gathered around a circular stone table with a glowing map"
    ],
    palette: {
      primary: "#4a6fa5",
      secondary: "#9b6a6c",
      accent: "#c9a66b",
      background: "#f0f4f8",
      text: "#2d3748"
    }
  };
}

interface MoodBoardGeneratorParams {
  genre?: string;
  theme?: string;
  setting?: string;
  additionalContext?: string;
}

interface MoodBoardItem {
  type: 'quote' | 'prompt' | 'theme' | 'imagePrompt';
  content: string;
}

export interface MoodBoardResponse {
  title: string;
  description: string;
  items: MoodBoardItem[];
  imagePrompts: string[];
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

/**
 * Generate a writing mood board based on provided parameters
 */
export async function generateWritingMoodBoard(params: MoodBoardGeneratorParams): Promise<MoodBoardResponse> {
  const { genre = "", theme = "", setting = "", additionalContext = "" } = params;
  
  const promptText = `Generate a writing mood board for an author who is creating a ${genre || "new"} story ${theme ? `with themes of ${theme}` : ""} ${setting ? `set in ${setting}` : ""} ${additionalContext ? `Additional context: ${additionalContext}` : ""}.
  
  The mood board should include:
  1. A catchy title for the mood board
  2. A brief description of the overall aesthetic and emotional tone
  3. Five inspirational quotes related to the genre/theme/setting
  4. Five writing prompts to inspire the author
  5. Three suggested themes to explore
  6. Five detailed image prompts that could be used to generate visuals for the mood board (these should be descriptive and evocative)
  7. A suggested color palette with hex codes (primary, secondary, accent, background, and text colors)
  
  Format the response as a JSON object with the following structure:
  {
    "title": "Mood Board Title",
    "description": "Brief description of the mood board aesthetic and emotional tone",
    "items": [
      {"type": "quote", "content": "Quote text here..."},
      {"type": "prompt", "content": "Writing prompt here..."},
      {"type": "theme", "content": "Theme description here..."},
      ... additional items
    ],
    "imagePrompts": ["Detailed image prompt 1", "Detailed image prompt 2", ...],
    "palette": {
      "primary": "#HEXCODE",
      "secondary": "#HEXCODE",
      "accent": "#HEXCODE",
      "background": "#HEXCODE",
      "text": "#HEXCODE"
    }
  }
  
  Make sure the mood board is cohesive, thought-provoking, and tailored to the specified genre, theme, and setting.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a creative writing assistant specializing in generating inspirational mood boards for authors." },
        { role: "user", content: promptText }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}") as MoodBoardResponse;
    return result;
  } catch (error) {
    console.error("Error generating mood board:", error);
    
    // Return a fallback mood board for demonstrating the UI when API calls fail
    if (process.env.NODE_ENV !== 'production') {
      console.log("Using fallback mood board for demonstration purposes");
      return generateFallbackMoodBoard(params);
    }
    
    throw new Error("Failed to generate mood board. Please try again later.");
  }
}

/**
 * Generate text-to-image prompts for mood board images
 */
export async function refineImagePrompt(basePrompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "system", 
          content: "You are an expert at creating detailed, vivid image generation prompts. You take simple concepts and expand them into prompts that would create beautiful, atmospheric visual output from image generators."
        },
        { 
          role: "user", 
          content: `Refine this basic image prompt into a more detailed, atmospheric description that would work well for image generation: "${basePrompt}". Include details about lighting, mood, style, composition, but keep it concise (under 100 words).`
        }
      ]
    });

    return response.choices[0].message.content || basePrompt;
  } catch (error) {
    console.error("Error refining image prompt:", error);
    return basePrompt; // Return original prompt if refinement fails
  }
}
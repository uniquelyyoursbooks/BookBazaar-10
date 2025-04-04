import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

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
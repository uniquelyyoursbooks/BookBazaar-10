import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { createWriteStream } from "fs";
import { promisify } from "util";
import { pipeline } from "stream";

// Define interfaces here instead of importing from openai to avoid circular dependencies
export interface WritingPromptParams {
  genre?: string;
  toneOrMood?: string;
  type?: 'scene' | 'character' | 'plot' | 'setting' | 'dialogue' | 'conflict' | 'random';
  targetAudience?: string;
  additionalContext?: string;
  includeExamples?: boolean;
  count?: number;
}

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

export interface MoodBoardGeneratorParams {
  genre?: string;
  theme?: string;
  setting?: string;
  additionalContext?: string;
}

export interface MoodBoardItem {
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

export interface BookRecommendationParams {
  userId?: number;
  genre?: string;
  recentlyRead?: string[];
  interests?: string[];
  limit?: number;
}

export interface BookRecommendation {
  title: string;
  author: string;
  genre: string;
  description: string;
  reasons: string[];
  similarTo?: string;
}

export interface BookCoverParams {
  title: string;
  author?: string;
  genre?: string;
  description?: string;
  style?: string;
  mood?: string;
  color?: string;
}

export interface BookCoverResponse {
  imageUrl: string;
  prompt: string;
}

export interface BookGenerationParams {
  title?: string;
  genre?: string;
  description?: string;
  outline?: string;
  characterDescriptions?: string;
  targetAudience?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  additionalInstructions?: string;
}

export interface BookGenerationResponse {
  title: string;
  outline: {
    chapters: {
      title: string;
      content: string;
    }[];
  };
  coverPrompt: string;
  keywords: string[];
  metadata: {
    targetAudience: string;
    readingLevel: string;
    themes: string[];
    mood: string;
    settings: string[];
    contentWarnings?: string[];
  };
}

// Initialize Gemini client if API key is available
let geminiClient: GoogleGenerativeAI | null = null;
let textModel: GenerativeModel | null = null;
let imageModel: GenerativeModel | null = null;

try {
  if (process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    textModel = geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
    imageModel = geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
    console.log("Gemini API client initialized successfully");
  } else {
    console.warn("GEMINI_API_KEY not found in environment variables. Using fallback functions for development.");
  }
} catch (error) {
  console.error("Error initializing Gemini API client:", error);
}

const streamPipeline = promisify(pipeline);

// Safety settings for content generation
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/**
 * Generate a fallback writing prompt response for demonstration purposes when API calls fail
 */
function generateFallbackWritingPrompts(params: WritingPromptParams): WritingPromptResponse {
  const { 
    genre = "", 
    toneOrMood = "", 
    type = "random", 
    count = 3 
  } = params;
  
  const fallbackPrompts: WritingPrompt[] = [
    {
      title: "The Last Letter",
      prompt: "Write a story that begins with a character finding an unsent letter from someone who has passed away.",
      context: "This prompt explores themes of grief, regret, and unspoken words.",
      examples: [
        "A daughter finds her mother's unsent letter to an unknown recipient in another country.",
        "A soldier discovers a letter his fallen comrade never sent to their spouse."
      ],
      tips: [
        "Consider how the letter's contents might change the character's understanding of the deceased.",
        "Think about whether the character decides to deliver the letter or not, and why."
      ]
    },
    {
      title: "Shifting Perspectives",
      prompt: "Write a scene from three different perspectives, where each character interprets the same events in wildly different ways.",
      context: "This exercise helps develop multiple character viewpoints and demonstrates how perception shapes reality.",
      examples: [
        "A first date described by both participants and an observing friend.",
        "A confrontation at work seen by the boss, an employee, and a customer."
      ],
      tips: [
        "Focus on how each character's background and motivations color their interpretation.",
        "Use distinct voice and language patterns for each perspective to differentiate them."
      ]
    },
    {
      title: "When Time Stops",
      prompt: "Write about a moment when time seems to stand still for your protagonist.",
      context: "This prompt explores those pivotal moments in life that feel suspended in time due to their emotional impact.",
      examples: [
        "A performer experiencing stage fright before stepping into the spotlight.",
        "A parent watching their child take their first steps."
      ],
      tips: [
        "Use sensory details to immerse the reader in the moment.",
        "Play with pacing to emphasize the distortion of time."
      ]
    }
  ];

  return {
    prompts: fallbackPrompts.slice(0, count),
    relatedIdeas: [
      "Write about a character who discovers a hidden family secret",
      "Create a story where the protagonist realizes they've been misinterpreting a relationship",
      "Explore a character facing their biggest fear",
      "Write about someone who gets a second chance at something important",
      "Create a story about unlikely allies working together"
    ]
  };
}

/**
 * Generate a fallback mood board for demonstration purposes when API calls fail
 */
function generateFallbackMoodBoard(params: MoodBoardGeneratorParams): MoodBoardResponse {
  const { genre = "", theme = "", setting = "" } = params;
  
  return {
    title: "Creative Writing Inspiration",
    description: "A collection of ideas, themes, and visual prompts to inspire your writing session.",
    items: [
      {
        type: "quote",
        content: "The scariest moment is always just before you start. After that, things can only get better. – Stephen King"
      },
      {
        type: "prompt",
        content: "Write a scene where your character confronts their greatest fear."
      },
      {
        type: "theme",
        content: "Exploration of identity and self-discovery through unexpected challenges"
      },
      {
        type: "imagePrompt",
        content: "A path diverging in a misty forest at dawn, sunlight filtering through ancient trees"
      },
      {
        type: "quote",
        content: "Tell the truth through whichever veil comes to hand — but tell it. – Zadie Smith"
      },
      {
        type: "prompt",
        content: "Describe a setting where time moves differently than in the normal world."
      }
    ],
    imagePrompts: [
      "A weathered lighthouse on a rocky coast during a storm, warm light glowing from the windows",
      "An abandoned library with books scattered across the floor, a single beam of sunlight illuminating floating dust particles",
      "A character standing at crossroads under a starry night sky, holding a glowing lantern"
    ],
    palette: {
      primary: "#3a506b",
      secondary: "#5bc0be",
      accent: "#e76f51",
      background: "#f1faee",
      text: "#1d3557"
    }
  };
}

/**
 * Generate fallback book recommendations when API calls fail
 */
function generateFallbackRecommendations(params: BookRecommendationParams): BookRecommendation[] {
  const { limit = 3, genre = "" } = params;
  
  const recommendations: BookRecommendation[] = [
    {
      title: "The Midnight Library",
      author: "Matt Haig",
      genre: "Contemporary Fiction",
      description: "A novel about regret, hope, and transformation, exploring the infinite possibilities of life.",
      reasons: [
        "Compelling exploration of alternative life choices",
        "Accessible philosophical themes",
        "Emotionally resonant narrative"
      ]
    },
    {
      title: "Project Hail Mary",
      author: "Andy Weir",
      genre: "Science Fiction",
      description: "An astronaut with amnesia must save humanity from an extinction-level threat.",
      reasons: [
        "Scientifically accurate problem-solving",
        "Engaging first-person narrative",
        "Unique take on alien contact"
      ]
    },
    {
      title: "The House in the Cerulean Sea",
      author: "TJ Klune",
      genre: "Fantasy",
      description: "A heartwarming tale about a caseworker assigned to investigate an orphanage of magical children.",
      reasons: [
        "Found family dynamics",
        "Charming, whimsical tone",
        "Meaningful exploration of prejudice and acceptance"
      ]
    },
    {
      title: "Circe",
      author: "Madeline Miller",
      genre: "Mythological Fiction",
      description: "A feminist retelling of the story of Circe, a witch from Greek mythology.",
      reasons: [
        "Rich, lyrical prose",
        "Fascinating reimagining of classical mythology",
        "Strong character development"
      ]
    },
    {
      title: "The Song of Achilles",
      author: "Madeline Miller",
      genre: "Historical Fiction",
      description: "A retelling of the Iliad focusing on the relationship between Achilles and Patroclus.",
      reasons: [
        "Beautiful prose",
        "Emotional depth",
        "Faithful yet fresh adaptation of classic mythology"
      ]
    }
  ];
  
  return recommendations.slice(0, limit);
}

/**
 * Generate writing prompts based on provided parameters using Gemini API
 */
export async function generateWritingPrompts(params: WritingPromptParams): Promise<WritingPromptResponse> {
  const { 
    genre = "", 
    toneOrMood = "", 
    type = "random", 
    targetAudience = "", 
    additionalContext = "", 
    includeExamples = false, 
    count = 3 
  } = params;
  
  // If Gemini client isn't available, return fallback prompts
  if (!geminiClient || !textModel) {
    console.log("Using fallback writing prompts for demonstration purposes");
    return generateFallbackWritingPrompts(params);
  }
  
  try {
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
        },
        ...
      ],
      "relatedIdeas": ["Related idea 1", "Related idea 2", ...]
    }`;

    const result = await textModel.generateContent([
      { text: promptText }
    ], {
      temperature: 0.7,
      topP: 0.95,
      safetySettings,
    });

    const responseText = result.response.text();
    
    // Parse the JSON response - If the response isn't valid JSON, this will throw an error
    // which will be caught and handled by the catch block
    const parsedResponse = JSON.parse(responseText);
    
    return parsedResponse as WritingPromptResponse;
  } catch (error) {
    console.error("Error generating writing prompts with Gemini:", error);
    
    // Return fallback prompts for demo purposes in non-production
    if (process.env.NODE_ENV !== 'production') {
      console.log("Using fallback writing prompts for demonstration purposes");
      return generateFallbackWritingPrompts(params);
    }
    
    throw new Error("Failed to generate writing prompts. Please try again later.");
  }
}

/**
 * Generate a writing mood board based on provided parameters
 */
export async function generateWritingMoodBoard(params: MoodBoardGeneratorParams): Promise<MoodBoardResponse> {
  const { genre = "", theme = "", setting = "", additionalContext = "" } = params;
  
  // If Gemini client isn't available, return fallback mood board
  if (!geminiClient || !textModel) {
    console.log("Using fallback mood board for demonstration purposes");
    return generateFallbackMoodBoard(params);
  }
  
  try {
    const promptText = `Create a writing mood board for ${genre ? `a ${genre} story` : "creative writing"}${theme ? ` with themes of ${theme}` : ""}${setting ? ` set in ${setting}` : ""}${additionalContext ? `. Additional context: ${additionalContext}` : ""}.
    
    Include the following elements:
    1. A title for the mood board
    2. A brief description of the mood/atmosphere
    3. A list of inspiration items including:
      - 2-3 relevant quotes from literature
      - 2-3 writing prompts related to the theme
      - 1-2 thematic statements
      - 1-2 suggestions for visual imagery
    4. 3 detailed image prompts that could be used to generate visuals that match the mood
    5. A color palette with 5 colors (primary, secondary, accent, background, text) in hex format
    
    Format your response as a JSON object with the following structure:
    {
      "title": "Mood Board Title",
      "description": "Description of the mood/atmosphere",
      "items": [
        {"type": "quote", "content": "Quote text and attribution"},
        {"type": "prompt", "content": "Writing prompt text"},
        {"type": "theme", "content": "Thematic statement"},
        {"type": "imagePrompt", "content": "Description of a visual element"}
      ],
      "imagePrompts": ["Detailed image prompt 1", "Detailed image prompt 2", "Detailed image prompt 3"],
      "palette": {
        "primary": "#hexcode",
        "secondary": "#hexcode",
        "accent": "#hexcode",
        "background": "#hexcode",
        "text": "#hexcode"
      }
    }`;

    const result = await textModel.generateContent([
      { text: promptText }
    ], {
      temperature: 0.7,
      topP: 0.95,
      safetySettings,
    });

    const responseText = result.response.text();
    const parsedResponse = JSON.parse(responseText);
    
    return parsedResponse as MoodBoardResponse;
  } catch (error) {
    console.error("Error generating writing mood board with Gemini:", error);
    
    // Return fallback mood board for demo purposes in non-production
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
  // If Gemini client isn't available, return the base prompt
  if (!geminiClient || !textModel) {
    console.log("Using original prompt as Gemini API is not available");
    return basePrompt;
  }
  
  try {
    const promptText = `Transform this basic image concept into a detailed, vivid text-to-image prompt for a book cover or illustration:
    
    "${basePrompt}"
    
    Enhance the prompt with specific details about:
    - Visual style and artistic medium
    - Color palette and mood/atmosphere
    - Composition details and focal points
    - Lighting conditions
    - Textures and materials
    
    Don't use placeholder text like [X] or [Y]. Use specific details instead.
    Make the prompt descriptive but concise (maximum 100 words).
    Do not include any safety disclaimers in your response, simply return the enhanced prompt.`;

    const result = await textModel.generateContent({
      contents: [{ role: "user", text: promptText }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
      },
      safetySettings,
    });

    return result.response.text().trim();
  } catch (error) {
    console.error("Error refining image prompt with Gemini:", error);
    // If there's an error, just return the original prompt
    return basePrompt;
  }
}

/**
 * Generate book recommendations based on user preferences and reading history
 */
export async function generateBookRecommendations(params: BookRecommendationParams): Promise<BookRecommendation[]> {
  const { 
    userId, 
    genre = "", 
    recentlyRead = [], 
    interests = [], 
    limit = 5 
  } = params;
  
  // If Gemini client isn't available, return fallback recommendations
  if (!geminiClient || !textModel) {
    console.log("Using fallback book recommendations for demonstration purposes");
    return generateFallbackRecommendations(params);
  }
  
  try {
    // Create a prompt for the book recommendations
    const promptText = `Generate ${limit} book recommendations for a reader with the following preferences:
    ${genre ? `- Preferred genre: ${genre}` : ''}
    ${recentlyRead.length ? `- Recently read books: ${recentlyRead.join(', ')}` : ''}
    ${interests.length ? `- Expressed interests: ${interests.join(', ')}` : ''}
    
    Provide recommendations as a JSON array of objects with the following structure:
    [
      {
        "title": "Book Title",
        "author": "Author Name",
        "genre": "Book Genre",
        "description": "A brief compelling description of the book (1-2 sentences)",
        "reasons": ["Reason 1 why this matches the reader's preferences", "Reason 2", ...],
        "similarTo": "Title of a book from the recently read list that this recommendation is similar to (if applicable)"
      },
      ...
    ]
    
    Make sure the recommendations are diverse but still match the reader's preferences.
    Do not recommend books that are already in the recently read list.`;

    const result = await textModel.generateContent({
      contents: [{ role: "user", text: promptText }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        responseMimeType: "application/json",
      },
      safetySettings,
    });

    const responseText = result.response.text();
    const parsedResponse = JSON.parse(responseText);
    
    return parsedResponse as BookRecommendation[];
  } catch (error) {
    console.error("Error generating book recommendations with Gemini:", error);
    
    // Return fallback recommendations for demo purposes in non-production
    if (process.env.NODE_ENV !== 'production') {
      console.log("Using fallback book recommendations for demonstration purposes");
      return generateFallbackRecommendations(params);
    }
    
    throw new Error("Failed to generate book recommendations. Please try again later.");
  }
}

/**
 * Generate an AI book cover based on provided parameters
 * Note: Gemini doesn't directly generate images like DALL-E, so this would normally
 * need to be integrated with a separate image generation API
 */
export async function generateBookCover(params: BookCoverParams): Promise<BookCoverResponse> {
  const { 
    title, 
    author = "", 
    genre = "", 
    description = "", 
    style = "", 
    mood = "", 
    color = "" 
  } = params;
  
  // For now, we'll return a placeholder response since we're not implementing actual image generation
  return {
    imageUrl: "https://placehold.co/800x1200/3a506b/ffffff?text=Book+Cover+Placeholder",
    prompt: `A book cover for "${title}" by ${author}. Genre: ${genre}. ${description}. Style: ${style}. Mood: ${mood}. Primary color: ${color}.`
  };
}

/**
 * Generate a variation of an existing book cover
 * Note: Gemini doesn't directly generate image variations like DALL-E
 */
export async function generateBookCoverVariation(imageUrl: string, modificationPrompt: string): Promise<BookCoverResponse> {
  // For now, we'll return a placeholder response
  return {
    imageUrl: "https://placehold.co/800x1200/5bc0be/ffffff?text=Cover+Variation+Placeholder", 
    prompt: `A variation of the existing book cover with modifications: ${modificationPrompt}`
  };
}

/**
 * Generate an outline for a book based on provided parameters
 */
export async function generateBookOutline(params: BookGenerationParams): Promise<{title: string, chapters: {title: string, summary: string}[]}> {
  const { 
    title = "", 
    genre = "", 
    description = "", 
    characterDescriptions = "", 
    targetAudience = "", 
    tone = "", 
    length = "medium", 
    additionalInstructions = "" 
  } = params;
  
  // If Gemini client isn't available, return a basic outline
  if (!geminiClient || !textModel) {
    return {
      title: title || "Untitled Book",
      chapters: [
        { title: "Chapter 1: Introduction", summary: "The beginning of the story." },
        { title: "Chapter 2: Rising Action", summary: "The plot develops." },
        { title: "Chapter 3: Climax", summary: "The peak of the story." },
        { title: "Chapter 4: Resolution", summary: "The conclusion of the story." }
      ]
    };
  }
  
  try {
    const chapterCount = length === "short" ? "5-8" : length === "medium" ? "10-15" : "20-30";
    
    const promptText = `Generate a detailed book outline for${title ? ` "${title}"` : ` a ${genre} book`}.
    
    Book details:
    ${title ? `- Title: ${title}` : ""}
    ${genre ? `- Genre: ${genre}` : ""}
    ${description ? `- Synopsis: ${description}` : ""}
    ${characterDescriptions ? `- Characters: ${characterDescriptions}` : ""}
    ${targetAudience ? `- Target audience: ${targetAudience}` : ""}
    ${tone ? `- Tone: ${tone}` : ""}
    - Length: ${chapterCount} chapters
    ${additionalInstructions ? `- Additional notes: ${additionalInstructions}` : ""}
    
    Generate a compelling title (if not already provided) and create a chapter-by-chapter outline.
    For each chapter, include a title and a brief summary of the key events or content (2-4 sentences).
    
    Format as a JSON object:
    {
      "title": "Book Title",
      "chapters": [
        {"title": "Chapter 1: Chapter Title", "summary": "Summary of chapter content..."},
        ...
      ]
    }`;

    const result = await textModel.generateContent({
      contents: [{ role: "user", text: promptText }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        responseMimeType: "application/json",
      },
      safetySettings,
    });

    const responseText = result.response.text();
    const parsedResponse = JSON.parse(responseText);
    
    return parsedResponse;
  } catch (error) {
    console.error("Error generating book outline with Gemini:", error);
    
    // Return a basic outline if there's an error
    return {
      title: title || "Untitled Book",
      chapters: [
        { title: "Chapter 1: Introduction", summary: "The beginning of the story." },
        { title: "Chapter 2: Rising Action", summary: "The plot develops." },
        { title: "Chapter 3: Climax", summary: "The peak of the story." },
        { title: "Chapter 4: Resolution", summary: "The conclusion of the story." }
      ]
    };
  }
}

/**
 * Generate a complete book based on outline and parameters
 */
export async function generateBook(params: BookGenerationParams): Promise<BookGenerationResponse> {
  const { 
    title = "",
    genre = "",
    description = "",
    outline = "",
    characterDescriptions = "",
    targetAudience = "",
    tone = "",
    additionalInstructions = ""
  } = params;

  // Generate the book outline first (or use the provided outline)
  let bookOutline;
  if (outline) {
    // Parse the provided outline if it's a string
    try {
      bookOutline = typeof outline === 'string' ? JSON.parse(outline) : outline;
    } catch (e) {
      // If parsing fails, generate a new outline
      bookOutline = await generateBookOutline(params);
    }
  } else {
    // Generate a new outline
    bookOutline = await generateBookOutline(params);
  }

  // For demonstration purposes, we'll generate a basic book structure
  // In a real implementation, you'd generate content for each chapter
  const bookTitle = bookOutline.title || title || "Untitled Book";
  const chapters = bookOutline.chapters || [];

  // Generate placeholder content for each chapter
  const chaptersWithContent = chapters.map(chapter => ({
    title: chapter.title,
    content: `This is placeholder content for ${chapter.title}. In the full implementation, this would contain generated text based on the chapter summary: ${chapter.summary}`
  }));

  // The complete book response
  const bookResponse: BookGenerationResponse = {
    title: bookTitle,
    outline: {
      chapters: chaptersWithContent
    },
    coverPrompt: `Book cover for "${bookTitle}", a ${genre} book. ${description}`,
    keywords: [genre, tone, "writing", "literature"],
    metadata: {
      targetAudience: targetAudience || "General readers",
      readingLevel: "Adult",
      themes: [genre, "creativity"],
      mood: tone || "Neutral",
      settings: ["Various locations"],
    }
  };

  return bookResponse;
}

/**
 * Generate book PDF
 */
export async function generateBookPDF(book: BookGenerationResponse, outputPath: string): Promise<string> {
  try {
    // Placeholder for PDF generation
    // In a real implementation, this would create a PDF from the book content
    const pdfPath = path.join(outputPath, `${book.title.replace(/\s+/g, '_')}.pdf`);
    
    // Create a simple text file as a placeholder
    const content = `# ${book.title}\n\n`;
    fs.writeFileSync(pdfPath, content);
    
    return pdfPath;
  } catch (error) {
    console.error("Error generating book PDF:", error);
    throw new Error("Failed to generate book PDF. Please try again later.");
  }
}
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { createWriteStream } from "fs";
import { promisify } from "util";
import { pipeline } from "stream";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const streamPipeline = promisify(pipeline);

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// DALL-E model for image generation
const IMAGE_MODEL = "dall-e-3";

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

/**
 * Interface for book recommendation parameters
 */
export interface BookRecommendationParams {
  userId?: number;
  genre?: string;
  recentlyRead?: string[];
  interests?: string[];
  limit?: number;
}

/**
 * Interface for a single book recommendation 
 */
export interface BookRecommendation {
  title: string;
  author: string;
  genre: string;
  description: string;
  reasons: string[];
  similarTo?: string;
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

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a knowledgeable literary expert who provides thoughtful book recommendations." },
        { role: "user", content: promptText }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const content = response.choices[0].message.content || "{}";
    const parsedResponse = JSON.parse(content);
    
    // Make sure we have an array of recommendations
    const recommendations = Array.isArray(parsedResponse) 
      ? parsedResponse 
      : parsedResponse.recommendations || [];
      
    return recommendations as BookRecommendation[];
  } catch (error) {
    console.error("Error generating book recommendations:", error);
    
    // Return fallback recommendations for demo purposes in non-production
    if (process.env.NODE_ENV !== 'production') {
      console.log("Using fallback book recommendations for demonstration purposes");
      return generateFallbackRecommendations(params);
    }
    
    throw new Error("Failed to generate book recommendations. Please try again later.");
  }
}

/**
 * Interface for book cover generation parameters
 */
export interface BookCoverParams {
  title: string;
  author?: string;
  genre?: string;
  description?: string;
  style?: string;
  mood?: string;
  color?: string;
}

/**
 * Interface for book cover response
 */
export interface BookCoverResponse {
  imageUrl: string;
  prompt: string;
}

/**
 * Generate an AI book cover based on provided parameters
 */
export async function generateBookCover(params: BookCoverParams): Promise<BookCoverResponse> {
  const { 
    title, 
    author = "", 
    genre = "", 
    description = "", 
    style = "modern", 
    mood = "professional", 
    color = ""
  } = params;
  
  // First, generate an optimized prompt for the cover
  let promptText = `Create a prompt for a book cover design for the book "${title}"`;
  
  if (author) promptText += ` by ${author}`;
  if (genre) promptText += `, genre: ${genre}`;
  if (description) promptText += `. The book is about: ${description}`;
  if (style) promptText += `. Style should be ${style}`;
  if (mood) promptText += `, mood should be ${mood}`;
  if (color) promptText += `, prominently featuring the color ${color}`;
  
  promptText += `. The prompt should be detailed but concise, including visual elements, 
  style, typography suggestions, and mood. The cover should look professional and 
  commercially viable, like a book you'd see in a bookstore. Don't include text in the image itself.`;
  
  try {
    // First, generate the optimized prompt for DALL-E
    const promptResponse = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "system", 
          content: "You are an expert book cover designer and prompt engineer. You create concise, detailed prompts for AI image generators to create stunning book covers."
        },
        { role: "user", content: promptText }
      ]
    });
    
    const refinedPrompt = promptResponse.choices[0].message.content || "";
    
    // Now generate the actual image using DALL-E
    const imageResponse = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt: refinedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid"
    });
    
    return {
      imageUrl: imageResponse.data[0].url || "",
      prompt: refinedPrompt
    };
  } catch (error) {
    console.error("Error generating book cover:", error);
    
    // Return a fallback error response
    throw new Error("Failed to generate book cover. Please try again later.");
  }
}

/**
 * Generate a variation of an existing book cover
 */
export async function generateBookCoverVariation(imageUrl: string, modificationPrompt: string): Promise<BookCoverResponse> {
  try {
    // Generate a variation with the modified prompt
    const imageResponse = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt: modificationPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid"
    });
    
    return {
      imageUrl: imageResponse.data[0].url || "",
      prompt: modificationPrompt
    };
  } catch (error) {
    console.error("Error generating book cover variation:", error);
    throw new Error("Failed to generate book cover variation. Please try again later.");
  }
}

/**
 * Generate fallback book recommendations when API calls fail
 */
function generateFallbackRecommendations(params: BookRecommendationParams): BookRecommendation[] {
  const { genre = "" } = params;
  
  // Basic genre-based fallback recommendations
  const recommendations: Record<string, BookRecommendation[]> = {
    "fantasy": [
      {
        title: "The Name of the Wind",
        author: "Patrick Rothfuss",
        genre: "Fantasy",
        description: "A young arcanist struggles to survive while searching for answers about the mysterious beings who killed his family.",
        reasons: ["Immersive world-building", "Complex magic system", "Well-developed characters"],
      },
      {
        title: "The Fifth Season",
        author: "N.K. Jemisin",
        genre: "Fantasy",
        description: "In a world constantly experiencing catastrophic climate change, certain people have the ability to control seismic activity.",
        reasons: ["Award-winning novel", "Unique magic system", "Rich character development"],
      },
    ],
    "science_fiction": [
      {
        title: "Project Hail Mary",
        author: "Andy Weir",
        genre: "Science Fiction",
        description: "An amnesiac schoolteacher awakens on a spacecraft with two dead crewmates and must save humanity from extinction.",
        reasons: ["Scientific accuracy", "Problem-solving narrative", "First contact story"],
      },
      {
        title: "Hyperion",
        author: "Dan Simmons",
        genre: "Science Fiction",
        description: "Seven pilgrims share their tales while traveling to the Time Tombs on Hyperion, where the mysterious and deadly Shrike awaits.",
        reasons: ["Complex world-building", "Canterbury Tales-inspired structure", "Philosophical themes"],
      },
    ],
    "mystery": [
      {
        title: "The Silent Patient",
        author: "Alex Michaelides",
        genre: "Mystery",
        description: "A psychotherapist becomes obsessed with uncovering the story behind a famous painter who shot her husband and then never spoke again.",
        reasons: ["Psychological suspense", "Unreliable narrator", "Shocking twist ending"],
      },
      {
        title: "The Thursday Murder Club",
        author: "Richard Osman",
        genre: "Mystery",
        description: "Four septuagenarians meet weekly to solve cold cases until a fresh murder occurs right on their doorstep.",
        reasons: ["Charming characters", "Humorous tone", "Clever mystery plot"],
      },
    ],
    "romance": [
      {
        title: "The Love Hypothesis",
        author: "Ali Hazelwood",
        genre: "Romance",
        description: "A PhD candidate impulsively kisses a young professor to convince her friend she's dating, leading to a fake relationship with surprising chemistry.",
        reasons: ["STEM setting", "Fake dating trope", "Witty dialogue"],
      },
      {
        title: "Red, White & Royal Blue",
        author: "Casey McQuiston",
        genre: "Romance",
        description: "The First Son of the United States falls in love with a British prince after their public rivalry turns into a secret friendship.",
        reasons: ["LGBTQ+ representation", "Political setting", "Enemies-to-lovers trope"],
      },
    ],
    "historical": [
      {
        title: "The Nightingale",
        author: "Kristin Hannah",
        genre: "Historical Fiction",
        description: "Two sisters in Nazi-occupied France take different paths to survival and resistance during World War II.",
        reasons: ["Strong female protagonists", "Well-researched historical setting", "Emotional impact"],
      },
      {
        title: "Pachinko",
        author: "Min Jin Lee",
        genre: "Historical Fiction",
        description: "A sweeping saga following four generations of a Korean family who move to Japan, facing discrimination and hardship.",
        reasons: ["Multi-generational story", "Cultural insights", "Powerful examination of identity"],
      },
    ]
  };

  // Default to fantasy if no matching genre or genre not provided
  const genreKey = genre.toLowerCase().replace(/[^a-z_]/g, '');
  const result = recommendations[genreKey] || recommendations["fantasy"];
  
  // Add some generic recommendations if we don't have enough
  const genericRecs = [
    {
      title: "The Midnight Library",
      author: "Matt Haig",
      genre: "Fiction",
      description: "A woman discovers a library beyond the edge of life containing books with different versions of her life.",
      reasons: ["Philosophical themes", "Exploration of regret and possibility", "Uplifting message"],
    },
    {
      title: "Educated",
      author: "Tara Westover",
      genre: "Memoir",
      description: "A woman raised by survivalists in the mountains of Idaho leaves home to educate herself, eventually earning a PhD from Cambridge University.",
      reasons: ["Inspiring true story", "Exploration of education and self-determination", "Beautifully written"]
    }
  ];
  
  // Return a mix of genre-specific and generic recommendations
  return [...result, ...genericRecs].slice(0, params.limit || 5);
}

/**
 * Interface for book generation parameters
 */
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

/**
 * Interface for chapter generation parameters
 */
interface ChapterGenerationParams {
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  totalChapters: number;
  previousChapterSummary?: string;
  outline: string;
  genre: string;
  tone: string;
  targetAudience: string;
}

/**
 * Interface for the book generation response
 */
export interface BookGenerationResponse {
  title: string;
  outline: {
    chapters: {
      title: string;
      content: string;
    }[];
  };
  coverPrompt: string;
}

/**
 * Generate an outline for a book based on provided parameters
 */
export async function generateBookOutline(params: BookGenerationParams): Promise<{title: string, chapters: {title: string, summary: string}[]}> {
  const { 
    title = "", 
    genre = "fiction", 
    description = "", 
    outline = "",
    characterDescriptions = "",
    targetAudience = "general",
    tone = "balanced",
    length = "medium",
    additionalInstructions = ""
  } = params;
  
  // Define chapter count based on length
  const chapterCounts = {
    short: "5-7",
    medium: "10-12",
    long: "15-20"
  };
  
  // Create a prompt for the outline generation
  const promptText = `
  Generate a detailed chapter-by-chapter outline for a ${genre} book ${title ? `titled "${title}"` : ""}.
  ${description ? `The book is about: ${description}` : ""}
  ${outline ? `The author has provided the following outline ideas: ${outline}` : ""}
  ${characterDescriptions ? `Character descriptions: ${characterDescriptions}` : ""}
  
  The book should be appropriate for a ${targetAudience} audience with a ${tone} tone.
  Create ${chapterCounts[length]} chapters.
  ${additionalInstructions ? `Additional instructions: ${additionalInstructions}` : ""}
  
  Provide the outline as a JSON object with the following structure:
  {
    "title": "Final book title",
    "chapters": [
      {
        "title": "Chapter 1 title",
        "summary": "Detailed summary of the chapter (100-200 words)"
      },
      ...
    ]
  }
  
  Make sure the chapters flow logically and create a cohesive narrative with proper story structure, including setup, rising action, climax, and resolution.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a professional book editor and author who helps create compelling book outlines." },
        { role: "user", content: promptText }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating book outline:", error);
    throw new Error("Failed to generate book outline. Please try again later.");
  }
}

/**
 * Generate a single chapter based on provided parameters
 */
async function generateChapter(params: ChapterGenerationParams): Promise<string> {
  const { 
    bookTitle,
    chapterTitle, 
    chapterNumber, 
    totalChapters,
    previousChapterSummary = "",
    outline,
    genre,
    tone,
    targetAudience
  } = params;
  
  // Create a prompt for the chapter generation
  const promptText = `
  Write chapter ${chapterNumber} of ${totalChapters} titled "${chapterTitle}" for the ${genre} book "${bookTitle}".
  
  ${previousChapterSummary ? `The previous chapter ended with: ${previousChapterSummary}` : ""}
  
  Overall book outline: ${outline}
  
  The book has a ${tone} tone and is written for a ${targetAudience} audience.
  
  Write a complete, polished chapter that moves the story forward according to the outline.
  The chapter should be engaging, well-structured, and maintain consistent characterization.
  
  If this is the first chapter, establish the setting, introduce key characters, and hook the reader.
  If this is the final chapter, provide a satisfying conclusion to the story's main conflicts.
  
  Write approximately 2000-3000 words for this chapter.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a professional author who writes engaging, well-structured chapters." },
        { role: "user", content: promptText }
      ],
      max_tokens: 4000
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error(`Error generating chapter ${chapterNumber}:`, error);
    throw new Error(`Failed to generate chapter ${chapterNumber}. Please try again later.`);
  }
}

/**
 * Generate the complete book based on outline and parameters
 */
export async function generateBook(params: BookGenerationParams): Promise<BookGenerationResponse> {
  try {
    // First, generate or use provided outline
    const outlineData = await generateBookOutline(params);
    
    // Generate a cover prompt based on the book details
    const coverPromptResponse = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "system", 
          content: "You create concise, detailed prompts for AI image generators to create stunning book covers." 
        },
        { 
          role: "user", 
          content: `
          Create a prompt for a book cover design for the ${params.genre || ""} book "${outlineData.title}".
          The book is about: ${params.description || ""}
          The book should appeal to a ${params.targetAudience || "general"} audience.
          The prompt should be detailed but concise, including visual elements, style, and mood.
          The cover should look professional and commercially viable.
          Don't include text in the image itself.
          `
        }
      ]
    });
    
    const coverPrompt = coverPromptResponse.choices[0].message.content || "";
    
    // Generate each chapter in sequence
    const chapters = [];
    let previousChapterSummary = "";
    
    for (let i = 0; i < outlineData.chapters.length; i++) {
      const chapter = outlineData.chapters[i];
      const chapterContent = await generateChapter({
        bookTitle: outlineData.title,
        chapterTitle: chapter.title,
        chapterNumber: i + 1,
        totalChapters: outlineData.chapters.length,
        previousChapterSummary: previousChapterSummary,
        outline: JSON.stringify(outlineData),
        genre: params.genre || "fiction",
        tone: params.tone || "balanced",
        targetAudience: params.targetAudience || "general"
      });
      
      chapters.push({
        title: chapter.title,
        content: chapterContent
      });
      
      // Update the previous chapter summary for context in the next chapter
      previousChapterSummary = chapter.summary;
    }
    
    return {
      title: outlineData.title,
      outline: {
        chapters: chapters
      },
      coverPrompt
    };
  } catch (error) {
    console.error("Error generating book:", error);
    throw new Error("Failed to generate book. Please try again later.");
  }
}

/**
 * Convert the generated book to a PDF file
 */
export async function generateBookPDF(book: BookGenerationResponse, outputPath: string): Promise<string> {
  try {
    // Create a text version of the book that can be converted to PDF
    let bookText = `# ${book.title}\n\n`;
    
    // Add each chapter
    for (const chapter of book.outline.chapters) {
      bookText += `## ${chapter.title}\n\n${chapter.content}\n\n`;
    }
    
    // Write the text file
    const textFilePath = outputPath.replace('.pdf', '.txt');
    fs.writeFileSync(textFilePath, bookText);
    
    // In a real implementation, you'd use a library like pdfkit to convert to PDF
    // For now, we'll just use the text file
    return textFilePath;
  } catch (error) {
    console.error("Error generating book PDF:", error);
    throw new Error("Failed to generate book PDF. Please try again later.");
  }
}
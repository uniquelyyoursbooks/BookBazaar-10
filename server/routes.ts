import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertBookSchema, insertReviewSchema, insertReadingProgressSchema, 
  insertBookmarkSchema, insertAnnotationSchema,
  ReadingProgress 
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ZodError } from "zod";
import { FileFilterCallback } from "multer";
import { 
  generateWritingMoodBoard, 
  type MoodBoardResponse,
  generateBookRecommendations,
  type BookRecommendation,
  type BookRecommendationParams,
  generateBookCover,
  generateBookCoverVariation,
  type BookCoverParams,
  type BookCoverResponse
} from "./openai";
import { prepareBookForKdp } from "./utils/kdp-export";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.body.authorId;
    const userDir = path.join(uploadDir, userId ? userId.toString() : "temp");
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only PDF, EPUB files
    const allowedExtensions = ['.pdf', '.epub'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and EPUB files are allowed'));
    }
  }
});

// Configure multer for cover image uploads
const coverUpload = multer({
  storage: storage_config,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB file size limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only image files
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG and GIF files are allowed'));
    }
  }
});

// Override multer's file filter for the combined upload
const multipleFileFilter = function(
  req: Request, 
  file: Express.Multer.File, 
  cb: FileFilterCallback
) {
  if (file.fieldname === 'bookFile') {
    // Handle book files
    const allowedExtensions = ['.pdf', '.epub'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and EPUB files are allowed for books'));
    }
  } else if (file.fieldname === 'coverImage') {
    // Handle cover images
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG and GIF files are allowed for covers'));
    }
  } else {
    cb(new Error('Unexpected field'));
  }
};

// Middleware to validate request with Zod schema
function validateRequest<T>(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req.body);
      req.body = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      } else {
        next(error);
      }
    }
  };
}

// Authentication middleware
function validateAuth(req: Request, res: Response, next: NextFunction) {
  // For now, we'll implement a simple auth check
  // In a real application, you would verify JWT or session
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Add user to request for convenience
  // Using type assertion since we know this will be defined
  (req as any).user = { id: parseInt(userId as string) };
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Public API routes
  
  // Get all books
  app.get('/api/books', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const books = await storage.getBooks(limit, offset);
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching books' });
    }
  });

  // Get book by ID
  app.get('/api/books/:id', async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      res.json(book);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching book' });
    }
  });

  // Search books
  app.get('/api/books/search/:query', async (req, res) => {
    try {
      const query = req.params.query;
      const books = await storage.searchBooks(query);
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: 'Error searching books' });
    }
  });

  // Get books by category
  app.get('/api/books/category/:category', async (req, res) => {
    try {
      const category = req.params.category;
      const books = await storage.getBooksByCategory(category);
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching books by category' });
    }
  });

  // Get books by author
  app.get('/api/books/author/:authorId', async (req, res) => {
    try {
      const authorId = parseInt(req.params.authorId);
      const books = await storage.getBooksByAuthor(authorId);
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching books by author' });
    }
  });

  // Get reviews for a book
  app.get('/api/books/:id/reviews', async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByBook(bookId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching reviews' });
    }
  });

  // User authentication
  
  // Register user
  app.post('/api/auth/register', validateRequest(insertUserSchema), async (req, res) => {
    try {
      const { username, email } = req.body;
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      const user = await storage.createUser(req.body);
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Error creating user' });
    }
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Error during login' });
    }
  });

  // Book management
  
  // Create book with file upload
  // Use fields to handle multiple file types
  const uploadFields = multer({
    storage: storage_config,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: multipleFileFilter
  }).fields([
    { name: 'bookFile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]);
  
  app.post('/api/books', uploadFields, async (req, res) => {
    try {
      // Check if there's a book file
      if (!req.files || !('bookFile' in req.files) || !req.files.bookFile[0]) {
        return res.status(400).json({ message: 'Book file is required' });
      }
      
      const bookFile = req.files.bookFile[0];
      
      // Get cover image if available
      let coverImagePath;
      if ('coverImage' in req.files && req.files.coverImage[0]) {
        coverImagePath = req.files.coverImage[0].path;
      }
      
      const bookData = {
        ...req.body,
        authorId: parseInt(req.body.authorId),
        filePath: bookFile.path,
        coverImage: coverImagePath,
        published: req.body.published === 'true'
      };
      
      // Validate book data
      try {
        insertBookSchema.parse(bookData);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: error.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message
            }))
          });
        }
        throw error;
      }
      
      const book = await storage.createBook(bookData);
      res.status(201).json(book);
    } catch (error) {
      console.error('Error creating book:', error);
      res.status(500).json({ message: 'Error creating book' });
    }
  });

  // Upload book cover
  app.post('/api/books/:id/cover', coverUpload.single('coverImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Cover image is required' });
      }
      
      const bookId = parseInt(req.params.id);
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      const updatedBook = await storage.updateBook(bookId, {
        coverImage: req.file.path
      });
      
      res.json(updatedBook);
    } catch (error) {
      res.status(500).json({ message: 'Error uploading cover image' });
    }
  });

  // Update book
  app.put('/api/books/:id', async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Convert authorId and published to correct types
      const bookUpdate = {
        ...req.body,
        authorId: req.body.authorId ? parseInt(req.body.authorId) : undefined,
        published: req.body.published !== undefined ? (req.body.published === true || req.body.published === 'true') : undefined
      };
      
      const updatedBook = await storage.updateBook(bookId, bookUpdate);
      res.json(updatedBook);
    } catch (error) {
      res.status(500).json({ message: 'Error updating book' });
    }
  });

  // Delete book
  app.delete('/api/books/:id', async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Delete the book file if it exists
      if (book.filePath && fs.existsSync(book.filePath)) {
        fs.unlinkSync(book.filePath);
      }
      
      // Delete the cover image if it exists
      if (book.coverImage && fs.existsSync(book.coverImage)) {
        fs.unlinkSync(book.coverImage);
      }
      
      await storage.deleteBook(bookId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting book' });
    }
  });

  // Reviews
  
  // Create review
  app.post('/api/reviews', validateRequest(insertReviewSchema), async (req, res) => {
    try {
      const review = await storage.createReview(req.body);
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ message: 'Error creating review' });
    }
  });

  // Get reviews by user
  app.get('/api/users/:id/reviews', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByUser(userId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching reviews' });
    }
  });

  // Reading progress
  
  // Get reading progress
  app.get('/api/users/:userId/books/:bookId/progress', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const bookId = parseInt(req.params.bookId);
      
      const progress = await storage.getReadingProgress(userId, bookId);
      
      if (!progress) {
        return res.status(404).json({ message: 'Reading progress not found' });
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching reading progress' });
    }
  });

  // Update reading progress
  app.post('/api/reading-progress', validateRequest(insertReadingProgressSchema), async (req, res) => {
    try {
      const progress = await storage.createOrUpdateReadingProgress(req.body);
      res.status(201).json(progress);
    } catch (error) {
      res.status(500).json({ message: 'Error updating reading progress' });
    }
  });

  // Serve uploaded files
  app.get('/uploads/:userId/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.userId, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    res.sendFile(filePath);
  });
  
  // Writing Mood Board Generator
  app.post('/api/mood-board/generate', async (req, res) => {
    try {
      const { genre, theme, setting, additionalContext } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY is missing or not configured properly');
      }
      
      // Set NODE_ENV to development for demo/testing purposes
      // This enables fallback mode in the mood board generator
      process.env.NODE_ENV = 'development';
      
      const moodBoard = await generateWritingMoodBoard({
        genre,
        theme,
        setting,
        additionalContext
      });
      
      res.json(moodBoard);
    } catch (error) {
      console.error('Error generating mood board:', error);
      res.status(500).json({ 
        message: 'Error generating mood board', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Book Recommendation Engine
  app.post('/api/recommendations', async (req, res) => {
    try {
      const { userId, genre, recentlyRead, interests, limit } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY is missing or not configured properly');
      }
      
      // Set NODE_ENV to development for demo/testing purposes
      // This enables fallback mode in the recommendation generator
      process.env.NODE_ENV = 'development';
      
      // Fetch user's reading history if userId is provided but no recentlyRead list
      let userRecentlyRead = recentlyRead || [];
      if (userId && !userRecentlyRead.length) {
        try {
          // Get books the user has read or started reading
          const userProgress = await storage.getReadingProgressByUser(parseInt(userId));
          const bookIds: number[] = userProgress.map((progress: ReadingProgress) => progress.bookId);
          
          // Get book details for the IDs
          const userBooks = await Promise.all(
            bookIds.map(async (id: number) => {
              const book = await storage.getBook(id);
              return book ? book.title : null;
            })
          );
          
          // Filter out null values and add to recently read list
          userRecentlyRead = userBooks.filter(Boolean) as string[];
        } catch (error) {
          console.error('Error fetching user reading history:', error);
          // Continue with empty recently read list
        }
      }
      
      const recommendations = await generateBookRecommendations({
        userId: userId ? parseInt(userId) : undefined,
        genre,
        recentlyRead: userRecentlyRead,
        interests,
        limit: limit ? parseInt(limit) : 5
      });
      
      res.json(recommendations);
    } catch (error) {
      console.error('Error generating book recommendations:', error);
      res.status(500).json({ 
        message: 'Error generating book recommendations', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Book Cover Design AI Assistant
  app.post('/api/book-covers/generate', async (req, res) => {
    try {
      const coverParams: BookCoverParams = req.body;
      
      if (!coverParams.title) {
        return res.status(400).json({ message: 'Book title is required' });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY is missing or not configured properly');
        return res.status(500).json({ message: 'API key configuration error' });
      }
      
      // Generate the book cover using AI
      const coverResponse = await generateBookCover(coverParams);
      
      res.json(coverResponse);
    } catch (error) {
      console.error('Error generating book cover:', error);
      res.status(500).json({ 
        message: 'Error generating book cover', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Generate a book cover variation
  app.post('/api/book-covers/variations', async (req, res) => {
    try {
      const { imageUrl, modificationPrompt } = req.body;
      
      if (!imageUrl || !modificationPrompt) {
        return res.status(400).json({ 
          message: 'Both image URL and modification prompt are required' 
        });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY is missing or not configured properly');
        return res.status(500).json({ message: 'API key configuration error' });
      }
      
      // Generate the book cover variation
      const coverVariation = await generateBookCoverVariation(imageUrl, modificationPrompt);
      
      res.json(coverVariation);
    } catch (error) {
      console.error('Error generating book cover variation:', error);
      res.status(500).json({ 
        message: 'Error generating book cover variation', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // KDP Export Functionality
  app.post('/api/books/:id/kdp-export', async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Extract export options from request
      const { exportType = 'ebook' } = req.body;
      
      if (!['ebook', 'print'].includes(exportType)) {
        return res.status(400).json({ message: 'Invalid export type. Must be either "ebook" or "print"' });
      }
      
      // Check if files exist
      if (!book.filePath || !fs.existsSync(book.filePath)) {
        return res.status(400).json({ message: 'Book file not found' });
      }
      
      if (!book.coverImage || !fs.existsSync(book.coverImage)) {
        return res.status(400).json({ message: 'Cover image not found' });
      }
      
      // Prepare book for KDP export
      const result = await prepareBookForKdp({
        bookId,
        title: book.title,
        coverPath: book.coverImage,
        manuscriptPath: book.filePath,
        exportType
      });
      
      res.json({
        message: 'Book prepared for KDP export successfully',
        exportUrl: `/uploads/${result.zipPath.split('/exports/')[1]}`,
        fileName: path.basename(result.zipPath)
      });
    } catch (error) {
      console.error('Error during KDP export:', error);
      res.status(500).json({ 
        message: 'Error preparing book for KDP export', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Bookmark routes
  app.get('/api/bookmarks', validateAuth, async (req, res) => {
    try {
      // After validateAuth, we can assert req.user exists
      const userId = req.user!.id;
      const bookmarks = await storage.getBookmarksByUser(userId);
      res.json(bookmarks);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      res.status(500).json({ 
        message: 'Error fetching bookmarks', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get('/api/books/:bookId/bookmarks', validateAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { bookId } = req.params;
      const bookmarks = await storage.getBookmarksByUserAndBook(userId, parseInt(bookId));
      res.json(bookmarks);
    } catch (error) {
      console.error('Error fetching bookmarks for book:', error);
      res.status(500).json({ 
        message: 'Error fetching bookmarks for book', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.post('/api/bookmarks', validateAuth, validateRequest(insertBookmarkSchema), async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const bookmarkData = { ...req.body, userId };
      const bookmark = await storage.createBookmark(bookmarkData);
      res.status(201).json(bookmark);
    } catch (error) {
      console.error('Error creating bookmark:', error);
      res.status(500).json({ 
        message: 'Error creating bookmark', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.put('/api/bookmarks/:id', validateAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const bookmark = await storage.getBookmark(parseInt(id));
      
      if (!bookmark) {
        return res.status(404).json({ message: 'Bookmark not found' });
      }
      
      if (bookmark.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to bookmark' });
      }
      
      const updatedBookmark = await storage.updateBookmark(parseInt(id), req.body);
      res.json(updatedBookmark);
    } catch (error) {
      console.error('Error updating bookmark:', error);
      res.status(500).json({ 
        message: 'Error updating bookmark', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.delete('/api/bookmarks/:id', validateAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const bookmark = await storage.getBookmark(parseInt(id));
      
      if (!bookmark) {
        return res.status(404).json({ message: 'Bookmark not found' });
      }
      
      if (bookmark.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to bookmark' });
      }
      
      await storage.deleteBookmark(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      res.status(500).json({ 
        message: 'Error deleting bookmark', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Annotation routes
  app.get('/api/annotations', validateAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const annotations = await storage.getAnnotationsByUser(userId);
      res.json(annotations);
    } catch (error) {
      console.error('Error fetching annotations:', error);
      res.status(500).json({ 
        message: 'Error fetching annotations', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get('/api/books/:bookId/annotations', validateAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { bookId } = req.params;
      const { page } = req.query;
      
      let annotations;
      if (page) {
        annotations = await storage.getAnnotationsByPage(userId, parseInt(bookId), parseInt(page as string));
      } else {
        annotations = await storage.getAnnotationsByUserAndBook(userId, parseInt(bookId));
      }
      
      res.json(annotations);
    } catch (error) {
      console.error('Error fetching annotations for book:', error);
      res.status(500).json({ 
        message: 'Error fetching annotations for book', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.post('/api/annotations', validateAuth, validateRequest(insertAnnotationSchema), async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const annotationData = { ...req.body, userId };
      const annotation = await storage.createAnnotation(annotationData);
      res.status(201).json(annotation);
    } catch (error) {
      console.error('Error creating annotation:', error);
      res.status(500).json({ 
        message: 'Error creating annotation', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.put('/api/annotations/:id', validateAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const annotation = await storage.getAnnotation(parseInt(id));
      
      if (!annotation) {
        return res.status(404).json({ message: 'Annotation not found' });
      }
      
      if (annotation.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to annotation' });
      }
      
      const updatedAnnotation = await storage.updateAnnotation(parseInt(id), req.body);
      res.json(updatedAnnotation);
    } catch (error) {
      console.error('Error updating annotation:', error);
      res.status(500).json({ 
        message: 'Error updating annotation', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.delete('/api/annotations/:id', validateAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const annotation = await storage.getAnnotation(parseInt(id));
      
      if (!annotation) {
        return res.status(404).json({ message: 'Annotation not found' });
      }
      
      if (annotation.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to annotation' });
      }
      
      await storage.deleteAnnotation(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting annotation:', error);
      res.status(500).json({ 
        message: 'Error deleting annotation', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

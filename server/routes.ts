import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertBookSchema, 
  insertReviewSchema, 
  insertBookProgressSchema,
  bookCategories
} from "@shared/schema";
import { z } from "zod";

// File upload configuration
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      let uploadPath = '';
      
      if (file.fieldname === 'coverImage') {
        uploadPath = path.join(process.cwd(), 'dist/public/uploads/covers');
      } else if (file.fieldname === 'content') {
        uploadPath = path.join(process.cwd(), 'dist/public/uploads/books');
      } else if (file.fieldname === 'profileImage' || file.fieldname === 'bannerImage') {
        uploadPath = path.join(process.cwd(), 'dist/public/uploads/profiles');
      }
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'content') {
      // Allow PDF, EPUB, and text files for book content
      if (file.mimetype === 'application/pdf' || 
          file.mimetype === 'application/epub+zip' || 
          file.mimetype === 'text/plain') {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, EPUB, and text files are allowed.'));
      }
    } else if (file.fieldname === 'coverImage' || file.fieldname === 'profileImage' || file.fieldname === 'bannerImage') {
      // Allow images for covers and profiles
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only image files are allowed.'));
      }
    } else {
      cb(null, false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      const user = await storage.createUser(userData);
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to register user' });
      }
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Don't return password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to login' });
    }
  });
  
  // User routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user' });
    }
  });
  
  app.patch('/api/users/:id', upload.fields([
    { name: 'profileImage', maxCount: 1 }, 
    { name: 'bannerImage', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const userData: any = { ...req.body };
      
      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (files.profileImage && files.profileImage[0]) {
        userData.profileImage = `/uploads/profiles/${files.profileImage[0].filename}`;
      }
      
      if (files.bannerImage && files.bannerImage[0]) {
        userData.bannerImage = `/uploads/profiles/${files.bannerImage[0].filename}`;
      }
      
      // Remove password if it's not being updated
      if (!userData.password) {
        delete userData.password;
      }
      
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to update user' });
      }
    }
  });
  
  // Book routes
  app.get('/api/books', async (req, res) => {
    try {
      const { category, author, search } = req.query;
      
      if (category) {
        const books = await storage.getBooksByCategory(category as string);
        return res.status(200).json(books);
      }
      
      if (author) {
        const authorId = parseInt(author as string);
        
        if (isNaN(authorId)) {
          return res.status(400).json({ message: 'Invalid author ID' });
        }
        
        const books = await storage.getBooksByAuthor(authorId);
        return res.status(200).json(books);
      }
      
      if (search) {
        const books = await storage.searchBooks(search as string);
        return res.status(200).json(books);
      }
      
      const books = await storage.getAllBooks();
      res.status(200).json(books);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get books' });
    }
  });
  
  app.get('/api/books/:id', async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      
      if (isNaN(bookId)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      res.status(200).json(book);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get book' });
    }
  });
  
  app.post('/api/books', upload.fields([
    { name: 'coverImage', maxCount: 1 }, 
    { name: 'content', maxCount: 1 }
  ]), async (req, res) => {
    try {
      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.content || !files.content[0]) {
        return res.status(400).json({ message: 'Book content file is required' });
      }
      
      const bookData = {
        ...req.body,
        contentPath: `/uploads/books/${files.content[0].filename}`,
        coverImage: files.coverImage && files.coverImage[0] 
          ? `/uploads/covers/${files.coverImage[0].filename}` 
          : undefined,
        authorId: parseInt(req.body.authorId),
        isPublished: req.body.isPublished === 'true',
        tags: req.body.tags ? JSON.parse(req.body.tags) : []
      };
      
      const validatedData = insertBookSchema.parse(bookData);
      const book = await storage.createBook(validatedData);
      
      res.status(201).json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        console.error(error);
        res.status(500).json({ message: 'Failed to create book' });
      }
    }
  });
  
  app.patch('/api/books/:id', upload.fields([
    { name: 'coverImage', maxCount: 1 }, 
    { name: 'content', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      
      if (isNaN(bookId)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const bookData: any = { ...req.body };
      
      if (files.content && files.content[0]) {
        bookData.contentPath = `/uploads/books/${files.content[0].filename}`;
      }
      
      if (files.coverImage && files.coverImage[0]) {
        bookData.coverImage = `/uploads/covers/${files.coverImage[0].filename}`;
      }
      
      if (bookData.authorId) {
        bookData.authorId = parseInt(bookData.authorId);
      }
      
      if (bookData.isPublished !== undefined) {
        bookData.isPublished = bookData.isPublished === 'true';
      }
      
      if (bookData.tags) {
        bookData.tags = JSON.parse(bookData.tags);
      }
      
      const updatedBook = await storage.updateBook(bookId, bookData);
      
      if (!updatedBook) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      res.status(200).json(updatedBook);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to update book' });
      }
    }
  });
  
  app.delete('/api/books/:id', async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      
      if (isNaN(bookId)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const success = await storage.deleteBook(bookId);
      
      if (!success) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete book' });
    }
  });
  
  // Review routes
  app.get('/api/books/:bookId/reviews', async (req, res) => {
    try {
      const bookId = parseInt(req.params.bookId);
      
      if (isNaN(bookId)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const reviews = await storage.getReviewsByBook(bookId);
      
      // Get user info for each review
      const reviewsWithUserInfo = await Promise.all(
        reviews.map(async (review) => {
          const user = await storage.getUser(review.userId);
          return {
            ...review,
            user: user ? {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              profileImage: user.profileImage
            } : undefined
          };
        })
      );
      
      res.status(200).json(reviewsWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get reviews' });
    }
  });
  
  app.post('/api/books/:bookId/reviews', async (req, res) => {
    try {
      const bookId = parseInt(req.params.bookId);
      
      if (isNaN(bookId)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      const reviewData = {
        ...req.body,
        bookId,
        userId: parseInt(req.body.userId),
        rating: parseInt(req.body.rating)
      };
      
      const validatedData = insertReviewSchema.parse(reviewData);
      const review = await storage.createReview(validatedData);
      
      // Get user info
      const user = await storage.getUser(review.userId);
      const reviewWithUserInfo = {
        ...review,
        user: user ? {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          profileImage: user.profileImage
        } : undefined
      };
      
      res.status(201).json(reviewWithUserInfo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create review' });
      }
    }
  });
  
  // Book progress routes
  app.get('/api/books/:bookId/progress/:userId', async (req, res) => {
    try {
      const bookId = parseInt(req.params.bookId);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(bookId) || isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid book ID or user ID' });
      }
      
      const progress = await storage.getBookProgress(bookId, userId);
      
      if (!progress) {
        return res.status(404).json({ message: 'Book progress not found' });
      }
      
      res.status(200).json(progress);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get book progress' });
    }
  });
  
  app.post('/api/books/:bookId/progress', async (req, res) => {
    try {
      const bookId = parseInt(req.params.bookId);
      
      if (isNaN(bookId)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const progressData = {
        ...req.body,
        bookId,
        userId: parseInt(req.body.userId),
        currentPage: parseInt(req.body.currentPage),
        totalPages: parseInt(req.body.totalPages)
      };
      
      const validatedData = insertBookProgressSchema.parse(progressData);
      const progress = await storage.createOrUpdateBookProgress(validatedData);
      
      res.status(201).json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to update book progress' });
      }
    }
  });
  
  // Categories route
  app.get('/api/categories', (req, res) => {
    res.status(200).json(bookCategories);
  });
  
  const httpServer = createServer(app);
  return httpServer;
}

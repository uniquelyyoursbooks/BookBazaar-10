import { 
  users, type User, type InsertUser,
  books, type Book, type InsertBook,
  reviews, type Review, type InsertReview,
  readingProgresses, type ReadingProgress, type InsertReadingProgress
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Book methods
  getBook(id: number): Promise<Book | undefined>;
  getBooks(limit?: number, offset?: number): Promise<Book[]>;
  getBooksByAuthor(authorId: number): Promise<Book[]>;
  getBooksByCategory(category: string): Promise<Book[]>;
  searchBooks(query: string): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<boolean>;
  
  // Review methods
  getReview(id: number): Promise<Review | undefined>;
  getReviewsByBook(bookId: number): Promise<Review[]>;
  getReviewsByUser(userId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, review: Partial<InsertReview>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  
  // Reading progress methods
  getReadingProgress(userId: number, bookId: number): Promise<ReadingProgress | undefined>;
  createOrUpdateReadingProgress(progress: InsertReadingProgress): Promise<ReadingProgress>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private reviews: Map<number, Review>;
  private readingProgresses: Map<string, ReadingProgress>;
  
  private userIdCounter: number;
  private bookIdCounter: number;
  private reviewIdCounter: number;
  private readingProgressIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.reviews = new Map();
    this.readingProgresses = new Map();
    
    this.userIdCounter = 1;
    this.bookIdCounter = 1;
    this.reviewIdCounter = 1;
    this.readingProgressIdCounter = 1;
    
    // Create a default admin user
    this.createUser({
      username: "admin",
      password: "password",
      email: "admin@booknest.com",
      fullName: "Admin User",
      bio: "BookNest administrator",
      isAuthor: true
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username.toLowerCase() === username.toLowerCase());
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  // Book methods
  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }
  
  async getBooks(limit: number = 50, offset: number = 0): Promise<Book[]> {
    return Array.from(this.books.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }
  
  async getBooksByAuthor(authorId: number): Promise<Book[]> {
    return Array.from(this.books.values())
      .filter(book => book.authorId === authorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getBooksByCategory(category: string): Promise<Book[]> {
    return Array.from(this.books.values())
      .filter(book => book.category === category)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async searchBooks(query: string): Promise<Book[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.books.values())
      .filter(book => 
        book.title.toLowerCase().includes(lowerQuery) || 
        book.description.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.bookIdCounter++;
    const now = new Date();
    const book: Book = {
      ...insertBook,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.books.set(id, book);
    return book;
  }
  
  async updateBook(id: number, bookUpdate: Partial<InsertBook>): Promise<Book | undefined> {
    const book = this.books.get(id);
    if (!book) return undefined;
    
    const updatedBook: Book = {
      ...book,
      ...bookUpdate,
      updatedAt: new Date()
    };
    
    this.books.set(id, updatedBook);
    return updatedBook;
  }
  
  async deleteBook(id: number): Promise<boolean> {
    return this.books.delete(id);
  }
  
  // Review methods
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }
  
  async getReviewsByBook(bookId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.bookId === bookId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getReviewsByUser(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const now = new Date();
    const review: Review = {
      ...insertReview,
      id,
      createdAt: now
    };
    this.reviews.set(id, review);
    return review;
  }
  
  async updateReview(id: number, reviewUpdate: Partial<InsertReview>): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (!review) return undefined;
    
    const updatedReview: Review = {
      ...review,
      ...reviewUpdate
    };
    
    this.reviews.set(id, updatedReview);
    return updatedReview;
  }
  
  async deleteReview(id: number): Promise<boolean> {
    return this.reviews.delete(id);
  }
  
  // Reading progress methods
  async getReadingProgress(userId: number, bookId: number): Promise<ReadingProgress | undefined> {
    const key = `${userId}-${bookId}`;
    return this.readingProgresses.get(key);
  }
  
  async createOrUpdateReadingProgress(insertProgress: InsertReadingProgress): Promise<ReadingProgress> {
    const key = `${insertProgress.userId}-${insertProgress.bookId}`;
    const existing = this.readingProgresses.get(key);
    
    if (existing) {
      const updatedProgress: ReadingProgress = {
        ...existing,
        currentPage: insertProgress.currentPage,
        lastRead: new Date()
      };
      this.readingProgresses.set(key, updatedProgress);
      return updatedProgress;
    } else {
      const id = this.readingProgressIdCounter++;
      const now = new Date();
      const progress: ReadingProgress = {
        ...insertProgress,
        id,
        lastRead: now
      };
      this.readingProgresses.set(key, progress);
      return progress;
    }
  }
}

export const storage = new MemStorage();

import { 
  users, type User, type InsertUser,
  books, type Book, type InsertBook,
  reviews, type Review, type InsertReview,
  bookProgress, type BookProgress, type InsertBookProgress
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Books
  getBook(id: number): Promise<Book | undefined>;
  getBooksByAuthor(authorId: number): Promise<Book[]>;
  getAllBooks(): Promise<Book[]>;
  getBooksByCategory(category: string): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<boolean>;
  searchBooks(query: string): Promise<Book[]>;
  
  // Reviews
  getReview(id: number): Promise<Review | undefined>;
  getReviewsByBook(bookId: number): Promise<Review[]>;
  getReviewsByUser(userId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, review: Partial<InsertReview>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  
  // Book Progress
  getBookProgress(bookId: number, userId: number): Promise<BookProgress | undefined>;
  createOrUpdateBookProgress(progress: InsertBookProgress): Promise<BookProgress>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private reviews: Map<number, Review>;
  private bookProgress: Map<string, BookProgress>;
  
  private userIdCounter: number;
  private bookIdCounter: number;
  private reviewIdCounter: number;
  private bookProgressIdCounter: number;

  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.reviews = new Map();
    this.bookProgress = new Map();
    
    this.userIdCounter = 1;
    this.bookIdCounter = 1;
    this.reviewIdCounter = 1;
    this.bookProgressIdCounter = 1;
    
    // Initialize with sample data for development
    this.seedSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Book methods
  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }
  
  async getBooksByAuthor(authorId: number): Promise<Book[]> {
    return Array.from(this.books.values()).filter(
      (book) => book.authorId === authorId,
    );
  }
  
  async getAllBooks(): Promise<Book[]> {
    return Array.from(this.books.values()).filter(book => book.isPublished);
  }
  
  async getBooksByCategory(category: string): Promise<Book[]> {
    return Array.from(this.books.values()).filter(
      (book) => book.category === category && book.isPublished,
    );
  }
  
  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.bookIdCounter++;
    const createdAt = new Date();
    const publishedAt = new Date();
    const book: Book = { ...insertBook, id, createdAt, publishedAt };
    this.books.set(id, book);
    return book;
  }
  
  async updateBook(id: number, bookData: Partial<InsertBook>): Promise<Book | undefined> {
    const book = await this.getBook(id);
    if (!book) return undefined;
    
    const updatedBook = { ...book, ...bookData };
    this.books.set(id, updatedBook);
    return updatedBook;
  }
  
  async deleteBook(id: number): Promise<boolean> {
    return this.books.delete(id);
  }
  
  async searchBooks(query: string): Promise<Book[]> {
    const normalizedQuery = query.toLowerCase();
    return Array.from(this.books.values()).filter(book => {
      return (
        book.isPublished && (
          book.title.toLowerCase().includes(normalizedQuery) ||
          book.description.toLowerCase().includes(normalizedQuery) ||
          book.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))
        )
      );
    });
  }

  // Review methods
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }
  
  async getReviewsByBook(bookId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.bookId === bookId,
    );
  }
  
  async getReviewsByUser(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.userId === userId,
    );
  }
  
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const createdAt = new Date();
    const review: Review = { ...insertReview, id, createdAt };
    this.reviews.set(id, review);
    return review;
  }
  
  async updateReview(id: number, reviewData: Partial<InsertReview>): Promise<Review | undefined> {
    const review = await this.getReview(id);
    if (!review) return undefined;
    
    const updatedReview = { ...review, ...reviewData };
    this.reviews.set(id, updatedReview);
    return updatedReview;
  }
  
  async deleteReview(id: number): Promise<boolean> {
    return this.reviews.delete(id);
  }

  // Book Progress methods
  async getBookProgress(bookId: number, userId: number): Promise<BookProgress | undefined> {
    const key = `${bookId}-${userId}`;
    return this.bookProgress.get(key);
  }
  
  async createOrUpdateBookProgress(insertProgress: InsertBookProgress): Promise<BookProgress> {
    const key = `${insertProgress.bookId}-${insertProgress.userId}`;
    const existingProgress = this.bookProgress.get(key);
    
    if (existingProgress) {
      const updatedProgress: BookProgress = {
        ...existingProgress,
        currentPage: insertProgress.currentPage,
        totalPages: insertProgress.totalPages,
        lastReadAt: new Date(),
      };
      this.bookProgress.set(key, updatedProgress);
      return updatedProgress;
    } else {
      const id = this.bookProgressIdCounter++;
      const progress: BookProgress = {
        ...insertProgress,
        id,
        lastReadAt: new Date(),
      };
      this.bookProgress.set(key, progress);
      return progress;
    }
  }

  // Helper method to seed sample data
  private seedSampleData() {
    // We'll add some sample data when users sign up
  }
}

export const storage = new MemStorage();

import { 
  users, type User, type InsertUser,
  books, type Book, type InsertBook,
  reviews, type Review, type InsertReview,
  readingProgresses, type ReadingProgress, type InsertReadingProgress,
  bookmarks, type Bookmark, type InsertBookmark,
  annotations, type Annotation, type InsertAnnotation
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
  getReadingProgressByUser(userId: number): Promise<ReadingProgress[]>;
  createOrUpdateReadingProgress(progress: InsertReadingProgress): Promise<ReadingProgress>;
  
  // Bookmark methods
  getBookmark(id: number): Promise<Bookmark | undefined>;
  getBookmarksByUser(userId: number): Promise<Bookmark[]>;
  getBookmarksByBook(bookId: number): Promise<Bookmark[]>;
  getBookmarksByUserAndBook(userId: number, bookId: number): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  updateBookmark(id: number, bookmark: Partial<InsertBookmark>): Promise<Bookmark | undefined>;
  deleteBookmark(id: number): Promise<boolean>;
  
  // Annotation methods
  getAnnotation(id: number): Promise<Annotation | undefined>;
  getAnnotationsByUser(userId: number): Promise<Annotation[]>;
  getAnnotationsByBook(bookId: number): Promise<Annotation[]>;
  getAnnotationsByUserAndBook(userId: number, bookId: number): Promise<Annotation[]>;
  getAnnotationsByPage(userId: number, bookId: number, pageNumber: number): Promise<Annotation[]>;
  createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;
  updateAnnotation(id: number, annotation: Partial<InsertAnnotation>): Promise<Annotation | undefined>;
  deleteAnnotation(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private reviews: Map<number, Review>;
  private readingProgresses: Map<string, ReadingProgress>;
  private bookmarks: Map<number, Bookmark>;
  private annotations: Map<number, Annotation>;
  
  private userIdCounter: number;
  private bookIdCounter: number;
  private reviewIdCounter: number;
  private readingProgressIdCounter: number;
  private bookmarkIdCounter: number;
  private annotationIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.reviews = new Map();
    this.readingProgresses = new Map();
    this.bookmarks = new Map();
    this.annotations = new Map();
    
    this.userIdCounter = 1;
    this.bookIdCounter = 1;
    this.reviewIdCounter = 1;
    this.readingProgressIdCounter = 1;
    this.bookmarkIdCounter = 1;
    this.annotationIdCounter = 1;
    
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
      createdAt: now,
      bio: insertUser.bio ?? null,
      isAuthor: insertUser.isAuthor ?? false
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
      updatedAt: now,
      coverImage: insertBook.coverImage ?? null,
      price: insertBook.price ?? "",
      category: insertBook.category ?? "other",
      published: insertBook.published ?? false
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
      createdAt: now,
      comment: insertReview.comment ?? null
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
  
  async getReadingProgressByUser(userId: number): Promise<ReadingProgress[]> {
    return Array.from(this.readingProgresses.values())
      .filter(progress => progress.userId === userId)
      .sort((a, b) => new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime());
  }
  
  async createOrUpdateReadingProgress(insertProgress: InsertReadingProgress): Promise<ReadingProgress> {
    const key = `${insertProgress.userId}-${insertProgress.bookId}`;
    const existing = this.readingProgresses.get(key);
    
    if (existing) {
      // Ensure we have all the required fields with proper types
      const updatedProgress: ReadingProgress = {
        id: existing.id,
        userId: existing.userId,
        bookId: existing.bookId,
        currentPage: insertProgress.currentPage ?? existing.currentPage,
        totalPages: insertProgress.totalPages ?? existing.totalPages,
        completionPercentage: insertProgress.completionPercentage !== undefined ? insertProgress.completionPercentage : existing.completionPercentage,
        lastRead: new Date()
      };
      this.readingProgresses.set(key, updatedProgress);
      return updatedProgress;
    } else {
      const id = this.readingProgressIdCounter++;
      const now = new Date();
      // Ensure we have all the required fields with proper types
      const progress: ReadingProgress = {
        id,
        userId: insertProgress.userId,
        bookId: insertProgress.bookId,
        currentPage: insertProgress.currentPage ?? 1,
        totalPages: insertProgress.totalPages,
        completionPercentage: insertProgress.completionPercentage !== undefined ? insertProgress.completionPercentage : 0,
        lastRead: now
      };
      this.readingProgresses.set(key, progress);
      return progress;
    }
  }
  
  // Bookmark methods
  async getBookmark(id: number): Promise<Bookmark | undefined> {
    return this.bookmarks.get(id);
  }
  
  async getBookmarksByUser(userId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getBookmarksByBook(bookId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.bookId === bookId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getBookmarksByUserAndBook(userId: number, bookId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId && bookmark.bookId === bookId)
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }
  
  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = this.bookmarkIdCounter++;
    const now = new Date();
    const bookmark: Bookmark = {
      ...insertBookmark,
      id,
      createdAt: now,
      updatedAt: now,
      title: insertBookmark.title ?? null,
      description: insertBookmark.description ?? null,
      color: insertBookmark.color ?? "#3498db" // Default blue color
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }
  
  async updateBookmark(id: number, bookmarkUpdate: Partial<InsertBookmark>): Promise<Bookmark | undefined> {
    const bookmark = this.bookmarks.get(id);
    if (!bookmark) return undefined;
    
    const updatedBookmark: Bookmark = {
      ...bookmark,
      ...bookmarkUpdate,
      updatedAt: new Date()
    };
    
    this.bookmarks.set(id, updatedBookmark);
    return updatedBookmark;
  }
  
  async deleteBookmark(id: number): Promise<boolean> {
    return this.bookmarks.delete(id);
  }
  
  // Annotation methods
  async getAnnotation(id: number): Promise<Annotation | undefined> {
    return this.annotations.get(id);
  }
  
  async getAnnotationsByUser(userId: number): Promise<Annotation[]> {
    return Array.from(this.annotations.values())
      .filter(annotation => annotation.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getAnnotationsByBook(bookId: number): Promise<Annotation[]> {
    return Array.from(this.annotations.values())
      .filter(annotation => annotation.bookId === bookId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getAnnotationsByUserAndBook(userId: number, bookId: number): Promise<Annotation[]> {
    return Array.from(this.annotations.values())
      .filter(annotation => annotation.userId === userId && annotation.bookId === bookId)
      .sort((a, b) => {
        // First sort by page number
        if (a.pageNumber !== b.pageNumber) {
          return a.pageNumber - b.pageNumber;
        }
        
        // Then by startOffset, handling null values
        const aOffset = a.startOffset ?? 0;
        const bOffset = b.startOffset ?? 0;
        return aOffset - bOffset;
      });
  }
  
  async getAnnotationsByPage(userId: number, bookId: number, pageNumber: number): Promise<Annotation[]> {
    return Array.from(this.annotations.values())
      .filter(annotation => 
        annotation.userId === userId && 
        annotation.bookId === bookId && 
        annotation.pageNumber === pageNumber
      )
      .sort((a, b) => {
        // Sort by startOffset, handling null values
        const aOffset = a.startOffset ?? 0;
        const bOffset = b.startOffset ?? 0;
        return aOffset - bOffset;
      });
  }
  
  async createAnnotation(insertAnnotation: InsertAnnotation): Promise<Annotation> {
    const id = this.annotationIdCounter++;
    const now = new Date();
    const annotation: Annotation = {
      ...insertAnnotation,
      id,
      createdAt: now,
      updatedAt: now,
      color: insertAnnotation.color ?? "#ffeb3b", // Default yellow highlight color
      textSelection: insertAnnotation.textSelection ?? null,
      startOffset: insertAnnotation.startOffset ?? null,
      endOffset: insertAnnotation.endOffset ?? null
    };
    this.annotations.set(id, annotation);
    return annotation;
  }
  
  async updateAnnotation(id: number, annotationUpdate: Partial<InsertAnnotation>): Promise<Annotation | undefined> {
    const annotation = this.annotations.get(id);
    if (!annotation) return undefined;
    
    const updatedAnnotation: Annotation = {
      ...annotation,
      ...annotationUpdate,
      updatedAt: new Date()
    };
    
    this.annotations.set(id, updatedAnnotation);
    return updatedAnnotation;
  }
  
  async deleteAnnotation(id: number): Promise<boolean> {
    return this.annotations.delete(id);
  }
}

export const storage = new MemStorage();

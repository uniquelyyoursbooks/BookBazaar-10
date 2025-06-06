import { 
  users, type User, type InsertUser,
  books, type Book, type InsertBook,
  reviews, type Review, type InsertReview,
  readingProgresses, type ReadingProgress, type InsertReadingProgress,
  bookmarks, type Bookmark, type InsertBookmark,
  annotations, type Annotation, type InsertAnnotation,
  collaborators, type Collaborator, type InsertCollaborator,
  documentChanges, type DocumentChange, type InsertDocumentChange
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
  getAIGeneratedBooks(authorId: number): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;
  createAIGeneratedBook(book: InsertBook): Promise<Book>;
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
  
  // Collaborator methods
  getCollaborator(id: number): Promise<Collaborator | undefined>;
  getCollaboratorsByBook(bookId: number): Promise<Collaborator[]>;
  getCollaboratorsByUser(userId: number): Promise<Collaborator[]>;
  getCollaborationsByUserAndStatus(userId: number, status: string): Promise<Collaborator[]>;
  checkCollaborationPermission(userId: number, bookId: number): Promise<Collaborator | undefined>;
  inviteCollaborator(collaborator: InsertCollaborator): Promise<Collaborator>;
  updateCollaboratorStatus(id: number, status: string, acceptedAt?: Date): Promise<Collaborator | undefined>;
  updateCollaboratorRole(id: number, role: string): Promise<Collaborator | undefined>;
  removeCollaborator(id: number): Promise<boolean>;
  
  // Document change methods
  getDocumentChanges(bookId: number, limit?: number, offset?: number): Promise<DocumentChange[]>;
  getDocumentChangesByChapter(bookId: number, chapterId: number): Promise<DocumentChange[]>;
  createDocumentChange(change: InsertDocumentChange): Promise<DocumentChange>;
  getLatestDocumentChanges(bookId: number, userId?: number): Promise<DocumentChange[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private reviews: Map<number, Review>;
  private readingProgresses: Map<string, ReadingProgress>;
  private bookmarks: Map<number, Bookmark>;
  private annotations: Map<number, Annotation>;
  private collaborators: Map<number, Collaborator>;
  private documentChanges: Map<number, DocumentChange>;
  
  private userIdCounter: number;
  private bookIdCounter: number;
  private reviewIdCounter: number;
  private readingProgressIdCounter: number;
  private bookmarkIdCounter: number;
  private annotationIdCounter: number;
  private collaboratorIdCounter: number;
  private documentChangeIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.reviews = new Map();
    this.readingProgresses = new Map();
    this.bookmarks = new Map();
    this.annotations = new Map();
    this.collaborators = new Map();
    this.documentChanges = new Map();
    
    this.userIdCounter = 1;
    this.bookIdCounter = 1;
    this.reviewIdCounter = 1;
    this.readingProgressIdCounter = 1;
    this.bookmarkIdCounter = 1;
    this.annotationIdCounter = 1;
    this.collaboratorIdCounter = 1;
    this.documentChangeIdCounter = 1;
    
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
    
    // Ensure correct typing for the outline
    const typedOutline: { chapters: { title: string, content: string }[] } | null = 
      insertBook.outline ? {
        chapters: Array.isArray((insertBook.outline as any).chapters) 
          ? (insertBook.outline as any).chapters.map((chapter: any) => ({
              title: typeof chapter.title === 'string' ? chapter.title : '',
              content: typeof chapter.content === 'string' ? chapter.content : ''
            })) 
          : []
      } : null;
    
    // Ensure correct typing for the metadata
    const typedMetadata: {
      targetAudience?: string,
      readingLevel?: string,
      themes?: string[],
      mood?: string,
      settings?: string[],
      contentWarnings?: string[]
    } | null = insertBook.metadata ? {
      targetAudience: typeof insertBook.metadata.targetAudience === 'string' ? insertBook.metadata.targetAudience : '',
      readingLevel: typeof insertBook.metadata.readingLevel === 'string' ? insertBook.metadata.readingLevel : '',
      themes: Array.isArray(insertBook.metadata.themes) ? insertBook.metadata.themes : [],
      mood: typeof insertBook.metadata.mood === 'string' ? insertBook.metadata.mood : '',
      settings: Array.isArray(insertBook.metadata.settings) ? insertBook.metadata.settings : [],
      contentWarnings: Array.isArray(insertBook.metadata.contentWarnings) ? insertBook.metadata.contentWarnings : []
    } : null;
    
    // Create a properly typed Book with all required fields
    const book: Book = {
      id,
      title: insertBook.title,
      authorId: insertBook.authorId,
      description: insertBook.description,
      filePath: insertBook.filePath,
      coverImage: insertBook.coverImage ?? null,
      price: insertBook.price ?? "0.00",
      category: insertBook.category ?? "other",
      published: insertBook.published ?? false,
      isAiGenerated: insertBook.isAiGenerated ?? false,
      isPublished: false,
      isAIGenerated: false,
      aiGenerationPrompt: insertBook.aiGenerationPrompt ?? null,
      pdfPath: null,
      epubPath: null,
      outline: typedOutline,
      keywords: Array.isArray(insertBook.keywords) ? insertBook.keywords : [],
      metadata: typedMetadata,
      createdAt: now,
      updatedAt: now
    };
    this.books.set(id, book);
    return book;
  }
  
  async updateBook(id: number, bookUpdate: Partial<InsertBook>): Promise<Book | undefined> {
    const book = this.books.get(id);
    if (!book) return undefined;
    
    // Handle special cases for typed properties
    let typedOutline = book.outline;
    if (bookUpdate.outline) {
      typedOutline = {
        chapters: Array.isArray((bookUpdate.outline as any).chapters) 
          ? (bookUpdate.outline as any).chapters.map((chapter: any) => ({
              title: typeof chapter.title === 'string' ? chapter.title : '',
              content: typeof chapter.content === 'string' ? chapter.content : ''
            }))
          : []
      };
    }
    
    let typedMetadata = book.metadata;
    if (bookUpdate.metadata) {
      typedMetadata = {
        targetAudience: typeof bookUpdate.metadata.targetAudience === 'string' ? bookUpdate.metadata.targetAudience : book.metadata?.targetAudience || '',
        readingLevel: typeof bookUpdate.metadata.readingLevel === 'string' ? bookUpdate.metadata.readingLevel : book.metadata?.readingLevel || '',
        themes: Array.isArray(bookUpdate.metadata.themes) ? bookUpdate.metadata.themes : book.metadata?.themes || [],
        mood: typeof bookUpdate.metadata.mood === 'string' ? bookUpdate.metadata.mood : book.metadata?.mood || '',
        settings: Array.isArray(bookUpdate.metadata.settings) ? bookUpdate.metadata.settings : book.metadata?.settings || [],
        contentWarnings: Array.isArray(bookUpdate.metadata.contentWarnings) ? bookUpdate.metadata.contentWarnings : book.metadata?.contentWarnings || []
      };
    }
    
    // Create the updated book with proper typing, handling potential undefined values
    const updatedBook: Book = {
      id: book.id,
      title: bookUpdate.title ?? book.title,
      authorId: bookUpdate.authorId ?? book.authorId,
      description: bookUpdate.description ?? book.description,
      filePath: bookUpdate.filePath ?? book.filePath,
      coverImage: bookUpdate.coverImage ?? book.coverImage,
      price: bookUpdate.price ?? book.price,
      category: bookUpdate.category ?? book.category,
      published: bookUpdate.published ?? book.published,
      isAiGenerated: bookUpdate.isAiGenerated ?? book.isAiGenerated,
      isPublished: book.isPublished,
      isAIGenerated: book.isAIGenerated,
      aiGenerationPrompt: book.aiGenerationPrompt,
      pdfPath: bookUpdate.pdfPath ?? book.pdfPath,
      epubPath: bookUpdate.epubPath ?? book.epubPath,
      outline: typedOutline,
      metadata: typedMetadata,
      keywords: bookUpdate.keywords ? (Array.isArray(bookUpdate.keywords) ? bookUpdate.keywords : book.keywords) : book.keywords,
      createdAt: book.createdAt,
      updatedAt: new Date()
    };
    
    this.books.set(id, updatedBook);
    return updatedBook;
  }
  
  async deleteBook(id: number): Promise<boolean> {
    return this.books.delete(id);
  }
  
  async getAIGeneratedBooks(authorId: number): Promise<Book[]> {
    return Array.from(this.books.values())
      .filter(book => book.authorId === authorId && book.isAiGenerated === true)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createAIGeneratedBook(insertBookData: any): Promise<Book> {
    // Create a properly typed InsertBook with all required fields
    const insertBook: InsertBook = {
      title: insertBookData.title,
      authorId: insertBookData.authorId,
      description: insertBookData.description,
      filePath: insertBookData.filePath || "",
      coverImage: insertBookData.coverImage,
      price: insertBookData.price || "0.00",
      category: insertBookData.category || "fiction",
      published: insertBookData.published || false,
      isAiGenerated: true,
      metadata: insertBookData.metadata,
      outline: insertBookData.outline,
      keywords: insertBookData.keywords
    };
    
    return this.createBook(insertBook);
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
  
  // Collaborator methods
  async getCollaborator(id: number): Promise<Collaborator | undefined> {
    return this.collaborators.get(id);
  }
  
  async getCollaboratorsByBook(bookId: number): Promise<Collaborator[]> {
    return Array.from(this.collaborators.values())
      .filter(collab => collab.bookId === bookId)
      .sort((a, b) => a.id - b.id);
  }
  
  async getCollaboratorsByUser(userId: number): Promise<Collaborator[]> {
    return Array.from(this.collaborators.values())
      .filter(collab => collab.userId === userId)
      .sort((a, b) => new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime());
  }
  
  async getCollaborationsByUserAndStatus(userId: number, status: string): Promise<Collaborator[]> {
    return Array.from(this.collaborators.values())
      .filter(collab => collab.userId === userId && collab.inviteStatus === status)
      .sort((a, b) => new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime());
  }
  
  async checkCollaborationPermission(userId: number, bookId: number): Promise<Collaborator | undefined> {
    return Array.from(this.collaborators.values())
      .find(collab => collab.userId === userId && collab.bookId === bookId && collab.inviteStatus === 'accepted');
  }
  
  async inviteCollaborator(collaborator: InsertCollaborator): Promise<Collaborator> {
    const id = this.collaboratorIdCounter++;
    const now = new Date();
    
    const newCollaborator: Collaborator = {
      id,
      bookId: collaborator.bookId,
      userId: collaborator.userId,
      role: collaborator.role ?? 'co-author',
      inviteStatus: collaborator.inviteStatus ?? 'pending',
      invitedBy: collaborator.invitedBy,
      invitedAt: now,
      acceptedAt: null,
      lastActive: null
    };
    
    this.collaborators.set(id, newCollaborator);
    return newCollaborator;
  }
  
  async updateCollaboratorStatus(id: number, status: string, acceptedAt?: Date): Promise<Collaborator | undefined> {
    const collaborator = this.collaborators.get(id);
    if (!collaborator) return undefined;
    
    const updatedCollaborator: Collaborator = {
      ...collaborator,
      inviteStatus: status,
      acceptedAt: status === 'accepted' ? acceptedAt || new Date() : collaborator.acceptedAt
    };
    
    this.collaborators.set(id, updatedCollaborator);
    return updatedCollaborator;
  }
  
  async updateCollaboratorRole(id: number, role: string): Promise<Collaborator | undefined> {
    const collaborator = this.collaborators.get(id);
    if (!collaborator) return undefined;
    
    const updatedCollaborator: Collaborator = {
      ...collaborator,
      role: role as any // Cast to handle the enum type
    };
    
    this.collaborators.set(id, updatedCollaborator);
    return updatedCollaborator;
  }
  
  async removeCollaborator(id: number): Promise<boolean> {
    return this.collaborators.delete(id);
  }
  
  // Document change methods
  async getDocumentChanges(bookId: number, limit: number = 50, offset: number = 0): Promise<DocumentChange[]> {
    return Array.from(this.documentChanges.values())
      .filter(change => change.bookId === bookId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(offset, offset + limit);
  }
  
  async getDocumentChangesByChapter(bookId: number, chapterId: number): Promise<DocumentChange[]> {
    return Array.from(this.documentChanges.values())
      .filter(change => change.bookId === bookId && change.chapterId === chapterId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async createDocumentChange(change: InsertDocumentChange): Promise<DocumentChange> {
    const id = this.documentChangeIdCounter++;
    const now = new Date();
    
    const newChange: DocumentChange = {
      id,
      bookId: change.bookId,
      chapterId: change.chapterId ?? null,
      userId: change.userId,
      changeType: change.changeType,
      position: change.position ?? null,
      content: change.content ?? null,
      previousContent: change.previousContent ?? null,
      timestamp: now
    };
    
    this.documentChanges.set(id, newChange);
    return newChange;
  }
  
  async getLatestDocumentChanges(bookId: number, userId?: number): Promise<DocumentChange[]> {
    let changes = Array.from(this.documentChanges.values())
      .filter(change => change.bookId === bookId);
    
    if (userId) {
      changes = changes.filter(change => change.userId !== userId);
    }
    
    return changes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }
}

import { db } from './db';
import { eq, and, desc, or, like, sql, ilike, gt, gte, lt, lte, isNull, asc } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Book methods
  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book || undefined;
  }

  async getBooks(limit: number = 20, offset: number = 0): Promise<Book[]> {
    return await db.select().from(books).limit(limit).offset(offset);
  }

  async getBooksByAuthor(authorId: number): Promise<Book[]> {
    return await db.select().from(books).where(eq(books.authorId, authorId));
  }

  async getBooksByCategory(category: string): Promise<Book[]> {
    return await db.select().from(books).where(eq(books.category, category));
  }

  async searchBooks(query: string): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(
        or(
          ilike(books.title, `%${query}%`),
          ilike(books.description, `%${query}%`)
        )
      );
  }

  async getAIGeneratedBooks(authorId: number): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(
        and(
          eq(books.authorId, authorId),
          eq(books.generatedByAI, true)
        )
      );
  }

  async createBook(book: InsertBook): Promise<Book> {
    const [newBook] = await db
      .insert(books)
      .values(book)
      .returning();
    return newBook;
  }

  async createAIGeneratedBook(book: InsertBook): Promise<Book> {
    const bookWithAI = { ...book, generatedByAI: true };
    const [newBook] = await db
      .insert(books)
      .values(bookWithAI)
      .returning();
    return newBook;
  }

  async updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined> {
    const [updatedBook] = await db
      .update(books)
      .set(book)
      .where(eq(books.id, id))
      .returning();
    return updatedBook || undefined;
  }

  async deleteBook(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(books)
      .where(eq(books.id, id))
      .returning({ id: books.id });
    return !!deleted;
  }

  // Review methods
  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review || undefined;
  }

  async getReviewsByBook(bookId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.bookId, bookId));
  }

  async getReviewsByUser(userId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.userId, userId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    return newReview;
  }

  async updateReview(id: number, review: Partial<InsertReview>): Promise<Review | undefined> {
    const [updatedReview] = await db
      .update(reviews)
      .set(review)
      .where(eq(reviews.id, id))
      .returning();
    return updatedReview || undefined;
  }

  async deleteReview(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(reviews)
      .where(eq(reviews.id, id))
      .returning({ id: reviews.id });
    return !!deleted;
  }

  // Reading progress methods
  async getReadingProgress(userId: number, bookId: number): Promise<ReadingProgress | undefined> {
    const [progress] = await db
      .select()
      .from(readingProgresses)
      .where(
        and(
          eq(readingProgresses.userId, userId),
          eq(readingProgresses.bookId, bookId)
        )
      );
    return progress || undefined;
  }

  async getReadingProgressesByUser(userId: number): Promise<ReadingProgress[]> {
    return await db
      .select()
      .from(readingProgresses)
      .where(eq(readingProgresses.userId, userId));
  }

  async createReadingProgress(progress: InsertReadingProgress): Promise<ReadingProgress> {
    const [newProgress] = await db
      .insert(readingProgresses)
      .values(progress)
      .returning();
    return newProgress;
  }

  async updateReadingProgress(id: number, progress: Partial<InsertReadingProgress>): Promise<ReadingProgress | undefined> {
    const [updatedProgress] = await db
      .update(readingProgresses)
      .set(progress)
      .where(eq(readingProgresses.id, id))
      .returning();
    return updatedProgress || undefined;
  }

  // Bookmark methods
  async getBookmark(id: number): Promise<Bookmark | undefined> {
    const [bookmark] = await db.select().from(bookmarks).where(eq(bookmarks.id, id));
    return bookmark || undefined;
  }

  async getBookmarksByUser(userId: number): Promise<Bookmark[]> {
    return await db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
  }

  async getBookmarksByBook(bookId: number, userId: number): Promise<Bookmark[]> {
    return await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.bookId, bookId),
          eq(bookmarks.userId, userId)
        )
      );
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const [newBookmark] = await db
      .insert(bookmarks)
      .values(bookmark)
      .returning();
    return newBookmark;
  }

  async updateBookmark(id: number, bookmark: Partial<InsertBookmark>): Promise<Bookmark | undefined> {
    const [updatedBookmark] = await db
      .update(bookmarks)
      .set(bookmark)
      .where(eq(bookmarks.id, id))
      .returning();
    return updatedBookmark || undefined;
  }

  async deleteBookmark(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(bookmarks)
      .where(eq(bookmarks.id, id))
      .returning({ id: bookmarks.id });
    return !!deleted;
  }

  // Annotation methods
  async getAnnotation(id: number): Promise<Annotation | undefined> {
    const [annotation] = await db.select().from(annotations).where(eq(annotations.id, id));
    return annotation || undefined;
  }

  async getAnnotationsByUser(userId: number): Promise<Annotation[]> {
    return await db.select().from(annotations).where(eq(annotations.userId, userId));
  }

  async getAnnotationsByBook(bookId: number, userId: number): Promise<Annotation[]> {
    return await db
      .select()
      .from(annotations)
      .where(
        and(
          eq(annotations.bookId, bookId),
          eq(annotations.userId, userId)
        )
      );
  }

  async createAnnotation(annotation: InsertAnnotation): Promise<Annotation> {
    const [newAnnotation] = await db
      .insert(annotations)
      .values(annotation)
      .returning();
    return newAnnotation;
  }

  async updateAnnotation(id: number, annotation: Partial<InsertAnnotation>): Promise<Annotation | undefined> {
    const [updatedAnnotation] = await db
      .update(annotations)
      .set(annotation)
      .where(eq(annotations.id, id))
      .returning();
    return updatedAnnotation || undefined;
  }

  async deleteAnnotation(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(annotations)
      .where(eq(annotations.id, id))
      .returning({ id: annotations.id });
    return !!deleted;
  }

  // Collaborator methods
  async getCollaborator(id: number): Promise<Collaborator | undefined> {
    const [collaborator] = await db.select().from(collaborators).where(eq(collaborators.id, id));
    return collaborator || undefined;
  }

  async getCollaboratorsByBook(bookId: number): Promise<Collaborator[]> {
    return await db.select().from(collaborators).where(eq(collaborators.bookId, bookId));
  }

  async getCollaboratorsByUser(userId: number): Promise<Collaborator[]> {
    return await db.select().from(collaborators).where(eq(collaborators.userId, userId));
  }

  async getCollaborationsByUserAndStatus(userId: number, status: string): Promise<Collaborator[]> {
    return await db
      .select()
      .from(collaborators)
      .where(
        and(
          eq(collaborators.userId, userId),
          eq(collaborators.status, status)
        )
      );
  }

  async checkCollaborationPermission(userId: number, bookId: number): Promise<Collaborator | undefined> {
    const [collaborator] = await db
      .select()
      .from(collaborators)
      .where(
        and(
          eq(collaborators.userId, userId),
          eq(collaborators.bookId, bookId),
          eq(collaborators.status, 'accepted')
        )
      );
    return collaborator || undefined;
  }

  async inviteCollaborator(collaborator: InsertCollaborator): Promise<Collaborator> {
    const [newCollaborator] = await db
      .insert(collaborators)
      .values(collaborator)
      .returning();
    return newCollaborator;
  }

  async updateCollaboratorStatus(id: number, status: string, acceptedAt?: Date): Promise<Collaborator | undefined> {
    const updateData: any = { status };
    if (acceptedAt) {
      updateData.acceptedAt = acceptedAt;
    }

    const [updatedCollaborator] = await db
      .update(collaborators)
      .set(updateData)
      .where(eq(collaborators.id, id))
      .returning();
    return updatedCollaborator || undefined;
  }

  async updateCollaboratorRole(id: number, role: string): Promise<Collaborator | undefined> {
    const [updatedCollaborator] = await db
      .update(collaborators)
      .set({ role })
      .where(eq(collaborators.id, id))
      .returning();
    return updatedCollaborator || undefined;
  }

  async removeCollaborator(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(collaborators)
      .where(eq(collaborators.id, id))
      .returning({ id: collaborators.id });
    return !!deleted;
  }

  // Document change methods
  async getDocumentChanges(bookId: number, limit: number = 50, offset: number = 0): Promise<DocumentChange[]> {
    return await db
      .select()
      .from(documentChanges)
      .where(eq(documentChanges.bookId, bookId))
      .orderBy(desc(documentChanges.timestamp))
      .limit(limit)
      .offset(offset);
  }

  async getDocumentChangesByChapter(bookId: number, chapterId: number): Promise<DocumentChange[]> {
    return await db
      .select()
      .from(documentChanges)
      .where(
        and(
          eq(documentChanges.bookId, bookId),
          eq(documentChanges.chapterId, chapterId)
        )
      )
      .orderBy(desc(documentChanges.timestamp));
  }

  async createDocumentChange(change: InsertDocumentChange): Promise<DocumentChange> {
    const [newChange] = await db
      .insert(documentChanges)
      .values(change)
      .returning();
    return newChange;
  }

  async getLatestDocumentChanges(bookId: number, userId?: number): Promise<DocumentChange[]> {
    let query = db
      .select()
      .from(documentChanges)
      .where(eq(documentChanges.bookId, bookId))
      .orderBy(desc(documentChanges.timestamp))
      .limit(20);
    
    if (userId) {
      query = db
        .select()
        .from(documentChanges)
        .where(
          and(
            eq(documentChanges.bookId, bookId),
            eq(documentChanges.userId, userId)
          )
        )
        .orderBy(desc(documentChanges.timestamp))
        .limit(20);
    }
    
    return await query;
  }
}

// Use database storage for production and testing
export const storage = new DatabaseStorage();

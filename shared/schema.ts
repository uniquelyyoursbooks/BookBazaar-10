import { pgTable, text, serial, integer, boolean, json, timestamp, pgEnum, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  bio: text("bio"),
  isAuthor: boolean("is_author").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  bio: true,
  isAuthor: true
});

// Book category enum
export const bookCategoryEnum = pgEnum("book_category", [
  "fiction",
  "non_fiction",
  "mystery",
  "thriller",
  "fantasy",
  "science_fiction",
  "romance",
  "poetry",
  "biography",
  "historical",
  "self_help",
  "technical",
  "other"
]);

// Book schema
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  authorId: integer("author_id").notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image"),
  filePath: text("file_path").notNull(),
  price: text("price").default("0.00").notNull(),
  category: bookCategoryEnum("category").default("other").notNull(),
  published: boolean("published").default(true).notNull(),
  isAiGenerated: boolean("is_ai_generated").default(false),
  aiGenerationPrompt: text("ai_generation_prompt"),
  outline: json("outline").$type<{chapters: {title: string, content: string}[]}>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBookSchema = createInsertSchema(books).pick({
  title: true,
  authorId: true,
  description: true,
  coverImage: true,
  filePath: true,
  price: true,
  category: true,
  published: true,
  isAiGenerated: true,
  aiGenerationPrompt: true,
  outline: true
});

// Review schema
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  bookId: true,
  userId: true,
  rating: true,
  comment: true
});

// Reading progress schema
export const readingProgresses = pgTable("reading_progresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  currentPage: integer("current_page").default(1).notNull(),
  totalPages: integer("total_pages").notNull(),
  completionPercentage: integer("completion_percentage").default(0).notNull(),
  lastRead: timestamp("last_read").defaultNow().notNull(),
});

export const insertReadingProgressSchema = createInsertSchema(readingProgresses).pick({
  userId: true,
  bookId: true,
  currentPage: true,
  totalPages: true,
  completionPercentage: true,
  lastRead: true
});

// Bookmark schema
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  pageNumber: integer("page_number").notNull(),
  title: text("title"),
  description: text("description"),
  color: text("color").default("#FFD700").notNull(), // Default to gold color
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).pick({
  userId: true,
  bookId: true,
  pageNumber: true,
  title: true,
  description: true,
  color: true
});

// Annotation schema
export const annotations = pgTable("annotations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  pageNumber: integer("page_number").notNull(),
  content: text("content").notNull(),
  textSelection: text("text_selection"), // The text that was highlighted/selected
  startOffset: integer("start_offset"), // Starting character position of the annotation within the page
  endOffset: integer("end_offset"), // Ending character position of the annotation within the page
  color: text("color").default("#FFFF00").notNull(), // Default to yellow highlight
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAnnotationSchema = createInsertSchema(annotations).pick({
  userId: true,
  bookId: true,
  pageNumber: true,
  content: true,
  textSelection: true,
  startOffset: true,
  endOffset: true,
  color: true
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type ReadingProgress = typeof readingProgresses.$inferSelect;
export type InsertReadingProgress = z.infer<typeof insertReadingProgressSchema>;

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;

// Extended category schema with display names
export const BOOK_CATEGORIES = [
  { value: "fiction", label: "Fiction" },
  { value: "non_fiction", label: "Non-Fiction" },
  { value: "mystery", label: "Mystery" },
  { value: "thriller", label: "Thriller" },
  { value: "fantasy", label: "Fantasy" },
  { value: "science_fiction", label: "Science Fiction" },
  { value: "romance", label: "Romance" },
  { value: "poetry", label: "Poetry" },
  { value: "biography", label: "Biography" },
  { value: "historical", label: "Historical" },
  { value: "self_help", label: "Self Help" },
  { value: "technical", label: "Technical" },
  { value: "other", label: "Other" }
];

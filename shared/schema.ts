import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  bannerImage: text("banner_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  authorId: integer("author_id").notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image"),
  contentPath: text("content_path").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookProgress = pgTable("book_progress", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  userId: integer("user_id").notNull(),
  currentPage: integer("current_page").default(1).notNull(),
  totalPages: integer("total_pages").notNull(),
  lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
  publishedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertBookProgressSchema = createInsertSchema(bookProgress).omit({
  id: true,
  lastReadAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertBookProgress = z.infer<typeof insertBookProgressSchema>;
export type BookProgress = typeof bookProgress.$inferSelect;

// Categories
export const bookCategories = [
  "Fiction",
  "Business",
  "Science",
  "Romance",
  "Mystery",
  "Biography",
  "Children",
  "Self-Help",
  "Fantasy",
  "History",
  "Poetry",
  "Thriller",
  "Sci-Fi",
  "Cooking",
  "Travel",
  "Religion",
  "Art",
  "Other"
];

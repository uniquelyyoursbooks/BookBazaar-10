import { Multer } from "multer";
import { User } from "@shared/schema";

// Extend Express types to support multer fields and authenticated user
declare global {
  namespace Express {
    interface Request {
      files?: {
        [fieldname: string]: Express.Multer.File[];
      };
      // After validateAuth, user will be defined, but may be undefined in other contexts
      user: {
        id: number;
      } & Partial<User>;
    }
  }
}
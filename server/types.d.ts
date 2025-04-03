import { Multer } from "multer";

// Extend Express types to support multer fields
declare global {
  namespace Express {
    interface Request {
      files?: {
        [fieldname: string]: Express.Multer.File[];
      };
    }
  }
}
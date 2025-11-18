import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Request } from 'express';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'src', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    cb(null, path.join(process.cwd(), 'src', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, WEBP, and AVIF images are allowed'));
  }
};

export const upload = multer({ storage, fileFilter });

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Determine file directory in ESM (replace usage of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading .env from the server folder (relative to this file), then fallback to cwd
const envPath = path.resolve(__dirname, '../../.env');
// Diagnostic: show paths and whether file exists
console.log('Prisma client init diagnostics:');
console.log(' - __dirname:', __dirname);
console.log(' - process.cwd():', process.cwd());
console.log(' - envPath:', envPath);
console.log(' - envPath exists?:', fs.existsSync(envPath));
console.log(' - initial process.env.DATABASE_URL:', Boolean(process.env.DATABASE_URL));

config({ path: envPath });
if (!process.env.DATABASE_URL) {
  const cwdEnv = path.resolve(process.cwd(), '.env');
  console.log(' - trying cwd .env path:', cwdEnv, 'exists?:', fs.existsSync(cwdEnv));
  config({ path: cwdEnv });
}
console.log(' - after config process.env.DATABASE_URL present?:', Boolean(process.env.DATABASE_URL));

// Diagnostic logging to help debug missing DATABASE_URL errors
const rawDbUrl = process.env.DATABASE_URL;
if (!rawDbUrl) {
  console.error('WARNING: process.env.DATABASE_URL is undefined when initializing PrismaClient');
} else {
  try {
    const masked = rawDbUrl.replace(/(:\/\/)([^:@\n]+):([^@\n]+)@/, '$1[USER]:[PASS]@');
    console.log('Using DATABASE_URL for Prisma:', masked);
  } catch (e) {
    console.log('Using DATABASE_URL for Prisma: [REDACTED]');
  }
}

let prisma: PrismaClient;
if (rawDbUrl) {
  prisma = new PrismaClient({
    datasources: { db: { url: rawDbUrl } },
  });
} else {
  // If no DATABASE_URL, let Prisma fall back to the environment / datasource in schema
  prisma = new PrismaClient();
}

export default prisma;

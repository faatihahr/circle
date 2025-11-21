import { config } from 'dotenv';
import path from 'path';

// Load .env from server root
const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });

export {};

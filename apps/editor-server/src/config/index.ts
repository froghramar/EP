// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Get the workspace root directory (adjust as needed)
export const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || process.cwd();

// CORS configuration
const CORS_ORIGIN_ENV = process.env.CORS_ORIGIN || '*';
const CORS_ORIGINS = CORS_ORIGIN_ENV === '*' 
  ? ['*'] 
  : CORS_ORIGIN_ENV.includes(',') 
    ? CORS_ORIGIN_ENV.split(',').map(origin => origin.trim())
    : [CORS_ORIGIN_ENV];

export const CORS_ORIGIN = CORS_ORIGINS.length === 1 && CORS_ORIGINS[0] === '*'
  ? '*'
  : (ctx: any) => {
      const origin = ctx.headers.origin;
      return origin && CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0];
    };

export const CORS_CREDENTIALS = process.env.CORS_CREDENTIALS === 'true';
export const CORS_ORIGIN_ENV_VALUE = CORS_ORIGIN_ENV;

// Server configuration
export const PORT = parseInt(process.env.PORT || '3001', 10);

// Claude AI Configuration
export const CLAUDE_MODEL = 'claude-sonnet-4-5';

// WordPress REST API Configuration
export const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL; // e.g., https://example.com/wp-json
export const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME;
export const WORDPRESS_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;


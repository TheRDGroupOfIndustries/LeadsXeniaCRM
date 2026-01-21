import { PrismaClient } from "@prisma/client";

// Configure for Neon serverless (optional, only if package available)
try {
  const { neonConfig } = require('@neondatabase/serverless');
  if (typeof globalThis.fetch !== 'undefined') {
    neonConfig.fetchConnectionCache = true;
  }
} catch {
  // @neondatabase/serverless not installed, continue without it
}

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Build connection URL with Neon-optimized settings for scale
const getDatabaseUrl = () => {
  const forceDirect = (process.env.FORCE_DIRECT_DB || '').toLowerCase() === 'true';
  const preferredUrl =
    (forceDirect && process.env.DIRECT_URL) ?
      process.env.DIRECT_URL :
    (process.env.NODE_ENV === 'development' && process.env.DIRECT_URL ? process.env.DIRECT_URL : process.env.DATABASE_URL) ||
    '';

  const baseUrl = preferredUrl;
  
  // Check if using SQLite (file: protocol)
  if (baseUrl.startsWith('file:')) {
    // SQLite doesn't support connection pooling parameters
    return baseUrl;
  }
  
  // Add connection parameters optimized for Neon serverless at scale
  // connection_limit: max connections per instance (Neon handles pooling)
  // pool_timeout: time to wait for connection from pool
  // connect_timeout: time to establish new connection
  const isPooler = baseUrl.includes('-pooler.') || baseUrl.includes('pgbouncer=true');
  const separator = baseUrl.includes('?') ? '&' : '?';
  const commonParams = 'connect_timeout=30&pool_timeout=30&connection_limit=25';
  const pgbouncerParam = isPooler ? '&pgbouncer=true' : '';
  return `${baseUrl}${separator}${commonParams}${pgbouncerParam}`;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Enhanced database operation wrapper with retry logic for Neon cold starts
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: any;
  let delay = initialDelay;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry for certain error types (data errors, not connection errors)
      if (error.code === 'P2002' || error.code === 'P2025') {
        throw error;
      }
      
      // Check if it's a connection/timeout error worth retrying
      const isConnectionError = 
        error.message?.includes('connect') ||
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('connection') ||
        error.code === 'P1001' || // Can't reach database server
        error.code === 'P1002' || // Database server timed out
        error.code === 'P1008' || // Operations timed out
        error.code === 'P1017';   // Server closed connection
      
      if (!isConnectionError) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        console.log(`Database connection failed (Neon cold start?), retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 10000); // Gradual backoff, max 10s
      }
    }
  }
  
  throw lastError;
}

// Warm up the database connection (call on app init or before critical operations)
export async function warmupConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('Database warmup failed:', error);
    return false;
  }
}

export default prisma;
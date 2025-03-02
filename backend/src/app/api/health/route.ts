import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/utils/logger";
import os from "os";

interface HealthStatus {
  status: "ok" | "warning" | "error";
  timestamp: string;
  environment: string;
  version: string;
  uptime: number;
  host: string;
  services: {
    database: "connected" | "disconnected";
    auth: "connected" | "disconnected";
    cache?: "connected" | "disconnected";
  };
  system: {
    memory: {
      total: number;
      free: number;
      used: number;
      usedPercent: number;
    };
    cpu: {
      loadAvg: number[];
      cores: number;
    };
    disk?: {
      free: number;
      total: number;
      usedPercent: number;
    };
  };
  checks: {
    [key: string]: {
      status: "ok" | "warning" | "error";
      message?: string;
      latency?: number;
    };
  };
}

/**
 * Health check endpoint for monitoring the application
 * Checks database connectivity, auth service, and system resources
 */
export async function GET() {
  const startTime = Date.now();
  const checks: HealthStatus["checks"] = {};
  
  try {
    // Get environment and version info
    const environment = process.env.NODE_ENV || 'development';
    const version = process.env.APP_VERSION || '0.1.0';
    const host = os.hostname();
    
    // Check database connectivity
    const dbStatus = await checkDatabaseConnection(checks);
    
    // Check Supabase auth service
    const authStatus = await checkAuthService(checks);
    
    // Check system resources
    const systemInfo = getSystemInfo();
    
    // Determine overall status
    const overallStatus = determineOverallStatus(checks);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    checks.responseTime = {
      status: responseTime < 500 ? "ok" : responseTime < 1000 ? "warning" : "error",
      latency: responseTime,
      message: `Response time: ${responseTime}ms`
    };
    
    // Log health check result in production
    if (environment === 'production') {
      logger.info({
        message: `Health check completed with status: ${overallStatus}`,
        responseTime,
        dbStatus,
        authStatus,
        systemMemoryUsed: systemInfo.memory.usedPercent
      });
    }
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment,
      version,
      uptime: process.uptime(),
      host,
      services: {
        database: dbStatus ? "connected" : "disconnected",
        auth: authStatus ? "connected" : "disconnected"
      },
      system: systemInfo,
      checks
    };
    
    // Return detailed response in development, simplified in production
    if (environment === 'production') {
      // In production, don't expose detailed system information
      const { system, checks, ...productionResponse } = healthStatus;
      return NextResponse.json(productionResponse, { 
        status: overallStatus === "error" ? 503 : 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    }
    
    return NextResponse.json(healthStatus, { 
      status: overallStatus === "error" ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    logger.error({
      message: "Health check failed",
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Service unavailable",
      checks
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }
}

/**
 * Check database connection by performing a simple query
 */
async function checkDatabaseConnection(checks: HealthStatus["checks"]): Promise<boolean> {
  const startTime = Date.now();
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const latency = Date.now() - startTime;
    checks.database = {
      status: latency < 100 ? "ok" : latency < 300 ? "warning" : "error",
      latency,
      message: `Database responded in ${latency}ms`
    };
    
    return true;
  } catch (error) {
    logger.error({
      message: "Database connection check failed",
      error: error instanceof Error ? error.message : String(error)
    });
    
    checks.database = {
      status: "error",
      message: error instanceof Error ? error.message : String(error)
    };
    
    return false;
  }
}

/**
 * Check Supabase auth service connectivity
 */
async function checkAuthService(checks: HealthStatus["checks"]): Promise<boolean> {
  const startTime = Date.now();
  try {
    // Skip if Supabase URL or key is not configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      checks.auth = {
        status: "warning",
        message: "Supabase configuration missing"
      };
      return false;
    }
    
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Check if auth service is available
    const { data, error } = await supabase.auth.getSession();
    
    const latency = Date.now() - startTime;
    
    if (error) {
      checks.auth = {
        status: "error",
        message: error.message,
        latency
      };
      return false;
    }
    
    checks.auth = {
      status: latency < 200 ? "ok" : latency < 500 ? "warning" : "error",
      latency,
      message: `Auth service responded in ${latency}ms`
    };
    
    return true;
  } catch (error) {
    logger.error({
      message: "Auth service check failed",
      error: error instanceof Error ? error.message : String(error)
    });
    
    checks.auth = {
      status: "error",
      message: error instanceof Error ? error.message : String(error)
    };
    
    return false;
  }
}

/**
 * Get system information
 */
function getSystemInfo() {
  // Memory information
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsedPercent = Math.round((usedMemory / totalMemory) * 100);
  
  // CPU information
  const loadAvg = os.loadavg();
  const cpuCores = os.cpus().length;
  
  return {
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usedPercent: memoryUsedPercent
    },
    cpu: {
      loadAvg,
      cores: cpuCores
    }
  };
}

/**
 * Determine overall status based on all checks
 */
function determineOverallStatus(checks: HealthStatus["checks"]): "ok" | "warning" | "error" {
  const statuses = Object.values(checks).map(check => check.status);
  
  if (statuses.includes("error")) {
    return "error";
  }
  
  if (statuses.includes("warning")) {
    return "warning";
  }
  
  return "ok";
}

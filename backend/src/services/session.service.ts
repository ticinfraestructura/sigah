/**
 * Servicio de Gestión de Sesiones
 * 
 * Maneja la invalidación de tokens JWT y el seguimiento de sesiones activas
 */

import { PrismaClient } from '@prisma/client';

// ============ TOKEN BLACKLIST ============

interface BlacklistedToken {
  token: string;
  expiresAt: Date;
  reason: string;
  userId: string;
}

// En memoria para desarrollo - En producción usar Redis
const tokenBlacklist = new Map<string, BlacklistedToken>();

// Limpiar tokens expirados cada hora
setInterval(() => {
  const now = new Date();
  for (const [token, data] of tokenBlacklist.entries()) {
    if (data.expiresAt < now) {
      tokenBlacklist.delete(token);
    }
  }
}, 60 * 60 * 1000);

/**
 * Agregar token a la blacklist
 */
export const blacklistToken = (
  token: string, 
  userId: string, 
  reason: string = 'logout',
  expiresInMs: number = 24 * 60 * 60 * 1000 // 24 horas por defecto
): void => {
  tokenBlacklist.set(token, {
    token,
    expiresAt: new Date(Date.now() + expiresInMs),
    reason,
    userId
  });
};

/**
 * Verificar si un token está en la blacklist
 */
export const isTokenBlacklisted = (token: string): boolean => {
  const blacklisted = tokenBlacklist.get(token);
  if (!blacklisted) return false;
  
  // Si ya expiró, eliminarlo y retornar false
  if (blacklisted.expiresAt < new Date()) {
    tokenBlacklist.delete(token);
    return false;
  }
  
  return true;
};

/**
 * Invalidar todos los tokens de un usuario
 */
export const invalidateAllUserTokens = (userId: string): void => {
  // En una implementación real, esto requeriría almacenar los tokens
  // o usar un sistema de versiones de token por usuario
  console.log(`[SESSION] Invalidating all tokens for user: ${userId}`);
};

// ============ ACTIVE SESSIONS ============

interface ActiveSession {
  sessionId: string;
  userId: string;
  userAgent: string;
  ip: string;
  createdAt: Date;
  lastActivity: Date;
}

const activeSessions = new Map<string, ActiveSession>();

/**
 * Registrar una nueva sesión
 */
export const registerSession = (
  sessionId: string,
  userId: string,
  userAgent: string,
  ip: string
): void => {
  activeSessions.set(sessionId, {
    sessionId,
    userId,
    userAgent,
    ip,
    createdAt: new Date(),
    lastActivity: new Date()
  });
};

/**
 * Actualizar última actividad de una sesión
 */
export const updateSessionActivity = (sessionId: string): void => {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date();
  }
};

/**
 * Obtener sesiones activas de un usuario
 */
export const getUserSessions = (userId: string): ActiveSession[] => {
  const sessions: ActiveSession[] = [];
  for (const session of activeSessions.values()) {
    if (session.userId === userId) {
      sessions.push(session);
    }
  }
  return sessions;
};

/**
 * Terminar una sesión específica
 */
export const terminateSession = (sessionId: string): boolean => {
  return activeSessions.delete(sessionId);
};

/**
 * Terminar todas las sesiones de un usuario
 */
export const terminateAllUserSessions = (userId: string): number => {
  let count = 0;
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.userId === userId) {
      activeSessions.delete(sessionId);
      count++;
    }
  }
  return count;
};

// ============ SESSION STATS ============

export const getSessionStats = () => {
  return {
    activeSessions: activeSessions.size,
    blacklistedTokens: tokenBlacklist.size
  };
};

// ============ FAILED LOGIN TRACKING ============

interface FailedLoginAttempt {
  count: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

const failedLogins = new Map<string, FailedLoginAttempt>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Registrar un intento de login fallido
 */
export const recordFailedLogin = (identifier: string): { locked: boolean; remainingAttempts: number } => {
  const existing = failedLogins.get(identifier);
  const now = new Date();
  
  if (existing) {
    // Si está bloqueado y el bloqueo no ha expirado
    if (existing.lockedUntil && existing.lockedUntil > now) {
      return { locked: true, remainingAttempts: 0 };
    }
    
    // Si el bloqueo expiró, reiniciar contador
    if (existing.lockedUntil && existing.lockedUntil <= now) {
      failedLogins.set(identifier, { count: 1, lastAttempt: now });
      return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - 1 };
    }
    
    // Incrementar contador
    existing.count++;
    existing.lastAttempt = now;
    
    // Si alcanzó el máximo, bloquear
    if (existing.count >= MAX_FAILED_ATTEMPTS) {
      existing.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
      return { locked: true, remainingAttempts: 0 };
    }
    
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - existing.count };
  }
  
  // Primer intento fallido
  failedLogins.set(identifier, { count: 1, lastAttempt: now });
  return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - 1 };
};

/**
 * Verificar si un identificador está bloqueado
 */
export const isLoginLocked = (identifier: string): { locked: boolean; unlockTime?: Date } => {
  const attempt = failedLogins.get(identifier);
  if (!attempt || !attempt.lockedUntil) {
    return { locked: false };
  }
  
  if (attempt.lockedUntil > new Date()) {
    return { locked: true, unlockTime: attempt.lockedUntil };
  }
  
  return { locked: false };
};

/**
 * Limpiar intentos fallidos después de login exitoso
 */
export const clearFailedLogins = (identifier: string): void => {
  failedLogins.delete(identifier);
};

// Limpiar intentos fallidos antiguos cada hora
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [identifier, attempt] of failedLogins.entries()) {
    if (attempt.lastAttempt < oneHourAgo && !attempt.lockedUntil) {
      failedLogins.delete(identifier);
    }
  }
}, 60 * 60 * 1000);

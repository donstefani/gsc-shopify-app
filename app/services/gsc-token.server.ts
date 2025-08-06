/**
 * GSC Token Service
 * Handles Google Search Console token management via Lambda integration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types based on your token-object.txt responses
interface TokenResponse {
  message: string;
  token: {
    access_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
    expiry_date: number;
  };
  isExpired: boolean;
  expiresAt: string;
  lastUpdated: string;
}

interface TokenErrorResponse {
  error: string;
  message?: string;
  details?: string;
}

/**
 * Check if a token is valid (not expired)
 */
export function isTokenValid(token: { expiresAt: Date; isExpired: boolean }): boolean {
  const now = new Date();
  return token.expiresAt > now && !token.isExpired;
}

/**
 * Get fresh token from Lambda auth service
 */
async function fetchTokenFromLambda(): Promise<TokenResponse> {
  const baseUrl = process.env.BASE_URL;
  
  if (!baseUrl) {
    throw new Error('BASE_URL environment variable not configured');
  }

  // Note: No userId parameter since Lambda has default user
  const response = await fetch(`${baseUrl}/auth/token`, {method: 'GET'});
  const data = await response.json();

  if (!response.ok) {
    const errorData = data as TokenErrorResponse;
    throw new Error(`Lambda error (${response.status}): ${errorData.error || errorData.message}`);
  }

  return data as TokenResponse;
}

/**
 * Store token in database from Lambda response
 */
async function storeToken(tokenData: TokenResponse) {
  // Clear any existing tokens (single token approach)
  await prisma.gscToken.deleteMany();

  // Store new token
  const token = await prisma.gscToken.create({
    data: {
      accessToken: tokenData.token.access_token,
      refreshToken: tokenData.token.refresh_token,
      scope: tokenData.token.scope,
      tokenType: tokenData.token.token_type,
      expiryDate: new Date(tokenData.token.expiry_date),
      isExpired: tokenData.isExpired,
      expiresAt: new Date(tokenData.expiresAt),
      lastUpdated: new Date(tokenData.lastUpdated),
    },
  });

  return token;
}

/**
 * Get valid token - either from database or fetch fresh from Lambda
 */
export async function getToken(): Promise<{ accessToken: string; isExpired: boolean } | null> {
  try {
    // Try to get existing token from database
    const existingToken = await prisma.gscToken.findFirst();

    // If we have a valid token, return it
    if (existingToken && isTokenValid(existingToken)) {
      return {
        accessToken: existingToken.accessToken,
        isExpired: false,
      };
    }

    // No valid token - fetch fresh from Lambda
    console.log('Fetching fresh token from Lambda...');
    const tokenData = await fetchTokenFromLambda();
    const storedToken = await storeToken(tokenData);

    return {
      accessToken: storedToken.accessToken,
      isExpired: false,
    };

  } catch (error) {
    console.error('Error getting GSC token:', error);
    return null;
  }
}

/**
 * Force refresh token from Lambda (for when GSC API returns auth errors)
 */
export async function refreshToken(): Promise<{ accessToken: string; isExpired: boolean } | null> {
  try {
    console.log('Force refreshing token from Lambda...');
    const tokenData = await fetchTokenFromLambda();
    const storedToken = await storeToken(tokenData);

    return {
      accessToken: storedToken.accessToken,
      isExpired: false,
    };

  } catch (error) {
    console.error('Error refreshing GSC token:', error);
    return null;
  }
}

/**
 * Get token status for UI (authorized/unauthorized)
 */
export async function getTokenStatus(): Promise<{ isAuthorized: boolean; expiresAt?: Date }> {
  try {
    const existingToken = await prisma.gscToken.findFirst();

    if (!existingToken) {
      return { isAuthorized: false };
    }

    const isValid = isTokenValid(existingToken);
    
    return {
      isAuthorized: isValid,
      expiresAt: existingToken.expiresAt,
    };

  } catch (error) {
    console.error('Error checking token status:', error);
    return { isAuthorized: false };
  }
}

/**
 * Clear all tokens (for testing/logout)
 */
export async function clearTokens(): Promise<void> {
  await prisma.gscToken.deleteMany();
}
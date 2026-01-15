import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function getSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    console.warn(
      'Failed to fetch session (likely offline/DB unreachable):',
      error
    );
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return null;
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const userRole = session.user.role || 'client';
  if (!allowedRoles.includes(userRole)) {
    return null;
  }

  return session;
}

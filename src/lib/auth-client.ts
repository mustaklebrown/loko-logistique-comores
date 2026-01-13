'use client';

import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import { ac, admin, courier, client } from './permissions';

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        admin,
        courier,
        client,
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;

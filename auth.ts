import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

// Database connection
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Fetch user by email
async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    return user[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

// NextAuth configuration
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        // Validate the credentials
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        // If validation fails, stop here
        if (!parsedCredentials.success) {
          console.log('Invalid credentials format');
          return null;
        }

        // Extract valid credentials
        const { email, password } = parsedCredentials.data;

        // Get user from DB
        const user = await getUser(email);
        if (!user) {
          console.log('User not found');
          return null;
        }

        // Compare password
        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
          console.log('Incorrect password');
          return null;
        }

        // ✅ Return user object (success)
        return user;
      },
    }),
  ],
});

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs"; // Install: npm install bcryptjs
import "@/lib/env-check"; // Debug environment variables

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true, // Required for deployment
  providers: [
    // Only enable Google OAuth if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),

    // ✅ Email/Password Provider
    Credentials({
      name: "Email and Password",
      credentials: {
        name: { label: "Name", type: "text", placeholder: "John Doe" },
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
        action: { label: "Action", type: "hidden" }, // to differentiate login/signup
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const rawEmail = String(credentials.email);
        const rawPassword = String(credentials.password);
        const email = rawEmail.trim().toLowerCase();
        const password = rawPassword.trim();
        const action = credentials.action;

        // 🔹 SIGNUP LOGIC
        if (action === "signup") {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: email as string },
          });

          if (existingUser) {
            throw new Error("User already exists. Please login.");
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(password as string, 10);

          // Create new user
          const newUser = await prisma.user.create({
            data: {
              email: email as string,
              password: hashedPassword,
              name: (credentials.name as string) || (email as string).split("@")[0],
              role: "EMPLOYEE",
            },
          });

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
          };
        }

        // 🔹 LOGIN LOGIC
        const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
        const adminPassword = (process.env.ADMIN_PASSWORD || "").trim();

        // Admin credentials (from env)
        if (email === adminEmail && password === adminPassword) {
          // Admin credentials - create or find admin in DB
          try {
            let user = await prisma.user.findUnique({
              where: { email },
            });

            // If admin doesn't exist, create with hashed password
            if (!user) {
              const hashedPassword = await bcrypt.hash(password as string, 10);
              user = await prisma.user.create({
                data: {
                  email,
                  password: hashedPassword,
                  name: process.env.ADMIN_NAME || "Admin",
                  role: "ADMIN",
                },
              });
            }

            if (user && user.password) {
              const isValidPassword = await bcrypt.compare(password as string, user.password);
              if (isValidPassword) {
                return {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: "ADMIN",
                };
              }
            }
          } catch (dbErr: any) {
            console.error('Database error during admin login:', dbErr?.message || dbErr);
            throw new Error("Database unavailable for admin login");
          }

          throw new Error("Invalid admin credentials");
        }

        // For all other credentials, find user and assign EMPLOYEE role
        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) {
            throw new Error("Invalid email or password");
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            password as string,
            user.password
          );

          if (!isValidPassword) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: "EMPLOYEE", // Force EMPLOYEE role for all non-admin credentials
          };
        } catch (dbErr: any) {
          console.error('Database error during employee login:', dbErr?.message || dbErr);
          throw new Error("Invalid email or password or database unavailable");
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    // Redirect after sign-in
    async redirect({ url, baseUrl }) {
      // After successful sign-in, redirect to dashboard
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`;
      }
      return baseUrl + "/dashboard";
    },
    // ✅ Runs once on sign-in
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Only upsert for OAuth providers (Google), not for Credentials
      if (account?.provider === "google") {
        // Determine role: only admin@xeniacrm.app gets ADMIN role, all others are EMPLOYEE
        const role = user.email === process.env.ADMIN_EMAIL ? "ADMIN" : "EMPLOYEE";

        try {
          await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name ?? "Unknown",
              role: role, // Update role on each login
              updatedAt: new Date(),
            },
            create: {
              email: user.email,
              name: user.name ?? "Unknown",
              role: role,
            },
          });
        } catch (err: any) {
          // If the DB is not ready (e.g., tables not created yet), don't hard-fail OAuth.
          // The app will still need DB to function, but this avoids a confusing AccessDenied.
          console.error("Database error during Google OAuth upsert:", err?.message || err);
        }
      }

      return true;
    },

    // ✅ Attach user ID to JWT (runs on token creation/refresh)
    async jwt({ token, user, trigger }) {
      // On sign-in, attach DB user data to token
      if (user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true, name: true, email: true, subscription: true },
          });

          if (dbUser) {
            token.userId = dbUser.id;
            token.role = dbUser.role;
            token.name = dbUser.name;
            token.email = dbUser.email || "";
            token.subscription = dbUser.subscription;
          } else if (user.id) {
            // If no DB user found but we have user.id from credentials provider
            token.userId = user.id;
            token.role = user.role || "EMPLOYEE";
            token.name = user.name || "";
            token.email = user.email || "";
            token.subscription = "FREE";
          }
        } catch (dbErr: any) {
          console.error('Database unreachable in JWT callback:', dbErr?.message || dbErr);
          // Fallback to user data from the authorize function
          if (user.id) {
            token.userId = user.id;
            token.role = user.role || "EMPLOYEE";
            token.name = user.name || "";
            token.email = user.email || "";
            token.subscription = "FREE";
          }
        }
      }

      // On profile update, refresh data
      if (trigger === "update" && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { id: true, role: true, name: true, subscription: true },
          });

          if (dbUser) {
            token.userId = dbUser.id;
            token.role = dbUser.role;
            token.name = dbUser.name;
            token.subscription = dbUser.subscription;
          }
        } catch (dbErr: any) {
          console.error('Database unreachable during token update:', dbErr?.message || dbErr);
          // Keep existing token data
        }
      }

      return token;
    },

    // ✅ Add custom data to session object (runs frequently but no DB query)
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        (session.user as any).subscription = token.subscription as string;
      }
      return session;
    },
  },
});

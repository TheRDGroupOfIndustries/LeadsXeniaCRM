import { z } from "zod";
import { Role } from "@prisma/client";

// Email schema
export const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

//signup Schema
export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"), // ✅ built-in email validation
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm Password must be at least 6 characters"),
    role: z.nativeEnum(Role).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
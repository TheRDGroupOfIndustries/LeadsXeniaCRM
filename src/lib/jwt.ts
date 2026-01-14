import { NextRequest } from "next/server";
import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET: string = process.env.NEXTAUTH_SECRET || "super_secret_key";
const JWT_EXP: SignOptions["expiresIn"] = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

export interface AuthPayload {
  userId: string;
   name: string;
  email: string;
  role: string;
}

export const signJwt = (payload: AuthPayload): string => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXP });
export const verifyJwt = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
};

// export function authenticate(req: NextRequest): DecodedUser | null {
//   const token = req.cookies.get("token")?.value;
//   if (!token) return null;

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedUser;
//     // console.log("decoded", decoded);
//     return decoded;
//   } catch (err) {
//     console.error(err)
//     return null;
//   }
// }
// src/lib/otpStore.ts
import NodeCache from 'node-cache';

const otpCache = new NodeCache({ stdTTL: 600 }); // 10 minutes TTL

export function saveOtp(email: string, otp: string) {
  otpCache.set(email, otp); // Automatically expires in 10 minutes
}

export function verifyOtp(email: string, otp: string): boolean {
  const storedOtp = otpCache.get<string>(email);
  if (!storedOtp) return false;

  const isValid = storedOtp === otp;
  if (isValid) otpCache.del(email); // Consume OTP after use
  return isValid;
}
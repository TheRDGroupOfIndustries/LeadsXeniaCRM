import prisma from "@/lib/prisma";

// 🔹 Check if OTP is expired
export function isOtpExpired(expiresAt: Date) {
  return new Date() > expiresAt;
}

// 🔹 Delete all expired OTPs
// export async function deleteExpiredOtps() {
//   const now = new Date();
//   const deleted = await prisma.orderOtp.deleteMany({
//     where: { expiresAt: { lt: now } },
//   });
//   if (deleted.count > 0)
//     console.log(`🧹 Deleted ${deleted.count} expired OTP(s)`);
// }
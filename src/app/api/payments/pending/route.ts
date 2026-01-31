import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check for pending bank transfer payment
        const pendingPayment = await prisma.payment.findFirst({
            where: {
                userId: session.user.id,
                paymentMethod: "BANK_TRANSFER",
                status: "PENDING"
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        if (pendingPayment) {
            // Parse notes to get payment details
            let paymentDetails = {};
            try {
                paymentDetails = JSON.parse(pendingPayment.notes || "{}");
            } catch (e) {
                // Ignore parse errors
            }

            return NextResponse.json({
                success: true,
                hasPendingPayment: true,
                payment: {
                    orderId: pendingPayment.orderId,
                    amount: pendingPayment.amount,
                    createdAt: pendingPayment.createdAt,
                    ...paymentDetails
                }
            });
        }

        return NextResponse.json({
            success: true,
            hasPendingPayment: false
        });

    } catch (error: any) {
        console.error("Pending payment check error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to check pending payment" },
            { status: 500 }
        );
    }
}

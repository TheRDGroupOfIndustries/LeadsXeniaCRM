"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CreditCard, Building2, X } from "lucide-react";
import RazorpayPayment from "@/components/ui/RazorpayPayment";
import BankTransferPayment from "@/components/ui/BankTransferPayment";

interface PaymentMethodSelectorProps {
  description?: string;
  buttonText?: string;
}

export default function PaymentMethodSelector({
  description = "Upgrade to XeniaCRM CRM Premium",
  buttonText = "Pay & Activate Premium"
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<"razorpay" | "bank" | null>(null);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);

  // Check if user already has a pending bank transfer payment
  useEffect(() => {
    const checkPendingPayment = async () => {
      try {
        const res = await fetch("/api/payments/pending");
        const data = await res.json();
        if (data.success && data.hasPendingPayment) {
          setHasPendingPayment(true);
          setSelectedMethod("bank"); // Show the bank transfer view which will show confirmation
        }
      } catch (error) {
        console.error("Failed to check pending payment:", error);
      }
    };
    checkPendingPayment();
  }, []);

  // For Razorpay, always show back button
  if (selectedMethod === "razorpay") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedMethod(null)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to payment options
        </Button>
        <RazorpayPayment description={description} buttonText={buttonText} />
      </div>
    );
  }

  // For bank transfer - hide back button if already has pending payment or after submission
  if (selectedMethod === "bank") {
    return (
      <div className="space-y-4">
        {/* Only show back button if user hasn't submitted a payment yet */}
        {!hasPendingPayment && (
          <Button
            variant="ghost"
            onClick={() => setSelectedMethod(null)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to payment options
          </Button>
        )}
        <BankTransferPayment
          description={description}
          onClose={() => {
            // When payment is submitted, hide the back button
            setHasPendingPayment(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-center text-foreground mb-4">
        Choose Payment Method
      </h3>

      {/* Razorpay Option */}
      <Card
        className="bg-card/50 border-border hover:border-green-500/50 cursor-pointer transition-all duration-200 hover:shadow-lg"
        onClick={() => setSelectedMethod("razorpay")}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">Pay with Razorpay</h4>
              <p className="text-sm text-muted-foreground">Card, UPI, Net Banking, Wallets</p>
            </div>
            <div className="text-green-400">
              <Shield className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Transfer Option */}
      <Card
        className="bg-card/50 border-border hover:border-blue-500/50 cursor-pointer transition-all duration-200 hover:shadow-lg"
        onClick={() => setSelectedMethod("bank")}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">Bank Transfer / UPI</h4>
              <p className="text-sm text-muted-foreground">Direct bank transfer or scan QR</p>
            </div>
            <div className="text-blue-400">
              <Shield className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground mt-4">
        All payments are secure and encrypted
      </p>
    </div>
  );
}

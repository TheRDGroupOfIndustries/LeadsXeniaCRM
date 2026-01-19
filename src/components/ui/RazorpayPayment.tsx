"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, CheckCircle, XCircle } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentProps {
  buttonText?: string;
  amount?: number;
  description?: string;
}

export default function RazorpayPayment({ 
  buttonText = "Pay Now", 
  amount: defaultAmount,
  description = "Payment for XeniaCRM CRM"
}: RazorpayPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(defaultAmount || 100);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "failed">("idle");
  const router = useRouter();
  const { data: session, update } = useSession();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setPaymentStatus("idle");

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay script");
      }

      // Create order on backend
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          currency: "INR",
          notes: {
            description,
          },
        }),
      });

      console.log("Order response status:", orderResponse.status);
      const orderData = await orderResponse.json();
      console.log("Order data:", orderData);

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // Check if we have the required environment variable
      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        throw new Error("Razorpay key not configured");
      }

      console.log("Using Razorpay key:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "XeniaCRM CRM",
        description: description,
        order_id: orderData.orderId, // Make sure this matches API response
        image: "/logo.png", // Add your logo here
        handler: async function (response: any) {
          try {
            console.log("Payment response:", response);
            // Verify payment on backend
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: orderData.paymentId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setPaymentStatus("success");
              // Refresh session and verify via server-side user API; poll until the subscription is refreshed
              try {
                await update(); // Ask next-auth to refresh session
              } catch (err) {
                console.warn("Session update failed:", err);
              }

              // Attempt to directly confirm subscription on the server, using session userId
              const userId = session?.user?.id;
              if (userId) {
                const checkSubscription = async () => {
                  try {
                    const res = await fetch(`/api/auth/user/${userId}`);
                    if (!res.ok) return null;
                    const data = await res.json();
                    return data.subscription || null;
                  } catch (err) {
                    console.warn('Failed to fetch subscription from server:', err);
                    return null;
                  }
                };

                let attempts = 0;
                let currentSub = await checkSubscription();
                while (attempts < 10 && currentSub !== 'PREMIUM') {
                  await new Promise((r) => setTimeout(r, 500));
                  currentSub = await checkSubscription();
                  attempts++;
                }
                console.debug('Subscription status after payment:', currentSub);
              }

              // Now force a full reload so Layout re-reads session/subscription and renders the full nav
              window.location.href = '/dashboard';
            } else {
              throw new Error(verifyData.error || "Payment verification failed");
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            setPaymentStatus("failed");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: {
          address: "XeniaCRM CRM Office",
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: function() {
            console.log("Payment modal dismissed");
            setLoading(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error: any) {
      console.error("Payment error:", error);
      setPaymentStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <CreditCard className="h-5 w-5" />
          Payment
        </CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentStatus === "idle" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                disabled={loading}
                className="bg-background text-foreground border-border placeholder:text-muted-foreground"
              />
            </div>
            
            <Button 
              onClick={handlePayment} 
              disabled={loading || !amount || amount <= 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {buttonText} ₹{amount}
                </>
              )}
            </Button>
            
            <div className="text-xs text-muted-foreground text-center">
              Powered by Razorpay • Secure Payment Gateway
            </div>
          </>
        )}

        {paymentStatus === "success" && (
          <div className="text-center space-y-3 py-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-600">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground">Your payment of ₹{amount} has been processed.</p>
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>Reload</Button>
            </div>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="text-center space-y-3 py-4">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-600">Payment Failed</h3>
              <p className="text-sm text-muted-foreground">There was an issue processing your payment. Please try again.</p>
            </div>
            <Button 
              onClick={() => {
                setPaymentStatus("idle");
                setLoading(false);
              }} 
              variant="outline"
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
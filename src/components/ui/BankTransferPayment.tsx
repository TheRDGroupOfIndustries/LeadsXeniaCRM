"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Building2,
  Copy,
  CheckCircle,
  Upload,
  X,
  QrCode,
  Clock,
  Sparkles,
  Mail
} from "lucide-react";
import toast from "react-hot-toast";

interface BankTransferPaymentProps {
  amount?: number;
  description?: string;
  onClose?: () => void;
}

// Bank details for manual transfer
const BANK_DETAILS = {
  bankName: "Punjab National Bank (PNB)",
  accountHolder: "Ankit Pandey",
  accountNumber: "4972002100005820",
  ifscCode: "PUNB0497200",
  upiId: "ankitpandey@pnb"
};

export default function BankTransferPayment({
  amount = 100,
  description = "Payment for XeniaCRM Premium",
  onClose
}: BankTransferPaymentProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    screenshot: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, screenshot: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.screenshot) {
      toast.error("Please upload a payment screenshot");
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("amount", String(amount));
      submitData.append("description", description);
      submitData.append("userId", session?.user?.id || "");
      if (formData.screenshot) {
        submitData.append("screenshot", formData.screenshot);
      }

      // Submit to API
      const response = await fetch("/api/payments/bank-transfer", {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        toast.success("Payment submitted for verification!");
        // Notify parent that payment was submitted (to hide back button)
        if (onClose) onClose();
      } else {
        throw new Error(data.error || "Failed to submit payment");
      }
    } catch (error: any) {
      console.error("Bank transfer submission error:", error);
      toast.error(error.message || "Failed to submit payment");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          {/* Animated Success Icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Payment Submitted Successfully!
            </h2>
            <p className="text-emerald-400 font-medium">
              Your payment is under review
            </p>
          </div>

          {/* Message Card */}
          <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-center gap-2 text-blue-400">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Estimated verification time: 24 hours</span>
            </div>

            <p className="text-zinc-300 text-sm leading-relaxed">
              Our team at <span className="text-white font-semibold">LeadsXenia</span> is reviewing your payment.
              You'll receive a confirmation email once your premium subscription is activated.
            </p>
          </div>

          {/* What Happens Next */}
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5 text-left">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              What happens next?
            </h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <span>Our team verifies your payment screenshot</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <span>Your account is upgraded to Premium</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <span>You receive a confirmation email with details</span>
              </li>
            </ul>
          </div>

          {/* Info Message - No navigation allowed */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
            <p className="text-blue-400 text-sm">
              🔒 You'll be able to access your dashboard once your payment is verified.
            </p>
            <p className="text-zinc-500 text-xs mt-2">
              Need help? Email us at{" "}
              <a href="mailto:support@leadsxenia.com" className="text-blue-400 hover:underline">
                support@leadsxenia.com
              </a>
            </p>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-zinc-500">
            Payment ID will be sent to your email for reference
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-lg text-foreground">Bank Transfer</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription className="text-muted-foreground">
          Transfer ₹{amount} using the details below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bank Details */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Bank Name:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{BANK_DETAILS.bankName}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(BANK_DETAILS.bankName, "bank")}
              >
                {copiedField === "bank" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Account Holder:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{BANK_DETAILS.accountHolder}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(BANK_DETAILS.accountHolder, "holder")}
              >
                {copiedField === "holder" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Account Number:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground font-mono">{BANK_DETAILS.accountNumber}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, "account")}
              >
                {copiedField === "account" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">IFSC Code:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground font-mono">{BANK_DETAILS.ifscCode}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(BANK_DETAILS.ifscCode, "ifsc")}
              >
                {copiedField === "ifsc" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">Scan & Pay</p>
          <div className="inline-block p-4 bg-white rounded-xl">
            {/* Add your UPI QR code image at: /public/images/upi-qr.png */}
            <img
              src="/images/upi-qr.png"
              alt="UPI QR Code"
              className="w-32 h-32 object-contain"
              onError={(e) => {
                // Fallback to QR icon if image not found
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg></div>';
              }}
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Your Name</Label>
            <Input
              id="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-white text-black border-border placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Your Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-white text-black border-border placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Upload Payment Screenshot</Label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="screenshot-upload"
              />
              <label
                htmlFor="screenshot-upload"
                className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-white text-black"
              >
                {previewUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={previewUrl} alt="Preview" className="h-12 w-12 object-cover rounded" />
                    <span className="text-sm">Change file</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-500">Choose File</span>
                    <span className="text-sm text-gray-400">No file chosen</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Payment"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

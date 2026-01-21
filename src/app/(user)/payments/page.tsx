import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import RazorpayPayment from "@/components/ui/RazorpayPayment";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Shield, Zap, Users, Crown } from "lucide-react";
import AdminSubscriptionPanel from "@/components/AdminSubscriptionPanel";

export default async function PaymentPage() {
  // Server-side: get session and user
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Unauthorized</h1>
        <p className="mt-2 text-muted-foreground">Please sign in to access payments.</p>
      </div>
    );
  }

  const userId = session.user.id as string;
  const userRole = session.user.role as string;

  // Prefer subscription from session token to avoid DB lookups.
  const sessionSubscription = (session.user as any).subscription as string | undefined;

  // Fetch user subscription status (fallback to DB only if session is missing it)
  let isPremium = sessionSubscription === 'PREMIUM';

  if (sessionSubscription === undefined) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true } });
      isPremium = user?.subscription === 'PREMIUM';
    } catch {
      // DB might be temporarily unreachable; treat as non-premium without crashing.
      isPremium = false;
    }
  }

  // For admin users, show admin panel
  if (userRole === "ADMIN") {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl p-8">
          {/* Admin Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-500/20 border border-red-400/30 px-4 py-2">
              <Crown className="h-5 w-5 text-red-400" />
              <span className="font-medium text-red-300">Admin Panel</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-3 text-white">
              Subscription Management
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
              Manage user subscriptions and view payment analytics across your organization.
            </p>
          </div>

          {/* Admin Subscription Management Component */}
          <AdminSubscriptionPanel />
        </div>
      </div>
    );
  }

  // Payments UI only for EMPLOYEE role
  if (userRole !== "EMPLOYEE") {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Not available</h1>
        <p className="mt-2 text-muted-foreground">Payments are only available to employees.</p>
        <div className="mt-4">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl p-8">
        {/* Premium Active Hero Section */}
        {isPremium && (
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-black/90 border border-emerald-500/20">

            <div className="relative z-10 p-8 text-center">
              <div className="mb-4 inline-flex items-center gap-3 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-6 py-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="font-medium text-emerald-300">Premium Activated</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-3 text-white">
                Welcome to Premium Experience
              </h1>
              <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
                You now have access to all premium features including unlimited campaigns, advanced analytics, and priority support.
              </p>
              <Link href="/dashboard">
                <Button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg transition-all duration-300">
                  <Zap className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Hero - Only show for non-premium users */}
        {!isPremium && (
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-black/90 border border-blue-500/20">

            <div className="relative z-10 p-8">
              <div className="text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/20 border border-blue-400/30 px-4 py-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-blue-300">Premium Upgrade</span>
                </div>
                <h1 className="text-5xl font-bold tracking-tight mb-3 text-white">
                  Unlock Premium
                </h1>
                <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                  Transform your CRM experience with advanced automation, deep analytics, and priority support.
                </p>
              </div>
              
              {/* Feature highlights */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <CheckCircle className="h-6 w-6 text-emerald-400 mb-3" />
                  <div className="font-medium text-white mb-1">Automation Suite</div>
                  <div className="text-sm text-gray-400">Bulk messaging, smart follow-ups</div>
                </div>
                
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <Zap className="h-6 w-6 text-yellow-400 mb-3" />
                  <div className="font-medium text-white mb-1">Real-time Insights</div>
                  <div className="text-sm text-gray-400">Conversion metrics & dashboards</div>
                </div>
                
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <Shield className="h-6 w-6 text-blue-400 mb-3" />
                  <div className="font-medium text-white mb-1">Priority Support</div>
                  <div className="text-sm text-gray-400">Fast help when you need it</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid gap-8 lg:grid-cols-2">
          
          {/* Left Column - Payment/Status */}
          <div>
            {!isPremium ? (
              <Card className="bg-black/80 border border-white/10 shadow-2xl">
                <CardHeader className="text-center pb-6">
                  <div className="mb-4 mx-auto w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">
                    Complete Your Upgrade
                  </CardTitle>
                  <CardDescription className="text-gray-300 mt-2">
                    Secure payment with Razorpay • Instant activation
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                  <div className="bg-black/60 rounded-xl p-6 border border-white/10">
                    <RazorpayPayment description="Upgrade to XeniaCRM CRM Premium" buttonText="Pay & Activate Premium" />
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Shield className="h-4 w-4" />
                    <span>SSL encrypted • PCI DSS compliant</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/80 border border-emerald-500/20">
                <CardHeader className="text-center pb-6">
                  <div className="mb-4 mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">Premium Active</CardTitle>
                  <CardDescription className="text-emerald-100 mt-2">
                    You're all set—enjoy unlimited access
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20 mb-6">
                    <div className="flex items-center justify-center gap-3 text-emerald-300 mb-2">
                      <CheckCircle className="h-6 w-6" />
                      <span className="text-lg font-medium">Subscription: PREMIUM</span>
                    </div>
                    <div className="text-emerald-200 text-sm">Active • Unlimited access</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-lg p-3 text-center border border-white/20">
                      <div className="text-xl font-bold text-white">∞</div>
                      <div className="text-xs text-gray-300">Campaigns</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-center border border-white/20">
                      <div className="text-xl font-bold text-white">24/7</div>
                      <div className="text-xs text-gray-300">Support</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Benefits */}
          <div>
            <Card className="bg-black/80 border border-white/10 h-full">
              <CardHeader className="pb-6">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 border border-purple-400/30 px-4 py-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <span className="text-purple-300 font-medium">Premium Features</span>
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-center text-white">
                  What's Included
                </CardTitle>
                <CardDescription className="text-gray-300 text-center mt-2">
                  Everything you need to supercharge your CRM
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <div className="space-y-6">
                  
                  {/* Unlimited Campaigns */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="rounded-lg bg-emerald-500/20 border border-emerald-400/30 p-2">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 text-white">Unlimited Campaigns</h3>
                      <p className="text-gray-400 text-sm mb-2">Create unlimited messaging campaigns with advanced scheduling and templates</p>
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        <span>No limits • Advanced templates • Smart scheduling</span>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Analytics */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="rounded-lg bg-blue-500/20 border border-blue-400/30 p-2">
                      <Zap className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 text-white">Advanced Analytics</h3>
                      <p className="text-gray-400 text-sm mb-2">Deep lead tracking, conversion metrics, and performance dashboards</p>
                      <div className="flex items-center gap-2 text-xs text-blue-400">
                        <Zap className="h-3 w-3" />
                        <span>Real-time data • Custom reports • Insights</span>
                      </div>
                    </div>
                  </div>

                  {/* Priority Support */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="rounded-lg bg-purple-500/20 border border-purple-400/30 p-2">
                      <Shield className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 text-white">Priority Support</h3>
                      <p className="text-gray-400 text-sm mb-2">Get priority help, faster issue resolution, and dedicated support</p>
                      <div className="flex items-center gap-2 text-xs text-purple-400">
                        <Shield className="h-3 w-3" />
                        <span>24/7 support • Dedicated agent • Fast response</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Security Badge */}
                <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-center gap-3 text-gray-400">
                    <Shield className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Secure payment by Razorpay • SSL encrypted • No card details stored</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
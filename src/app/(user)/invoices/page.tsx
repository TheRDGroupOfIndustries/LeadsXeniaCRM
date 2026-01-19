"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  AlertCircle,
  Eye,
  RefreshCw,
  ShoppingCart,
  Hash,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  receipt?: string;
  paymentMethod?: string;
  paidAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  User?: {
    id: string;
    name: string;
    email: string;
    subscription?: string;
  };
}

export default function InvoicePage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch payments
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch("/api/payments");
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments || []);
        }
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchPayments();
    }
  }, [session]);

  // Calculate stats
  const stats = {
    total: payments.length,
    completed: payments.filter((p) => p.status === "COMPLETED").length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    failed: payments.filter((p) => p.status === "FAILED").length,
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.razorpayPaymentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.User?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.User?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const calculateGST = (amount: number) => {
    return Math.round(amount * 0.06);
  };

  const getBasePrice = (amount: number) => {
    return amount - calculateGST(amount);
  };

  const getExpiryDate = (paidAt: string | undefined, createdAt: string) => {
    const baseDate = paidAt ? new Date(paidAt) : new Date(createdAt);
    const expiryDate = new Date(baseDate);
    expiryDate.setDate(expiryDate.getDate() + 30);
    return formatDate(expiryDate.toISOString());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
            {status}
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (method: string | undefined) => {
    const methodName = method?.toLowerCase() || "razorpay";
    if (methodName.includes("upi")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
          <CreditCard className="w-3 h-3" />
          Upi
        </span>
      );
    }
    if (methodName.includes("netbanking")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          <CreditCard className="w-3 h-3" />
          Netbanking
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
        <CreditCard className="w-3 h-3" />
        Upi
      </span>
    );
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  const handleDownloadInvoice = (payment: Payment) => {
    const basePrice = getBasePrice(Number(payment.amount));
    const gst = calculateGST(Number(payment.amount));
    
    const invoiceContent = `
INVOICE
═══════════════════════════════════════════════════════════════

Invoice Number: INV-${payment.orderId.slice(0, 12).toUpperCase()}
Date: ${formatDate(payment.createdAt)}

CUSTOMER DETAILS
───────────────────────────────────────────────────────────────
Name: ${payment.User?.name || session?.user?.name || "N/A"}
Email: ${payment.User?.email || session?.user?.email || "N/A"}

ORDER DETAILS
───────────────────────────────────────────────────────────────
Description                              Amount
───────────────────────────────────────────────────────────────
Premium Subscription (PLUS)              ₹${basePrice}
GST (6%)                                 ₹${gst}
───────────────────────────────────────────────────────────────
TOTAL                                    ₹${payment.amount}

PAYMENT INFORMATION
───────────────────────────────────────────────────────────────
Status: ${payment.status}
Method: ${payment.paymentMethod || "Razorpay"}
Transaction ID: ${payment.razorpayPaymentId || "N/A"}
Subscription Expiry: ${getExpiryDate(payment.paidAt, payment.createdAt)}

═══════════════════════════════════════════════════════════════
                    Thank you for your business!
                         XeniaCRM CRM
    `.trim();

    const blob = new Blob([invoiceContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${payment.orderId.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-card border-border p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-gray-400">Please sign in to view your invoices.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Subscription</h1>
          <p className="text-gray-400 mt-1">Manage your subscription</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-sm text-gray-400 mt-1">Total Orders</p>
                  <p className="text-xs text-gray-500">All subscription orders placed</p>
                </div>
                <ShoppingCart className="w-6 h-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{stats.completed}</p>
                  <p className="text-sm text-gray-400 mt-1">Completed Orders</p>
                  <p className="text-xs text-gray-500">Successfully processed</p>
                </div>
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{stats.pending}</p>
                  <p className="text-sm text-gray-400 mt-1">Pending Orders</p>
                  <p className="text-xs text-gray-500">Awaiting confirmation</p>
                </div>
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{stats.failed}</p>
                  <p className="text-sm text-gray-400 mt-1">Failed Orders</p>
                  <p className="text-xs text-gray-500">Failed to process</p>
                </div>
                <XCircle className="w-6 h-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-card border-border text-white placeholder:text-gray-500"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-card border-border text-white">
              <SelectValue placeholder="Subscription Status" />
            </SelectTrigger>
            <SelectContent className="bg-black border-gray-700">
              <SelectItem value="all">Subscription Status</SelectItem>
              <SelectItem value="COMPLETED">Confirmed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-border text-gray-400">
            <Filter className="w-4 h-4 mr-2" />
            View
          </Button>
        </div>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-white text-base">
              Total Item: {filteredPayments.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No invoices found</h3>
                <p className="text-gray-400">
                  {payments.length === 0 ? "No payments yet." : "No matching results."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1400px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Name</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Price</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Paid</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">GST</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">User Name</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">User Email</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Order ID</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Subscription Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Payment</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Expires</th>
                      <th className="text-right p-4 text-sm font-medium text-gray-400"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-border hover:bg-secondary/30">
                        <td className="p-4">
                          <span className="text-white font-medium">PLUS</span>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-400">—</span>
                        </td>
                        <td className="p-4">
                          <span className="text-green-400">₹ {payment.amount}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-white">6%</span>
                        </td>
                        <td className="p-4">
                          <span className="text-white">{payment.User?.name || session?.user?.name || "N/A"}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-400">{payment.User?.email || session?.user?.email || "N/A"}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-400 font-mono text-sm flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {payment.orderId.slice(0, 22)}
                          </span>
                        </td>
                        <td className="p-4">{getStatusBadge(payment.status)}</td>
                        <td className="p-4">{getPaymentMethodBadge(payment.paymentMethod)}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-600 text-sm text-white">
                            <Calendar className="w-4 h-4" />
                            {payment.status === "COMPLETED" ? getExpiryDate(payment.paidAt, payment.createdAt) : "-"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 hover:text-white h-8 w-8 p-0"
                              onClick={() => handleViewDetails(payment)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {payment.status === "COMPLETED" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:text-white h-8 w-8 p-0"
                                onClick={() => handleDownloadInvoice(payment)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-gray-400">Selected - 0 of {filteredPayments.length}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Page 1 of 1</span>
              <Select defaultValue="10">
                <SelectTrigger className="w-16 bg-card border-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-gray-700">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="bg-zinc-900 border border-gray-700 max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-4">
                {getStatusBadge(selectedPayment?.status || "")}
                {getPaymentMethodBadge(selectedPayment?.paymentMethod)}
              </div>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-6">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">👤 User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">User Name</p>
                      <p className="text-white">{selectedPayment.User?.name || session?.user?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-white">{selectedPayment.User?.email || session?.user?.email}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Hash className="w-4 h-4" /> Order Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Order ID</p>
                        <p className="text-white font-mono text-sm">{selectedPayment.orderId}</p>
                      </div>
                      {getStatusBadge(selectedPayment.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Payment Method</p>
                        <p className="text-white">{selectedPayment.paymentMethod || "upi"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Subscription Expiry</p>
                        <p className="text-white flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {selectedPayment.status === "COMPLETED" ? getExpiryDate(selectedPayment.paidAt, selectedPayment.createdAt) : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Pricing Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Base Price</p>
                        <p className="text-white">₹{getBasePrice(Number(selectedPayment.amount))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Amount Paid</p>
                        <p className="text-green-400">₹{selectedPayment.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">GST (6%)</p>
                        <p className="text-white">₹{calculateGST(Number(selectedPayment.amount))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cross Price</p>
                        <p className="text-white">₹500</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <Button variant="outline" className="flex-1 border-gray-600" onClick={() => setShowDetails(false)}>
                    Close
                  </Button>
                  {selectedPayment.status === "COMPLETED" && (
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => handleDownloadInvoice(selectedPayment)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

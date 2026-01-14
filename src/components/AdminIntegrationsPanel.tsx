"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import { MessageSquare, AlertCircle, CheckCircle2, Copy, Eye, EyeOff } from "lucide-react";

export default function IntegrationsPanel() {
  // WhatsApp Business API state
  const [whatsappData, setWhatsappData] = useState({
    phoneNumberId: "",
    accessToken: "",
    pin: "",
    certificate: "",
    displayName: "",
  });

  // Twilio state
  const [twilioData, setTwilioData] = useState({
    accountSid: "",
    authToken: "",
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [registrationStatus, setRegistrationStatus] = useState<any>(null);

  // Quick save WhatsApp Business API token (without full registration)
  const handleQuickSaveWhatsApp = async () => {
    if (!whatsappData.phoneNumberId || !whatsappData.accessToken) {
      toast.error("Please enter both Phone Number ID and Access Token");
      return;
    }

    setLoading(true);
    try {
      const saveResponse = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: whatsappData.accessToken,
          secret: whatsappData.phoneNumberId,
          provider: "whatsapp-business-api",
        }),
        credentials: "include",
      });

      if (saveResponse.ok) {
        toast.success("✅ WhatsApp credentials saved successfully!");
        setRegistrationStatus({
          type: "whatsapp-quick",
          success: true,
          phoneNumberId: whatsappData.phoneNumberId,
          timestamp: new Date().toLocaleString(),
        });
      } else {
        throw new Error("Failed to save credentials");
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      setRegistrationStatus({
        type: "whatsapp-quick",
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestWhatsAppConnection = async () => {
    if (!whatsappData.phoneNumberId || !whatsappData.accessToken) {
      toast.error("Please enter both Phone Number ID and Access Token");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/integrations/whatsapp-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: whatsappData.accessToken,
          phoneNumberId: whatsappData.phoneNumberId,
        }),
        credentials: "include",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const msg =
          data?.details?.phoneNumberCheck?.error?.error?.message ||
          data?.details?.tokenCheck?.error?.error?.message ||
          data?.error ||
          "WhatsApp connection test failed";
        throw new Error(msg);
      }

      toast.success("✅ WhatsApp connection verified (token + phone number ID match)");
    } catch (error: any) {
      toast.error(error.message || "WhatsApp connection test failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClearWhatsAppToken = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/token", {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to clear token");
      }

      toast.success("🧹 Cleared saved WhatsApp token");
      setRegistrationStatus(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to clear token");
    } finally {
      setLoading(false);
    }
  };

  // Handle WhatsApp certificate file upload
  const handleCertificateUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setWhatsappData((prev) => ({ ...prev, certificate: content }));
        toast.success("Certificate loaded successfully");
      };
      reader.readAsText(file);
    } catch (error) {
      toast.error("Failed to read certificate file");
    }
  };

  // Register WhatsApp phone number
  const handleWhatsAppRegistration = async () => {
    if (
      !whatsappData.phoneNumberId ||
      !whatsappData.accessToken ||
      !whatsappData.pin ||
      !whatsappData.certificate
    ) {
      toast.error("Please fill in all WhatsApp fields");
      return;
    }

    if (!/^\d{6}$/.test(whatsappData.pin)) {
      toast.error("PIN must be exactly 6 digits");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/integrations/whatsapp-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(whatsappData),
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("✅ WhatsApp phone number registered successfully!");
        setRegistrationStatus({
          type: "whatsapp",
          success: true,
          phoneNumberId: whatsappData.phoneNumberId,
          timestamp: new Date().toLocaleString(),
        });
        // Clear sensitive data after successful registration
        setWhatsappData((prev) => ({
          ...prev,
          certificate: "",
          pin: "",
          accessToken: "",
        }));
      } else {
        toast.error(`❌ Registration failed: ${result.error || "Unknown error"}`);
        setRegistrationStatus({
          type: "whatsapp",
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      setRegistrationStatus({
        type: "whatsapp",
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Test Twilio connection
  const handleTwilioTest = async () => {
    if (!twilioData.accountSid || !twilioData.authToken || !twilioData.phoneNumber) {
      toast.error("Please fill in all Twilio fields");
      return;
    }

    setLoading(true);
    try {
      // Validate Twilio credentials by checking account info
      const auth = Buffer.from(
        `${twilioData.accountSid}:${twilioData.authToken}`
      ).toString("base64");

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioData.accountSid}.json`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (response.ok) {
        // Save to database/env if valid
        const saveResponse = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: twilioData.accountSid,
            secret: twilioData.authToken,
            phoneNumber: twilioData.phoneNumber,
            provider: "twilio",
          }),
          credentials: "include",
        });

        if (saveResponse.ok) {
          toast.success("✅ Twilio credentials saved successfully!");
          setRegistrationStatus({
            type: "twilio",
            success: true,
            timestamp: new Date().toLocaleString(),
          });
          // Clear sensitive data
          setTwilioData((prev) => ({
            ...prev,
            authToken: "",
          }));
        } else {
          throw new Error("Failed to save credentials");
        }
      } else {
        toast.error("❌ Invalid Twilio credentials");
        setRegistrationStatus({
          type: "twilio",
          success: false,
          error: "Invalid credentials",
        });
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      setRegistrationStatus({
        type: "twilio",
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Messaging Integrations</h2>
          <p className="text-muted-foreground">
            Configure WhatsApp Business API and Twilio
          </p>
        </div>
      </div>

      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="whatsapp">WhatsApp Business API</TabsTrigger>
          <TabsTrigger value="twilio">Twilio WhatsApp</TabsTrigger>
        </TabsList>

        {/* WhatsApp Business API Tab */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business API Registration</CardTitle>
              <CardDescription>
                Register your WhatsApp phone number using your downloaded certificate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">Prerequisites:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>WhatsApp Display Name must be "Approved" in WhatsApp Manager</li>
                      <li>6-digit Two-Step Verification PIN must be enabled</li>
                      <li>Certificate is valid for 14 days after approval</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Phone Number ID */}
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number ID</label>
                <Input
                  placeholder="e.g., 120241234567890"
                  value={whatsappData.phoneNumberId}
                  onChange={(e) =>
                    setWhatsappData((prev) => ({
                      ...prev,
                      phoneNumberId: e.target.value,
                    }))
                  }
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find in WhatsApp Manager → Phone Numbers → Phone Number ID
                </p>
              </div>

              {/* Access Token */}
              <div>
                <label className="block text-sm font-medium mb-2">Access Token</label>
                <div className="flex gap-2">
                  <Input
                    type={showSecrets["whatsapp_token"] ? "text" : "password"}
                    placeholder="EAAHs..."
                    value={whatsappData.accessToken}
                    onChange={(e) =>
                      setWhatsappData((prev) => ({
                        ...prev,
                        accessToken: e.target.value,
                      }))
                    }
                    disabled={loading}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setShowSecrets((prev) => ({
                        ...prev,
                        whatsapp_token: !prev.whatsapp_token,
                      }))
                    }
                  >
                    {showSecrets["whatsapp_token"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From Meta for Developers → Your App → Tokens
                </p>
              </div>

              {/* Quick Connect Button */}
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-700 dark:text-green-300 mb-2">
                      Quick Connect (Recommended)
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                      Just save your Access Token and Phone Number ID to start sending messages.
                      No certificate or PIN required for testing.
                    </p>
                    <Button
                      onClick={handleQuickSaveWhatsApp}
                      disabled={loading || !whatsappData.phoneNumberId || !whatsappData.accessToken}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? "Saving..." : "💾 Quick Save & Connect"}
                    </Button>

                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        onClick={handleTestWhatsAppConnection}
                        disabled={loading || !whatsappData.phoneNumberId || !whatsappData.accessToken}
                      >
                        Test Connection
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleClearWhatsAppToken}
                        disabled={loading}
                      >
                        Clear Saved Token
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Connect Status */}
              {registrationStatus?.type === "whatsapp-quick" && (
                <div
                  className={`rounded-lg p-4 flex gap-3 ${
                    registrationStatus.success
                      ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                  }`}
                >
                  {registrationStatus.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  <div className="text-sm">
                    {registrationStatus.success ? (
                      <>
                        <p className="font-semibold text-green-700 dark:text-green-300">
                          ✅ WhatsApp Connected!
                        </p>
                        <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                          Phone ID: {registrationStatus.phoneNumberId} | Saved at {registrationStatus.timestamp}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-red-700 dark:text-red-300">
                          Connection Failed
                        </p>
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                          {registrationStatus.error}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  — OR use Full Registration below (for production) —
                </p>
              </div>

              {/* PIN */}
              <div>
                <label className="block text-sm font-medium mb-2">6-Digit PIN</label>
                <Input
                  type="password"
                  placeholder="123456"
                  maxLength={6}
                  value={whatsappData.pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setWhatsappData((prev) => ({ ...prev, pin: value }));
                  }}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  From WhatsApp Manager → Settings → Two-Step Verification
                </p>
              </div>

              {/* Certificate Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Certificate</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept=".txt,.pem,.cer,.crt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCertificateUpload(file);
                    }}
                    disabled={loading}
                    className="hidden"
                    id="cert-upload"
                  />
                  <label
                    htmlFor="cert-upload"
                    className="cursor-pointer"
                  >
                    <div className="text-sm">
                      {whatsappData.certificate
                        ? "✅ Certificate loaded"
                        : "Drag and drop or click to upload certificate file"}
                    </div>
                    {whatsappData.certificate && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {whatsappData.certificate.substring(0, 50)}...
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Downloaded from WhatsApp Manager → Phone Numbers
                </p>
              </div>

              {/* Display Name (optional) */}
              <div>
                <label className="block text-sm font-medium mb-2">Display Name (Optional)</label>
                <Input
                  placeholder="Your Business Name"
                  value={whatsappData.displayName}
                  onChange={(e) =>
                    setWhatsappData((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  disabled={loading}
                />
              </div>

              {/* Status */}
              {registrationStatus?.type === "whatsapp" && (
                <div
                  className={`rounded-lg p-4 flex gap-3 ${
                    registrationStatus.success
                      ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                  }`}
                >
                  {registrationStatus.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  <div className="text-sm">
                    {registrationStatus.success ? (
                      <>
                        <p className="font-semibold text-green-700 dark:text-green-300">
                          Registration Successful
                        </p>
                        <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                          Phone: {registrationStatus.phoneNumberId} at {registrationStatus.timestamp}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-red-700 dark:text-red-300">
                          Registration Failed
                        </p>
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                          {registrationStatus.error}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Register Button */}
              <Button
                onClick={handleWhatsAppRegistration}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Registering..." : "Register Phone Number"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Twilio Tab */}
        <TabsContent value="twilio">
          <Card>
            <CardHeader>
              <CardTitle>Twilio WhatsApp Configuration</CardTitle>
              <CardDescription>
                Connect your Twilio account for WhatsApp messaging
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">Setup Steps:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Sign up at twilio.com and get your Account SID & Auth Token</li>
                      <li>Join WhatsApp Sandbox or connect production number</li>
                      <li>Enter your Twilio WhatsApp number (e.g., +14155238886)</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Account SID */}
              <div>
                <label className="block text-sm font-medium mb-2">Account SID</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={twilioData.accountSid}
                    onChange={(e) =>
                      setTwilioData((prev) => ({
                        ...prev,
                        accountSid: e.target.value,
                      }))
                    }
                    disabled={loading}
                  />
                  {twilioData.accountSid && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(twilioData.accountSid)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Find at: console.twilio.com → Dashboard
                </p>
              </div>

              {/* Auth Token */}
              <div>
                <label className="block text-sm font-medium mb-2">Auth Token</label>
                <div className="flex gap-2">
                  <Input
                    type={showSecrets["twilio_token"] ? "text" : "password"}
                    placeholder="Your auth token"
                    value={twilioData.authToken}
                    onChange={(e) =>
                      setTwilioData((prev) => ({
                        ...prev,
                        authToken: e.target.value,
                      }))
                    }
                    disabled={loading}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setShowSecrets((prev) => ({
                        ...prev,
                        twilio_token: !prev.twilio_token,
                      }))
                    }
                  >
                    {showSecrets["twilio_token"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Click "Show" on the dashboard to reveal
                </p>
              </div>

              {/* WhatsApp Number */}
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp Number</label>
                <Input
                  placeholder="+14155238886"
                  value={twilioData.phoneNumber}
                  onChange={(e) =>
                    setTwilioData((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sandbox: +14155238886 | Production: Your approved number
                </p>
              </div>

              {/* Status */}
              {registrationStatus?.type === "twilio" && (
                <div
                  className={`rounded-lg p-4 flex gap-3 ${
                    registrationStatus.success
                      ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                  }`}
                >
                  {registrationStatus.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  <div className="text-sm">
                    {registrationStatus.success ? (
                      <>
                        <p className="font-semibold text-green-700 dark:text-green-300">
                          Configuration Saved
                        </p>
                        <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                          Configured at {registrationStatus.timestamp}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-red-700 dark:text-red-300">
                          Configuration Failed
                        </p>
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                          {registrationStatus.error}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <Button
                onClick={handleTwilioTest}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Validating..." : "Save & Validate Credentials"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Resources</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>WhatsApp Business API:</strong>{" "}
            <a
              href="https://developers.facebook.com/docs/whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Meta Documentation
            </a>
          </p>
          <p>
            <strong>Twilio WhatsApp:</strong>{" "}
            <a
              href="https://www.twilio.com/docs/whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Twilio Documentation
            </a>
          </p>
          <p>
            <strong>WhatsApp Manager:</strong>{" "}
            <a
              href="https://www.facebook.com/business/tools/whatsapp-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Access Manager
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

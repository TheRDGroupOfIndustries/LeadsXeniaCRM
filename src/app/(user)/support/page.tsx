"use client";

import { useState } from "react";
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone,
  FileText,
  ExternalLink,
  Send
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import toast, { Toaster } from "react-hot-toast";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSending(true);
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Support request submitted successfully!");
    setSubject("");
    setMessage("");
    setSending(false);
  };

  const faqs = [
    {
      question: "How do I upgrade to Premium?",
      answer: "Navigate to Invoice & Payments from the sidebar and click on 'Upgrade to Premium'."
    },
    {
      question: "How do I import leads from CSV?",
      answer: "Go to Lead Management, click 'Upload CSV', and select your file following the template format."
    },
    {
      question: "How do I add team members?",
      answer: "Admins can add users from the Users page using the 'Add User' button."
    }
  ];

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Support</h1>
        <p className="text-muted-foreground">
          Get help and find answers to your questions
        </p>
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border p-6 text-center">
          <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Email Support</h3>
          <p className="text-sm text-muted-foreground mb-3">Get help via email</p>
          <a href="mailto:support@xeniacrm.app" className="text-primary text-sm hover:underline">
            support@xeniacrm.app
          </a>
        </Card>

        <Card className="bg-card border-border p-6 text-center">
          <Phone className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Phone</h3>
          <p className="text-sm text-muted-foreground mb-3">Call us for help</p>
          <a href="tel:+1234567890" className="text-primary text-sm hover:underline">
            +1 234 567 890
          </a>
        </Card>

        <Card className="bg-card border-border p-6 text-center">
          <FileText className="w-8 h-8 text-blue-500 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Documentation</h3>
          <p className="text-sm text-muted-foreground mb-3">Read our guides</p>
          <a href="#" className="text-blue-500 text-sm hover:underline flex items-center justify-center gap-1">
            View Docs <ExternalLink className="w-3 h-3" />
          </a>
        </Card>
      </div>

      {/* Contact Form */}
      <Card className="bg-card border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Send us a message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What do you need help with?"
              className="bg-white text-black border-border placeholder:text-gray-500"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              className="bg-white text-black border-border min-h-[120px] placeholder:text-gray-500"
            />
          </div>
          <Button 
            type="submit" 
            disabled={sending}
            className="bg-primary hover:bg-primary/90"
          >
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* FAQ Section */}
      <Card className="bg-card border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <h3 className="font-medium text-foreground mb-1">{faq.question}</h3>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

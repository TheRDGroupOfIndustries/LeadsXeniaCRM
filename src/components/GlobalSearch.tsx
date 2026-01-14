"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Users, 
  UserPlus, 
  X, 
  LayoutDashboard,
  MessageCircle,
  FileText,
  DollarSign,
  Receipt,
  Link as LinkIcon,
  Microchip,
  Settings,
  User,
  HelpCircle,
  Building2
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Lead {
  id: string;
  name: string;
  email?: string;
  company?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SearchResult {
  type: "lead" | "employee" | "page";
  id: string;
  name: string;
  subtitle: string;
  href?: string;
  icon?: any;
}

// Pages that can be searched
const searchablePages = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: ["dashboard", "overview", "home", "main"] },
  { name: "Employees", href: "/employees", icon: UserPlus, keywords: ["employees", "team", "staff", "users", "members"] },
  { name: "Lead Management", href: "/leads", icon: Users, keywords: ["leads", "lead", "management", "contacts", "prospects"] },
  { name: "Lead Follow-up", href: "/follow-up", icon: FileText, keywords: ["follow-up", "followup", "reminders", "tasks", "activities"] },
  { name: "Payments", href: "/payments", icon: DollarSign, keywords: ["payments", "billing", "subscription", "pay", "money"] },
  { name: "Invoices", href: "/invoices", icon: Receipt, keywords: ["invoices", "invoice", "bills", "receipts", "orders"] },
  { name: "Settings", href: "/settings", icon: Settings, keywords: ["settings", "preferences", "configuration", "account", "password"] },
  { name: "Profile", href: "/profile", icon: User, keywords: ["profile", "my profile", "account", "user", "me"] },
  { name: "Support", href: "/support", icon: HelpCircle, keywords: ["support", "help", "contact", "assistance", "faq"] },
];

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search when query changes
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults: SearchResult[] = [];
        const lowerQuery = query.toLowerCase();

        // Search pages first (instant, no API call)
        const matchingPages = searchablePages.filter(page =>
          page.name.toLowerCase().includes(lowerQuery) ||
          page.keywords.some(keyword => keyword.includes(lowerQuery))
        );

        matchingPages.forEach(page => {
          searchResults.push({
            type: "page",
            id: page.href,
            name: page.name,
            subtitle: `Go to ${page.name}`,
            href: page.href,
            icon: page.icon
          });
        });

        // Search leads
        const leadsRes = await fetch("/api/leads");
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          const leads = Array.isArray(leadsData) ? leadsData : (leadsData.leads || []);
          
          const matchingLeads = leads.filter((lead: Lead) =>
            lead.name?.toLowerCase().includes(lowerQuery) ||
            lead.email?.toLowerCase().includes(lowerQuery) ||
            lead.company?.toLowerCase().includes(lowerQuery)
          ).slice(0, 5);

          matchingLeads.forEach((lead: Lead) => {
            searchResults.push({
              type: "lead",
              id: lead.id,
              name: lead.name,
              subtitle: lead.email || lead.company || "Lead",
              icon: Building2
            });
          });
        }

        // Search employees
        const employeesRes = await fetch("/api/employees");
        if (employeesRes.ok) {
          const employeesData = await employeesRes.json();
          const employees = employeesData.employees || [];
          
          const matchingEmployees = employees.filter((emp: Employee) =>
            emp.name?.toLowerCase().includes(lowerQuery) ||
            emp.email?.toLowerCase().includes(lowerQuery)
          ).slice(0, 5);

          matchingEmployees.forEach((emp: Employee) => {
            searchResults.push({
              type: "employee",
              id: emp.id,
              name: emp.name,
              subtitle: emp.email || emp.role,
              icon: UserPlus
            });
          });
        }

        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "page") {
      router.push(result.href!);
    } else if (result.type === "lead") {
      router.push(`/leads?search=${encodeURIComponent(result.name)}`);
    } else {
      router.push(`/employees?search=${encodeURIComponent(result.name)}`);
    }
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-2xl">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        placeholder="Search pages, leads, employees..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        className="pl-10 pr-10 bg-card border-border"
      />
      {query && (
        <button
          onClick={() => {
            setQuery("");
            setResults([]);
            setIsOpen(false);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-gray-800 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
                <span>Searching...</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No results found
            </div>
          ) : (
            <div className="py-2">
              {/* Group: Pages */}
              {results.some(r => r.type === "page") && (
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Pages</div>
              )}
              {results.filter(r => r.type === "page").map((result, index) => {
                const IconComponent = result.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/20 text-green-400">
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{result.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                      Page
                    </span>
                  </button>
                );
              })}

              {/* Group: Leads */}
              {results.some(r => r.type === "lead") && (
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide mt-2">Leads</div>
              )}
              {results.filter(r => r.type === "lead").map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{result.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Lead
                  </span>
                </button>
              ))}

              {/* Group: Employees */}
              {results.some(r => r.type === "employee") && (
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide mt-2">Employees</div>
              )}
              {results.filter(r => r.type === "employee").map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{result.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    Employee
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

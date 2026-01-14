import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import ExcelJS from "exceljs";
import { Tag } from "@prisma/client";
import jwt from "jsonwebtoken";
import { verifyJwt } from "@/lib/jwt";
import { auth } from "@/lib/auth";
import { sendLeadNotificationEmail } from "@/lib/sendEmail";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// Define type for Excel rows
type LeadRow = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  notes?: string;
  // amount/value fields from CSV/Excel (may include currency symbols)
  amount?: string;
  tag?: Tag;
  leadsCreatedDate?: string;
  leadsUpdatedDates?: string;
  enquiryDate?: string;
  bookingDate?: string;
  checkInDates?: string;
  checkoutDate?: string;
};

// Map incoming (possibly non-enum) tag values to valid Tag enum values.
// Adjust mappings as business semantics evolve.
const tagAliasMap: Record<string, Tag> = {
  HOT: Tag.HOT,
  WARM: Tag.WARM,
  COLD: Tag.COLD,
  QUALIFIED: Tag.QUALIFIED,
  DISQUALIFIED: Tag.DISQUALIFIED,
  // External synonyms coming from legacy CSVs
  LEAD: Tag.WARM, // Treat generic LEAD as WARM by default
  PROSPECT: Tag.HOT, // Treat PROSPECT as HOT interest
  CUSTOMER: Tag.QUALIFIED, // Treat CUSTOMER as QUALIFIED (revenue-generating)
};

const normalizeTag = (raw?: string): { tag?: Tag; invalid?: string } => {
  if (!raw) return { tag: undefined };
  const upper = raw.trim().toUpperCase();
  if (tagAliasMap[upper]) {
    return { tag: tagAliasMap[upper] };
  }
  return { tag: undefined, invalid: upper }; // Capture invalid for reporting
};

export async function POST(req: NextRequest) {
  try {
    // --- 1️⃣ Get user session ---
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please sign in to upload files." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    // Use an effectiveUserId variable we can modify when we need to map the env-admin fallback
    let effectiveUserId = userId;
    // Resolve uploader display name/email for notifications (declare outside try block for scope)
    let uploaderDisplayName = "Someone";

    // Ensure user exists to avoid foreign key violations
    try {
      // Special-case: when admin logged in via environment fallback, authorize or create real admin user
      if (userId === "env-admin") {
        // Try to find admin by configured admin email
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
          if (adminUser) {
            effectiveUserId = adminUser.id;
            console.log(`Mapped env-admin fallback to DB admin user id ${effectiveUserId}`);
          } else {
            // Create admin user record if it doesn't exist
            const createdAdmin = await prisma.user.create({
              data: {
                email: adminEmail,
                name: process.env.ADMIN_NAME || "Administrator",
                role: "ADMIN",
                // password left null for env-admin; they authenticate via credentials fallback
              },
            });
            effectiveUserId = createdAdmin.id;
            console.log(`Created DB admin user with id ${effectiveUserId} for env-admin fallback`);
          }
        } else {
          console.warn("env-admin fallback present but ADMIN_EMAIL not configured");
        }
      }

      const userExists = await prisma.user.findUnique({ where: { id: effectiveUserId } });
      // Resolve uploader display name/email for notifications
      try {
        const uploader = await prisma.user.findUnique({ where: { id: effectiveUserId }, select: { name: true, email: true } });
        if (uploader) uploaderDisplayName = uploader.name || uploader.email || uploaderDisplayName;
      } catch (uerr) {
        console.warn("Could not resolve uploader user for notifications:", uerr);
      }

      if (!userExists) {
        return NextResponse.json(
          { success: false, error: `User with id '${effectiveUserId}' does not exist. Create the user (signup) before importing leads.` },
          { status: 404 }
        );
      }
    } catch (dbErr: any) {
      console.error("Database error during user check:", dbErr);
      // Provide specific error handling for database connectivity issues
      if (dbErr.code === 'P1001' || dbErr.message?.includes('Connection')) {
        return NextResponse.json({
          success: false,
          error: "Database connection failed during user verification.",
          details: "Cannot verify user permissions. Please check your database connection and try again.",
          code: dbErr.code || 'DB_CONNECTION_ERROR'
        }, { status: 503 });
      }
      // For other database errors, allow upload to proceed and handle at insert time
      console.log("Allowing upload to proceed despite user check failure");
    }

    // --- 2️⃣ Handle file upload ---
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded." },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".csv")) {
      return NextResponse.json(
        { success: false, error: "Only Excel (.xlsx) or CSV files allowed." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uploadDir = path.join(process.cwd(), "uploads");
    // await mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    // await writeFile(filePath, buffer);

    console.log("✅ File uploaded:", filePath);

    // --- 3️⃣ Read Excel or CSV content ---
    const workbook = new ExcelJS.Workbook();
    let rows: LeadRow[] = [];
    
    try {
      if (file.name.endsWith(".csv")) {
        // Handle CSV files
        const csvText = Buffer.from(arrayBuffer).toString('utf-8');
        const csvRows = csvText.split('\n').map(row => row.split(',').map(cell => {
          // Remove extra quotes and trim whitespace
          let cleanCell = cell.trim();
          // Remove leading/trailing quotes if present
          if ((cleanCell.startsWith('"') && cleanCell.endsWith('"')) || 
              (cleanCell.startsWith("'") && cleanCell.endsWith("'"))) {
            cleanCell = cleanCell.slice(1, -1);
          }
          return cleanCell;
        }));
        
        if (csvRows.length === 0) {
          return NextResponse.json(
            { success: false, error: "CSV file is empty." },
            { status: 400 }
          );
        }

        const headers = csvRows[0].map(h => h.toLowerCase().trim());

        const invalidTags: string[] = [];
        for (let i = 1; i < csvRows.length; i++) {
          const row = csvRows[i];
          if (row.length === 0 || row[0] === '') continue;

          const rowData: LeadRow = {};
          headers.forEach((header, index) => {
            const value = row[index]?.trim() || '';
            if (header.includes('name')) rowData.name = value;
            else if (header.includes('email')) rowData.email = value;
            else if (header.includes('phone')) rowData.phone = value;
            else if (header.includes('company')) rowData.company = value;
            else if (header.includes('source')) rowData.source = value;
            else if (header.includes('note')) rowData.notes = value;
            // Support CSVs that include date columns from user uploads
            else if (header.includes('leads created') || header.includes('leads created date') || header.includes('created date')) rowData['leadsCreatedDate'] = value;
            else if (header.includes('leads updated') || header.includes('leads updated dates') || header.includes('updated date')) rowData['leadsUpdatedDates'] = value;
            else if (header.includes('enquiry')) rowData['enquiryDate'] = value;
            else if (header.includes('booking')) rowData['bookingDate'] = value;
            else if (header.includes('check in') || header.includes('check-in')) rowData['checkInDates'] = value;
            else if (header.includes('checkout') || header.includes('check-out') || header.includes('check out')) rowData['checkoutDate'] = value;
            else if (header.includes('amount') || header.includes('value') || header.includes('price') || header.includes('revenue')) {
              rowData.amount = value;
            }
            else if (header.includes('tag')) {
              const { tag, invalid } = normalizeTag(value);
              if (tag) rowData.tag = tag; else if (invalid) invalidTags.push(invalid);
            }
          });

          if (rowData.name) {
            rows.push(rowData);
          }
        }
        if (invalidTags.length) {
          console.log(`⚠️ Invalid tag values encountered (mapped to default DISQUALIFIED): ${invalidTags.join(', ')}`);
        }
      } else {
        // Handle Excel files
        const { Readable } = require('stream');
        const stream = Readable.from(Buffer.from(arrayBuffer));
        await workbook.xlsx.read(stream);
        
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          return NextResponse.json(
            { success: false, error: "No worksheet found in the Excel file." },
            { status: 400 }
          );
        }

        // Get headers and validate
        const headerRow = worksheet.getRow(1);
        const headers: string[] = [];
        
        headerRow.eachCell((cell: any, colNumber: number) => {
          const headerValue = String(cell.value || '').toLowerCase().trim();
          headers[colNumber] = headerValue;
        });

        // Check for required 'name' column
        const hasNameColumn = headers.some(h => h.includes('name'));
        if (!hasNameColumn) {
          return NextResponse.json(
            { success: false, error: "Excel file must have a 'name' column." },
            { status: 400 }
          );
        }

        // Process data rows
        const invalidTags: string[] = [];
        worksheet.eachRow((row: any, rowNumber: number) => {
          if (rowNumber === 1) return; // Skip header row
          
          const rowData: LeadRow = {};
          row.eachCell((cell: any, colNumber: number) => {
            const header = headers[colNumber];
            const value = String(cell.value || '').trim();
            
            if (header.includes('name')) rowData.name = value;
            else if (header.includes('email')) rowData.email = value;
            else if (header.includes('phone')) rowData.phone = value;
            else if (header.includes('company')) rowData.company = value;
            else if (header.includes('source')) rowData.source = value;
            else if (header.includes('note')) rowData.notes = value;
            // Support additional date columns
            else if (header.includes('leads created') || header.includes('leads created date') || header.includes('created date')) rowData['leadsCreatedDate'] = value;
            else if (header.includes('leads updated') || header.includes('leads updated dates') || header.includes('updated date')) rowData['leadsUpdatedDates'] = value;
            else if (header.includes('enquiry')) rowData['enquiryDate'] = value;
            else if (header.includes('booking')) rowData['bookingDate'] = value;
            else if (header.includes('check in') || header.includes('check-in')) rowData['checkInDates'] = value;
            else if (header.includes('checkout') || header.includes('check-out') || header.includes('check out')) rowData['checkoutDate'] = value;
            else if (header.includes('amount') || header.includes('value') || header.includes('price') || header.includes('revenue')) {
              rowData.amount = value;
            }
            else if (header.includes('tag')) {
              const { tag, invalid } = normalizeTag(value);
              if (tag) rowData.tag = tag; else if (invalid) invalidTags.push(invalid);
            }
          });
          
          if (rowData.name) {
            rows.push(rowData);
          }
        });
        if (invalidTags.length) {
          console.log(`⚠️ Invalid tag values encountered (mapped to default DISQUALIFIED): ${invalidTags.join(', ')}`);
        }
      }
    } catch (fileError: any) {
      return NextResponse.json(
        { success: false, error: `Failed to read file: ${fileError.message}` },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "The file is empty." },
        { status: 400 }
      );
    }

    // --- 4️⃣ Transform rows for Prisma ---
    const leadsToInsert = rows
      .map((row) => {
        const name = String(row.name || "").trim().substring(0, 255); // Limit to 255 chars
        if (!name) return null;

        // Extract optional date fields
        const createdAt = row['leadsCreatedDate'] ? new Date(String(row['leadsCreatedDate'])) : undefined;
        const updatedAt = row['leadsUpdatedDates'] ? new Date(String(row['leadsUpdatedDates'])) : undefined;
        const enquiryDate = row['enquiryDate'] ? String(row['enquiryDate']).trim() : undefined;
        const bookingDate = row['bookingDate'] ? String(row['bookingDate']).trim() : undefined;
        const checkInDates = row['checkInDates'] ? String(row['checkInDates']).trim() : undefined;
        const checkoutDate = row['checkoutDate'] ? String(row['checkoutDate']).trim() : undefined;

        // Make checkout date mandatory
        if (!checkoutDate) {
          console.warn(`⚠️ Skipping lead "${name}" - checkout date is required`);
          return null;
        }

        const notesField = row.notes ? String(row.notes).trim().substring(0, 1000) : null;

        const insertObj: any = {
          name,
          email: row.email ? String(row.email).trim().substring(0, 255) : null,
          phone: row.phone ? String(row.phone).trim().substring(0, 20) : null,
          company: row.company ? String(row.company).trim().substring(0, 255) : null,
          source: row.source ? String(row.source).trim().substring(0, 50) : null,
          notes: notesField,
          amount: row.amount ? String(parseFloat(String(row.amount).replace(/[^0-9.-]+/g, '') || '0').toFixed(2)) : null,
          tag: row.tag || Tag.DISQUALIFIED,
          duration: 0,
          userId: effectiveUserId!,
        };

        // Persist CSV date columns into their own DB fields (optional)
        if (createdAt && !isNaN(createdAt.getTime())) insertObj.leadsCreatedDate = createdAt;
        if (updatedAt && !isNaN(updatedAt.getTime())) insertObj.leadsUpdatedDates = updatedAt;

        // Parse enquiry/booking/checkin/checkout date strings into Date objects where possible
        if (enquiryDate) {
          const d = new Date(enquiryDate);
          if (!isNaN(d.getTime())) insertObj.enquiryDate = d;
        }
        if (bookingDate) {
          const d = new Date(bookingDate);
          if (!isNaN(d.getTime())) insertObj.bookingDate = d;
        }
        if (checkInDates) {
          const d = new Date(checkInDates);
          if (!isNaN(d.getTime())) insertObj.checkInDates = d;
        }
        if (checkoutDate) {
          const d = new Date(checkoutDate);
          if (!isNaN(d.getTime())) insertObj.checkoutDate = d;
        }

        return insertObj;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    // --- 4️⃣ Transform rows for Prisma and prevent duplicates ---
    const existingEmails = new Set<string>();
    
    // Get existing leads for this user to prevent duplicates
    if (leadsToInsert.some(lead => lead.email)) {
      const emails = leadsToInsert.map(lead => lead.email).filter((email): email is string => email !== null && email !== undefined);
      if (emails.length > 0) {
        try {
          const existingLeads = await prisma.lead.findMany({
            where: {
              userId: effectiveUserId!,
              email: { in: emails }
            },
            select: { email: true }
          });
          
          existingLeads.forEach(lead => {
            if (lead.email) existingEmails.add(lead.email);
          });
        } catch (dbErr) {
          console.error("Database unavailable for duplicate check — proceeding without duplicate detection:", dbErr);
          // If DB is unavailable, skip duplicate detection and proceed
          // Prisma will handle unique constraint violations at insert time
        }
      }
    }

    // Helper function to validate email format
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    // Filter out duplicates (both existing in DB and within current upload)
    const uploadEmails = new Set();
    const finalLeadsToInsert = leadsToInsert.filter((lead) => {
      // Skip if no name
      if (!lead.name) return false;
      
      // Skip if email is not in valid format
      if (lead.email && !isValidEmail(lead.email)) {
        // If email is not valid, treat it as missing but don't reject the lead
        lead.email = null;
      }
      
      // Skip if email already exists in database
      if (lead.email && existingEmails.has(lead.email)) {
        console.log(`⚠️ Skipping duplicate email: ${lead.email}`);
        return false;
      }
      
      // Skip if email already seen in this upload
      if (lead.email && uploadEmails.has(lead.email)) {
        console.log(`⚠️ Skipping duplicate email in upload: ${lead.email}`);
        return false;
      }
      
      // Add email to seen set
      if (lead.email) uploadEmails.add(lead.email);
      
      return true;
    });

    if (finalLeadsToInsert.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No new leads to import. All leads either exist already or have missing required fields.",
          duplicatesSkipped: leadsToInsert.length - finalLeadsToInsert.length
        },
        { status: 400 }
      );
    }

    // --- 5️⃣ Bulk insert using Prisma with retry mechanism ---
    let created: any;
    const maxRetries = 3;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Test database connectivity first
        await prisma.$queryRaw`SELECT 1`;
        
        created = await prisma.lead.createMany({
          data: finalLeadsToInsert
          // Note: skipDuplicates not supported in SQLite, we handle duplicates manually above
        });
        
        // If successful, break out of retry loop
        break;
        
      } catch (dbErr: any) {
        lastError = dbErr;
        console.error(`Database error during bulk insert (attempt ${attempt}/${maxRetries}):`, dbErr);
        
        // If this is the last attempt or a non-retryable error, fail
        if (attempt === maxRetries || (dbErr.code && !['P1001', 'P1008', 'P1017'].includes(dbErr.code))) {
          // Provide more specific error messages based on error type
          let errorMessage = "Database is currently unavailable. Please try uploading leads later when the database connection is restored.";
          let errorDetails = "The database server appears to be unreachable. This may be a temporary connectivity issue.";
          
          if (dbErr.code === 'P1001') {
            errorMessage = "Unable to connect to the database server.";
            errorDetails = "Please check your database connection settings and try again.";
          } else if (dbErr.code === 'P2002') {
            errorMessage = "Duplicate data constraint violation.";
            errorDetails = "Some of the leads you're trying to upload already exist in the system.";
          } else if (dbErr.message?.includes('Connection')) {
            errorMessage = "Database connection failed.";
            errorDetails = "The application cannot connect to the database. Please try again in a few moments.";
          }
          
          return NextResponse.json({
            success: false,
            error: errorMessage,
            details: errorDetails,
            code: dbErr.code || 'DB_ERROR',
            attempts: attempt
          }, { status: 503 });
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    const duplicatesSkipped = leadsToInsert.length - finalLeadsToInsert.length;
    
    console.log(`✅ Imported ${created.count} leads for user ${effectiveUserId}`);
    if (duplicatesSkipped > 0) {
      console.log(`⚠️ Skipped ${duplicatesSkipped} duplicate leads`);
    }

    // Notify Zapier for each inserted lead (use the original data since createMany doesn't return records)
    let emailsSent = 0;
    let emailsFailed = 0;
    
    try {
      for (const lead of finalLeadsToInsert) {
        // Send notification email to the lead if an email address is present
        if (lead.email && typeof lead.email === 'string' && lead.email.trim() !== '') {
          try {
            console.log(`📧 Attempting to send email to: ${lead.email}`);
            const emailSent = await sendLeadNotificationEmail(
              lead.email,
              lead.name || lead.email,
              uploaderDisplayName,
              {
                name: lead.name || "",
                email: lead.email || "",
                phone: lead.phone || "",
                company: lead.company || "",
                source: lead.source || "",
                notes: lead.notes || "",
              }
            );
            
            if (emailSent) {
              emailsSent++;
              console.log(`✅ Email sent successfully to: ${lead.email}`);
            } else {
              emailsFailed++;
              console.log(`⚠️ Email failed to send to: ${lead.email}`);
            }
          } catch (emailErr) {
            emailsFailed++;
            console.error(`❌ Failed to send notification email to ${lead.email}:`, emailErr);
          }
        }
      }
    } catch (notifyErr) {
      console.error("Failed to notify Zapier for uploaded leads:", notifyErr);
    }
    
    console.log(`📊 Email Summary: ${emailsSent} sent, ${emailsFailed} failed out of ${finalLeadsToInsert.length} leads`);
    if (emailsFailed > 0) {
      console.warn(`⚠️ Check EMAIL_USER and EMAIL_PASS environment variables if emails are not being sent`);
    }

    return NextResponse.json({
      success: true,
      imported: created.count,
      duplicatesSkipped,
      emailsSent,
      emailsFailed,
      filename: fileName,
      message: `Successfully imported ${created.count} leads${duplicatesSkipped > 0 ? ` (${duplicatesSkipped} duplicates skipped)` : ''}${emailsSent > 0 ? `. ${emailsSent} email notification${emailsSent > 1 ? 's' : ''} sent` : ''}${emailsFailed > 0 ? `. ${emailsFailed} email${emailsFailed > 1 ? 's' : ''} failed to send` : ''}`
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error during upload." },
      { status: 500 }
    );
  }
}

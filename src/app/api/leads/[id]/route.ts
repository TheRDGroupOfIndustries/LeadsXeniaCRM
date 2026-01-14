import prisma from "@/lib/prisma";
import { Tag, LeadStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

interface leaduupdate {
  name: string;
  email: string;
  phone: string;
  company: string;
  tag: Tag;
  source: string;
  notes: string;
  duration: number;
  status?: LeadStatus;
  amount?: string;
  enquiryDate?: string;
  bookingDate?: string;
  checkInDates?: string;
  checkoutDate?: string;
  leadsCreatedDate?: string;
  leadsUpdatedDates?: string;
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();
    const user = session?.user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id as string;
    const userRole = session.user.role as string;

    try {
      // Find the lead and check ownership
      const lead = await prisma.lead.findUnique({
        where: { id: id },
      });

      if (!lead) {
        return NextResponse.json(
          { success: false, error: "Lead not found" },
          { status: 404 }
        );
      }
      
      // Check if user can edit this lead (admin can edit any, employee only their own)
      if (userRole !== "ADMIN" && lead.userId !== userId) {
        return NextResponse.json(
          { success: false, error: "Access denied. You can only edit your own leads." },
          { status: 403 }
        );
      }
      
      const body = (await req.json()) as leaduupdate;
      
      // Convert date strings to ISO-8601 DateTime format for Prisma
      const convertDateToDateTime = (dateString: string | undefined): string | undefined => {
        if (!dateString) return undefined;
        // If already in ISO format, return as-is
        if (dateString.includes('T')) return dateString;
        // Convert YYYY-MM-DD to YYYY-MM-DDTHH:MM:SSZ
        return `${dateString}T00:00:00Z`;
      };

      const processedData = {
        ...body,
        enquiryDate: convertDateToDateTime(body.enquiryDate),
        bookingDate: convertDateToDateTime(body.bookingDate),
        checkInDates: convertDateToDateTime(body.checkInDates),
        checkoutDate: convertDateToDateTime(body.checkoutDate),
        leadsCreatedDate: convertDateToDateTime((body as any).leadsCreatedDate),
        leadsUpdatedDates: convertDateToDateTime((body as any).leadsUpdatedDates),
      };

      const updated = await prisma.lead.update({
        where: { id },
        data: processedData,
      });

      return NextResponse.json(updated);
    } catch (dbErr) {
      console.error("Database unavailable for lead update:", dbErr);
      return NextResponse.json({
        success: false,
        error: "Database is currently unavailable. Please try updating the lead later."
      }, { status: 503 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();
    const user = session?.user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id as string;
    const userRole = session.user.role as string;

    try {
      // Find the lead and check ownership
      const lead = await prisma.lead.findUnique({
        where: { id: id },
      });

      if (!lead) {
        return NextResponse.json(
          { success: false, error: "Lead not found" },
          { status: 404 }
        );
      }
      
      // Check if user can delete this lead (admin can delete any, employee only their own)
      if (userRole !== "ADMIN" && lead.userId !== userId) {
        return NextResponse.json(
          { success: false, error: "Access denied. You can only delete your own leads." },
          { status: 403 }
        );
      }

      const deleted = await prisma.lead.delete({
        where: { id },
      });

      return NextResponse.json(deleted);
    } catch (dbErr) {
      console.error("Database unavailable for lead deletion:", dbErr);
      return NextResponse.json({
        success: false,
        error: "Database is currently unavailable. Please try deleting the lead later."
      }, { status: 503 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();
    const user = session?.user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = user.id as string;
    const userRole = user.role as string;
    
    try {
      // Find the lead
      const lead = await prisma.lead.findUnique({
        where: { id: id },
      });
      
      if (!lead) {
        return NextResponse.json(
          { success: false, error: "Lead not found" },
          { status: 404 }
        );
      }
      
      // Check if user can view this lead (admin can view any, employee only their own)
      if (userRole !== "ADMIN" && lead.userId !== userId) {
        return NextResponse.json(
          { success: false, error: "Access denied. You can only view your own leads." },
          { status: 403 }
        );
      }
      
      // Return as array to match expected format in components
      return NextResponse.json([lead]);
    } catch (dbErr) {
      console.error("Database unavailable for lead retrieval:", dbErr);
      return NextResponse.json({
        success: false,
        error: "Database is currently unavailable. Please try again later."
      }, { status: 503 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

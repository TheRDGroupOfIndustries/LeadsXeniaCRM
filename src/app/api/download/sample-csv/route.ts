import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Sample CSV content with all the required columns
    const csvContent = `name,email,phone,company,notes,source,tag,duration,amount,Leads created date,Leads updated dates
  Kate Caulfield,kate.caulfield@prescottsinc.com,555-920-3172,The Dark Room,Postponed meeting,School Event,Customer,29,10295,2023-07-04,2023-08-18
  Warren Amber,warren.amber@janesantiques.com,555-419-9895,The Dark Room,Needs to review contract,Photography Contest,Prospect,10,6753,2023-05-09,2023-06-20
  Chloe Graham,chloe.graham@sciencedept.com,555-709-3633,The Dark Room,Photo shoot scheduled,Photography Contest,Lead,67,9926,2023-02-16,2023-03-15
  Rachel Chase,rachel.chase@thedarkroom.com,555-608-2615,The Dark Room,Postponed meeting,Walk-in,Prospect,61,8622,2023-07-30,2023-08-14
  David Madsen,david.madsen@vortexclub.com,555-773-7667,Maxs Photography,High profile project,Social Media,Lead,55,12788,2023-05-04,2023-05-16`;
    
    // Create response with CSV content
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="sample_leads.csv"',
      },
    });
  } catch (error) {
    console.error("Error serving sample CSV:", error);
    return NextResponse.json(
      { success: false, error: "Failed to download sample CSV" },
      { status: 500 }
    );
  }
}
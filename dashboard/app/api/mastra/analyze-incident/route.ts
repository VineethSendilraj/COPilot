import { NextRequest, NextResponse } from "next/server";
import { incidentAnalyzer } from "@/lib/mastra";

export async function POST(request: NextRequest) {
  try {
    const { incident } = await request.json();

    if (!incident) {
      return NextResponse.json(
        { error: "Incident data is required" },
        { status: 400 }
      );
    }

    // Use Mastra agent to analyze the incident
    const analysis = await incidentAnalyzer.generate({
      messages: [
        {
          role: "user",
          content: `Analyze this incident and provide recommendations:

Incident ID: ${incident.id}
Officer: ${incident.officer?.name || "Unknown"}
Escalation Type: ${incident.escalation_type}
Risk Level: ${incident.risk_level}
Description: ${incident.description || "No description"}
Created: ${incident.created_at}

Please provide:
1. Risk assessment
2. Recommended actions
3. Resource requirements
4. Safety considerations`,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      analysis: analysis.text,
      recommendations: analysis.text, // For now, we'll use the text response
    });
  } catch (error) {
    console.error("Error analyzing incident:", error);
    return NextResponse.json(
      { error: "Failed to analyze incident" },
      { status: 500 }
    );
  }
}

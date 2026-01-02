import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    
    if (type === "security_report") {
      systemPrompt = `You are a senior cybersecurity analyst. Analyze the provided tool output (such as Nmap scans, vulnerability scan results, or penetration testing logs) and generate a comprehensive security report.

Your report MUST be in Markdown format with the following structure:

# Security Analysis Report

## Executive Summary
Brief overview of findings

## Severity Assessment
- **CVSS Score**: [0.0-10.0]
- **Risk Level**: [Critical/High/Medium/Low/Informational]

## Technical Description
Detailed technical analysis of the findings

## Identified Vulnerabilities
List each vulnerability with:
- CVE ID (if applicable)
- Description
- Affected component

## Evidence
Key evidence from the scan output

## Remediation Steps
1. Numbered actionable steps
2. Priority order
3. Specific commands or configurations

## References
- Relevant security resources
- CVE links
- Vendor advisories

Be thorough, professional, and actionable in your analysis.`;
    } else if (type === "log_analysis") {
      systemPrompt = `You are a Linux system administrator and security analyst. Analyze the provided log output (such as journalctl, syslog, auth.log, or other Linux logs) and generate a comprehensive analysis report.

Your report MUST be in Markdown format with the following structure:

# Log Analysis Report

## Summary
Brief overview of log contents and timeframe

## Key Events
Notable events identified in chronological order

## Security Concerns
- Any suspicious activities
- Failed authentication attempts
- Unusual patterns

## System Health
- Service status issues
- Error patterns
- Resource concerns

## Recommendations
Actionable steps to address identified issues

Be thorough and highlight anything that could indicate security issues or system problems.`;
    } else if (type === "config_audit") {
      systemPrompt = `You are a Linux security auditor specializing in RHCSA/RHCE security standards. Analyze the provided configuration file and identify security weaknesses.

Your report MUST be in Markdown format with the following structure:

# Configuration Security Audit

## Configuration Type
Identify what configuration this is (sshd_config, sudoers, etc.)

## Security Score
[A/B/C/D/F] - Overall security rating

## Critical Issues 🔴
Settings that pose immediate security risks

## Warnings ⚠️
Settings that could be improved

## Best Practices ✅
Good security settings currently in place

## Recommended Changes
\`\`\`
Specific configuration changes with before/after
\`\`\`

## RHCSA/CIS Compliance Notes
How this config aligns with security benchmarks

Be specific about line numbers and exact setting changes needed.`;
    } else {
      systemPrompt = "You are a helpful cybersecurity assistant. Provide clear, professional analysis.";
    }

    console.log(`Processing ${type} request...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || "No content generated";

    console.log("Successfully generated analysis");

    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-analyze function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

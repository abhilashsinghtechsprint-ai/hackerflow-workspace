import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Comprehensive security knowledge base extracted from:
// - Bug Bounty from Scratch by Francisco Javier Santiago Vázquez
// - Linux for Red Teamers
// - Ethical Hacking by Joe Grant

const SECURITY_KNOWLEDGE_BASE = `
## CYBERSECURITY REFERENCE KNOWLEDGE

### PENETRATION TESTING LIFECYCLE (5 PHASES)
1. **Reconnaissance** - Gather target information using OSINT, Google Dorking, social media, DNS queries
2. **Scanning** - Identify vulnerabilities using Nmap, network traffic analysis, port scanning
3. **Exploitation** - Gain access using Metasploit, vulnerability exploits, injection attacks
4. **Persistence/Maintaining Access** - Establish backdoors, create persistence mechanisms
5. **Reporting** - Document findings, present to stakeholders, provide remediation steps

### COMMON VULNERABILITY TYPES
- **Software Vulnerabilities**: Buffer overflow, code injection, XSS, RCE
- **Network Vulnerabilities**: Open ports, misconfigured firewalls, weak encryption
- **Configuration Vulnerabilities**: Default passwords, excessive permissions, open services
- **Web Application Vulnerabilities**: SQL injection, XSS, CSRF, authentication bypass
- **Zero-day Vulnerabilities**: Unpatched, unknown exploits

### LINUX SECURITY COMMANDS & CONCEPTS
- **File Permissions**: chmod, chown, ls -l (rwxrwxrwx format)
- **User Management**: useradd, userdel, passwd, /etc/passwd, /etc/shadow
- **Log Analysis**: journalctl, /var/log/auth.log, /var/log/syslog, dmesg
- **Network Tools**: netstat, ss, iptables, nmap, tcpdump
- **Process Management**: ps, top, htop, kill, systemctl
- **Man Pages**: man <command>, man -k <keyword>, whereis, whatis

### SSHD_CONFIG SECURITY BEST PRACTICES (RHCSA STANDARDS)
- PermitRootLogin: Should be "no" or "prohibit-password"
- PasswordAuthentication: Should be "no" (use SSH keys)
- PubkeyAuthentication: Should be "yes"
- X11Forwarding: Should be "no" unless required
- MaxAuthTries: Should be 3-4 (not 6 or higher)
- PermitEmptyPasswords: Must be "no"
- Protocol: Should be 2 only
- AllowUsers/AllowGroups: Should be configured to restrict access
- Port: Consider changing from 22 to non-standard port
- LoginGraceTime: Should be 60 or less
- ClientAliveInterval: Should be configured for idle timeout

### SUDOERS SECURITY BEST PRACTICES
- Avoid NOPASSWD unless absolutely necessary
- Use specific commands instead of ALL
- Implement Defaults env_reset
- Use Defaults requiretty when possible
- Limit root access to specific groups
- Audit sudo usage with logging enabled

### NMAP SCAN INTERPRETATION
- **Open ports**: Potential attack vectors
- **Service versions**: Check for known CVEs
- **OS detection**: Identify potential OS-specific vulnerabilities
- **Script scanning**: NSE scripts for vulnerability detection
- Common risky ports: 21 (FTP), 22 (SSH), 23 (Telnet), 25 (SMTP), 80/443 (HTTP/S), 3306 (MySQL), 3389 (RDP)

### COMMON ATTACK TYPES
- **APT (Advanced Persistent Threat)**: Long-term targeted attacks
- **DDoS**: Distributed Denial of Service
- **Phishing/Spear Phishing**: Social engineering via email
- **Ransomware**: Encryption-based extortion
- **Brute Force**: Password guessing attacks
- **Man-in-the-Middle**: Traffic interception
- **SQL Injection**: Database manipulation
- **XSS**: Cross-site scripting for session hijacking

### CVSS SCORING GUIDE
- 0.0: None/Informational
- 0.1-3.9: Low
- 4.0-6.9: Medium
- 7.0-8.9: High
- 9.0-10.0: Critical

### BUG BOUNTY BEST PRACTICES
- Always get written authorization
- Document all findings with evidence
- Follow responsible disclosure
- Report severity accurately
- Provide clear remediation steps
- Tools: Burp Suite, Nmap, SQLmap, Metasploit, WhatWeb, Shodan, Dirsearch

### HACKER TYPES
- **White Hat**: Ethical hackers, penetration testers
- **Black Hat**: Malicious hackers, crackers
- **Grey Hat**: Between ethical and malicious
- **Script Kiddies**: Use pre-made tools without understanding

### OWASP TOP 10 AWARENESS
- Injection flaws
- Broken authentication
- Sensitive data exposure
- XML External Entities (XXE)
- Broken access control
- Security misconfiguration
- Cross-site scripting (XSS)
- Insecure deserialization
- Using components with known vulnerabilities
- Insufficient logging and monitoring
`;

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
      systemPrompt = `You are a senior cybersecurity analyst with expertise in penetration testing and vulnerability assessment. You have deep knowledge from industry-standard resources including Bug Bounty methodologies, Linux security, and ethical hacking practices.

${SECURITY_KNOWLEDGE_BASE}

Analyze the provided tool output (such as Nmap scans, vulnerability scan results, or penetration testing logs) and generate a comprehensive security report.

Your report MUST be in Markdown format with the following structure:

# Security Analysis Report

## Executive Summary
Brief overview of findings (2-3 sentences)

## Severity Assessment
- **CVSS Score**: [0.0-10.0] - Use the CVSS guide above
- **Risk Level**: [Critical/High/Medium/Low/Informational]
- **Confidence**: [High/Medium/Low]

## Technical Description
Detailed technical analysis of the findings. Reference the penetration testing lifecycle phase this relates to.

## Identified Vulnerabilities
For each vulnerability:
- **Finding**: Clear description
- **CVE ID**: (if applicable)
- **Affected Component**: What's vulnerable
- **Attack Vector**: How it could be exploited
- **Business Impact**: What could happen if exploited

## Evidence
Key evidence from the scan output (quote relevant portions)

## Remediation Steps
1. Numbered actionable steps in priority order
2. Include specific commands or configurations
3. Reference security best practices

## OWASP/CIS Compliance Notes
How findings relate to security frameworks

## References
- Relevant security resources
- CVE links
- Vendor advisories

Be thorough, professional, and actionable. Always explain WHY something is a risk.`;
    } else if (type === "log_analysis") {
      systemPrompt = `You are a Linux system administrator and security analyst with deep expertise in log analysis, incident response, and system hardening. You have comprehensive knowledge of Linux fundamentals and security practices.

${SECURITY_KNOWLEDGE_BASE}

Analyze the provided log output (such as journalctl, syslog, auth.log, or other Linux logs) and generate a comprehensive analysis report.

Your report MUST be in Markdown format with the following structure:

# Log Analysis Report

## Summary
Brief overview of log contents, timeframe, and source system

## Timeline of Events
Chronological list of significant events with timestamps

## Security Concerns
🔴 **Critical Issues**:
- Failed authentication attempts (brute force indicators)
- Unauthorized access attempts
- Privilege escalation attempts
- Suspicious process execution

⚠️ **Warnings**:
- Unusual patterns
- Configuration issues
- Service anomalies

## Attack Indicators
- Source IPs of suspicious activity
- Targeted accounts/services
- Attack patterns detected

## System Health
- Service status issues
- Error patterns
- Resource concerns

## Recommendations
### Immediate Actions
1. Specific steps to address security issues

### Long-term Improvements
1. Hardening recommendations
2. Monitoring improvements

## Linux Commands for Further Investigation
\`\`\`bash
# Provide relevant commands the user can run to investigate further
\`\`\`

Be thorough and highlight anything that could indicate security issues or system problems.`;
    } else if (type === "config_audit") {
      systemPrompt = `You are a Linux security auditor specializing in RHCSA/RHCE security standards, CIS benchmarks, and configuration hardening. You have deep knowledge of secure configuration practices.

${SECURITY_KNOWLEDGE_BASE}

Analyze the provided configuration file and identify security weaknesses based on industry best practices.

Your report MUST be in Markdown format with the following structure:

# Configuration Security Audit

## Configuration Type
Identify what configuration this is (sshd_config, sudoers, nginx.conf, etc.)

## Security Score
**Grade**: [A/B/C/D/F]
**Score**: [0-100]%

## Critical Issues 🔴
Settings that pose immediate security risks. For each:
- **Setting**: Current value
- **Risk**: What could happen
- **Required**: What it should be
- **Line**: Where in the config (if identifiable)

## Warnings ⚠️
Settings that could be improved:
- **Setting**: Current value
- **Recommendation**: Better value
- **Reason**: Why it matters

## Best Practices ✅
Good security settings currently in place (acknowledge what's done right)

## Recommended Changes

### Before (Current Configuration)
\`\`\`
[Show problematic lines]
\`\`\`

### After (Secure Configuration)
\`\`\`
[Show corrected lines with proper values]
\`\`\`

## RHCSA/CIS Compliance Notes
- Which benchmarks this config meets or fails
- Specific control IDs if applicable

## Implementation Steps
1. Step-by-step instructions to apply changes
2. Include backup commands
3. Include validation commands

## Post-Change Validation
\`\`\`bash
# Commands to verify changes work correctly
\`\`\`

Be specific about exact setting changes needed. Reference the security knowledge base for best practice values.`;
    } else {
      systemPrompt = `You are a helpful cybersecurity assistant with deep knowledge of penetration testing, Linux security, and ethical hacking practices.

${SECURITY_KNOWLEDGE_BASE}

Provide clear, professional analysis based on your security expertise.`;
    }

    console.log(`Processing ${type} request with enhanced knowledge base...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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

    console.log("Successfully generated analysis with knowledge base");

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

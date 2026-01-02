import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Terminal, 
  FileSearch, 
  Shield, 
  Loader2, 
  Copy, 
  Download,
  Sparkles,
  FileCode,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

type AnalysisType = 'security_report' | 'log_analysis' | 'config_audit';

interface TabConfig {
  id: AnalysisType;
  label: string;
  icon: typeof Terminal;
  placeholder: string;
  description: string;
  sampleData: string;
  sampleLabel: string;
}

const TABS: TabConfig[] = [
  {
    id: 'security_report',
    label: 'Security Report',
    icon: Shield,
    placeholder: `Paste your Nmap scan, vulnerability report, or penetration test output here...`,
    description: 'Analyze security scan results and generate vulnerability reports',
    sampleLabel: 'Load Nmap Scan',
    sampleData: `Starting Nmap 7.94 ( https://nmap.org ) at 2024-01-15 14:32 UTC
Nmap scan report for target-server.example.com (192.168.1.50)
Host is up (0.0023s latency).
Not shown: 993 closed tcp ports (reset)

PORT     STATE SERVICE     VERSION
21/tcp   open  ftp         vsftpd 2.3.4
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_Can't get directory listing: TIMEOUT
22/tcp   open  ssh         OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 c4:f8:ad:e8:f8:04:77:de:cf:15:0d:63:0a:18:7e:49 (RSA)
|_  256 22:8f:b1:97:bf:0f:17:08:fc:7e:2c:8f:e9:77:3a:48 (ECDSA)
23/tcp   open  telnet      Linux telnetd
80/tcp   open  http        Apache httpd 2.4.18 ((Ubuntu))
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
| http-methods: 
|_  Potentially risky methods: TRACE
443/tcp  open  ssl/https   Apache httpd 2.4.18
| ssl-cert: Subject: commonName=target-server.example.com
| Not valid after:  2023-06-15T12:00:00
|_ssl-date: TLS randomness does not represent time
| ssl-enum-ciphers: 
|   TLSv1.0: 
|     ciphers: 
|       TLS_RSA_WITH_3DES_EDE_CBC_SHA (rsa 2048) - C
|       TLS_RSA_WITH_RC4_128_SHA (rsa 2048) - D
3306/tcp open  mysql       MySQL 5.5.62-0ubuntu0.14.04.1
| mysql-info: 
|   Protocol: 10
|   Version: 5.5.62-0ubuntu0.14.04.1
|_  Salt: REDACTED
8080/tcp open  http-proxy  Apache Tomcat/Coyote JSP engine 1.1
|_http-server-header: Apache-Coyote/1.1
| http-methods: 
|_  Potentially risky methods: PUT DELETE

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 45.23 seconds`,
  },
  {
    id: 'log_analysis',
    label: 'Log Parser',
    icon: FileSearch,
    placeholder: `Paste your Linux logs here (journalctl, syslog, auth.log, etc.)...`,
    description: 'Parse and analyze Linux system logs for security events',
    sampleLabel: 'Load Auth Logs',
    sampleData: `Jan 15 03:14:22 webserver sshd[12847]: Failed password for invalid user admin from 45.227.255.206 port 52341 ssh2
Jan 15 03:14:23 webserver sshd[12847]: Received disconnect from 45.227.255.206 port 52341:11: Bye Bye [preauth]
Jan 15 03:14:25 webserver sshd[12849]: Failed password for invalid user root from 45.227.255.206 port 52355 ssh2
Jan 15 03:14:26 webserver sshd[12849]: Failed password for invalid user root from 45.227.255.206 port 52355 ssh2
Jan 15 03:14:27 webserver sshd[12849]: Failed password for invalid user root from 45.227.255.206 port 52355 ssh2
Jan 15 03:14:28 webserver sshd[12849]: error: maximum authentication attempts exceeded for invalid user root from 45.227.255.206 port 52355 ssh2
Jan 15 03:14:29 webserver sshd[12851]: Failed password for invalid user test from 45.227.255.206 port 52401 ssh2
Jan 15 03:14:30 webserver sshd[12853]: Failed password for invalid user ubuntu from 45.227.255.206 port 52415 ssh2
Jan 15 03:14:32 webserver sshd[12855]: Failed password for invalid user oracle from 45.227.255.206 port 52427 ssh2
Jan 15 03:15:01 webserver CRON[12860]: (root) CMD (/usr/bin/certbot renew --quiet)
Jan 15 03:15:45 webserver sudo:   deploy : TTY=pts/0 ; PWD=/home/deploy ; USER=root ; COMMAND=/bin/systemctl restart nginx
Jan 15 03:15:45 webserver sudo: pam_unix(sudo:session): session opened for user root by deploy(uid=1001)
Jan 15 03:15:46 webserver sudo: pam_unix(sudo:session): session closed for user root
Jan 15 03:16:22 webserver sshd[12890]: Accepted publickey for deploy from 10.0.1.5 port 44521 ssh2
Jan 15 03:16:22 webserver sshd[12890]: pam_unix(sshd:session): session opened for user deploy by (uid=0)
Jan 15 03:17:01 webserver kernel: [UFW BLOCK] IN=eth0 OUT= MAC=00:16:3e:5e:6c:00:fe:ff:ff:ff:ff:ff:08:00 SRC=185.220.101.35 DST=192.168.1.50 LEN=40 TOS=0x00 PREC=0x00 TTL=243 ID=54321 PROTO=TCP SPT=443 DPT=22 WINDOW=1024 RES=0x00 SYN URGP=0
Jan 15 03:17:05 webserver kernel: [UFW BLOCK] IN=eth0 OUT= MAC=00:16:3e:5e:6c:00:fe:ff:ff:ff:ff:ff:08:00 SRC=185.220.101.35 DST=192.168.1.50 LEN=40 TOS=0x00 PREC=0x00 TTL=243 ID=54322 PROTO=TCP SPT=443 DPT=3389 WINDOW=1024 RES=0x00 SYN URGP=0
Jan 15 03:18:00 webserver systemd[1]: Starting Daily apt download activities...
Jan 15 03:18:05 webserver systemd[1]: Started Daily apt download activities.
Jan 15 03:20:15 webserver sshd[12920]: error: PAM: Authentication failure for deploy from 192.168.1.100
Jan 15 03:20:18 webserver sshd[12920]: Failed password for deploy from 192.168.1.100 port 55123 ssh2`,
  },
  {
    id: 'config_audit',
    label: 'Config Auditor',
    icon: Terminal,
    placeholder: `Paste your configuration file here (sshd_config, sudoers, nginx.conf, etc.)...`,
    description: 'Audit configurations against RHCSA security standards',
    sampleLabel: 'Load sshd_config',
    sampleData: `# OpenSSH Server Configuration File
# WARNING: This is an INSECURE example configuration for testing

# Network Settings
Port 22
#AddressFamily any
ListenAddress 0.0.0.0
Protocol 2

# Authentication
PermitRootLogin yes
PasswordAuthentication yes
PermitEmptyPasswords no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Security Settings
MaxAuthTries 6
MaxSessions 10
LoginGraceTime 120
StrictModes yes

# Forwarding
X11Forwarding yes
X11DisplayOffset 10
X11UseLocalhost yes
AllowTcpForwarding yes
GatewayPorts no
PermitTunnel no

# Logging
SyslogFacility AUTH
LogLevel INFO

# Session
ClientAliveInterval 0
ClientAliveCountMax 3
TCPKeepAlive yes

# Banner
#Banner /etc/issue.net

# Subsystems
Subsystem sftp /usr/lib/openssh/sftp-server

# Allow/Deny Users (commented out - allows all users)
#AllowUsers admin deploy
#DenyUsers root

# Ciphers and MACs (using defaults - not hardened)
#Ciphers aes256-gcm@openssh.com,aes128-gcm@openssh.com
#MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

# Challenge Response
ChallengeResponseAuthentication no
UsePAM yes`,
  },
];

export function TerminalLab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AnalysisType>('security_report');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const currentTab = TABS.find(t => t.id === activeTab)!;

  const loadSampleData = () => {
    setInput(currentTab.sampleData);
    setOutput('');
    toast({ 
      title: 'Sample Loaded', 
      description: `${currentTab.sampleLabel} data loaded. Click "Generate Report" to analyze.` 
    });
  };

  const generateReport = async () => {
    if (!input.trim()) {
      toast({ title: 'Error', description: 'Please enter content to analyze', variant: 'destructive' });
      return;
    }

    if (!user) {
      toast({ title: 'Error', description: 'Please login to use AI analysis', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setOutput('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-analyze', {
        body: { type: activeTab, content: input }
      });

      if (error) throw error;

      setOutput(data.content);

      // Save report to database
      const { error: saveError } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          title: `${currentTab.label} - ${new Date().toLocaleString()}`,
          report_type: activeTab === 'config_audit' ? 'audit' : activeTab === 'log_analysis' ? 'log_analysis' : 'security',
          raw_input: input,
          generated_content: data.content,
        });

      if (saveError) {
        console.error('Failed to save report:', saveError);
      } else {
        toast({ title: 'Report Generated', description: 'Saved to Report Vault' });
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({ 
        title: 'Analysis Failed', 
        description: error.message || 'Failed to generate report', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast({ title: 'Copied', description: 'Report copied to clipboard' });
  };

  const downloadReport = () => {
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Terminal className="w-7 h-7 text-primary" />
          Terminal Lab
        </h2>
        <p className="text-muted-foreground">AI-powered security analysis and log parsing (Gemini 2.5 Pro)</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'cyber' : 'ghost'}
            onClick={() => {
              setActiveTab(tab.id);
              setInput('');
              setOutput('');
            }}
            className="gap-2"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Description & Sample Button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{currentTab.description}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSampleData}
          className="gap-2 text-primary border-primary/30 hover:bg-primary/10"
        >
          <Zap className="w-4 h-4" />
          {currentTab.sampleLabel}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Input Panel */}
        <div className="flex flex-col bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Raw Input
            </span>
            <Button
              variant="cyber"
              size="sm"
              onClick={generateReport}
              disabled={loading || !input.trim()}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentTab.placeholder}
            className="flex-1 resize-none border-0 rounded-none bg-background font-mono text-sm focus-visible:ring-0"
          />
        </div>

        {/* Output Panel */}
        <div className="flex flex-col bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">AI Analysis</span>
            {output && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadReport}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-sm">Analyzing with Google Gemini Pro...</p>
                <p className="text-xs text-muted-foreground mt-1">This may take a moment for complex analysis</p>
              </div>
            ) : output ? (
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-pre:bg-background prose-pre:border prose-pre:border-border">
                <ReactMarkdown>{output}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <currentTab.icon className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">Paste content or click "{currentTab.sampleLabel}"</p>
                <p className="text-xs mt-1">Then click "Generate Report" to analyze</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  Sparkles
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
}

const TABS: TabConfig[] = [
  {
    id: 'security_report',
    label: 'Security Report',
    icon: Shield,
    placeholder: `Paste your Nmap scan, vulnerability report, or penetration test output here...

Example:
Starting Nmap 7.94 scan...
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9
80/tcp   open  http    Apache httpd 2.4.52
443/tcp  open  https   nginx
3306/tcp open  mysql   MySQL 5.7.38`,
    description: 'Analyze security scan results and generate vulnerability reports',
  },
  {
    id: 'log_analysis',
    label: 'Log Parser',
    icon: FileSearch,
    placeholder: `Paste your Linux logs here (journalctl, syslog, auth.log, etc.)...

Example:
Jan 05 10:23:45 server sshd[1234]: Failed password for invalid user admin from 192.168.1.100
Jan 05 10:23:48 server sshd[1234]: Failed password for root from 192.168.1.100
Jan 05 10:24:01 server CRON[5678]: (root) CMD (/usr/bin/certbot renew)`,
    description: 'Parse and analyze Linux system logs for security events',
  },
  {
    id: 'config_audit',
    label: 'Config Auditor',
    icon: Terminal,
    placeholder: `Paste your configuration file here (sshd_config, sudoers, nginx.conf, etc.)...

Example sshd_config:
Port 22
PermitRootLogin yes
PasswordAuthentication yes
X11Forwarding yes
MaxAuthTries 6`,
    description: 'Audit configurations against RHCSA security standards',
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
        <p className="text-muted-foreground">AI-powered security analysis and log parsing</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'cyber' : 'ghost'}
            onClick={() => setActiveTab(tab.id)}
            className="gap-2"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4">{currentTab.description}</p>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Input Panel */}
        <div className="flex flex-col bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Raw Input</span>
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
                <p className="text-sm">Analyzing with Google Gemini...</p>
              </div>
            ) : output ? (
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-pre:bg-background prose-pre:border prose-pre:border-border">
                <ReactMarkdown>{output}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <currentTab.icon className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">Paste content and click "Generate Report"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Search, 
  Trash2, 
  Calendar, 
  Shield,
  FileSearch,
  Terminal,
  Loader2,
  Copy,
  Download,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface Report {
  id: string;
  title: string;
  report_type: string;
  raw_input: string | null;
  generated_content: string;
  severity: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, typeof Shield> = {
  security: Shield,
  audit: Terminal,
  log_analysis: FileSearch,
};

const TYPE_LABELS: Record<string, string> = {
  security: 'Security Report',
  audit: 'Config Audit',
  log_analysis: 'Log Analysis',
};

export function ReportVault() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load reports', variant: 'destructive' });
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const deleteReport = async (id: string) => {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete report', variant: 'destructive' });
    } else {
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
      toast({ title: 'Deleted', description: 'Report removed' });
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied', description: 'Report copied to clipboard' });
  };

  const downloadReport = (report: Report) => {
    const blob = new Blob([report.generated_content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.generated_content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Reports List */}
      <div className={cn(
        "border-r border-border flex flex-col transition-all",
        selectedReport ? "w-80" : "flex-1 max-w-2xl mx-auto"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3 mb-4">
            <FileText className="w-7 h-7 text-primary" />
            Report Vault
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="pl-10 bg-background"
            />
          </div>
        </div>

        {/* Reports List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 terminal-glow">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Reports Yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Generate reports in the Terminal Lab and they'll appear here.
              </p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const Icon = TYPE_ICONS[report.report_type] || FileText;
              const isSelected = selectedReport?.id === report.id;

              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    isSelected
                      ? "bg-primary/10 border-primary/30 terminal-glow"
                      : "bg-card border-border hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{report.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {TYPE_LABELS[report.report_type] || report.report_type}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteReport(report.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Report Detail View */}
      {selectedReport && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div>
              <h3 className="font-semibold text-foreground">{selectedReport.title}</h3>
              <p className="text-xs text-muted-foreground">
                {format(new Date(selectedReport.created_at), 'MMMM d, yyyy at HH:mm')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(selectedReport.generated_content)}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => downloadReport(selectedReport)}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-pre:bg-background prose-pre:border prose-pre:border-border">
              <ReactMarkdown>{selectedReport.generated_content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

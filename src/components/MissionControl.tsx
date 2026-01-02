import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Scan, 
  Bug, 
  Lock, 
  FileText, 
  Check, 
  Clock,
  Plus,
  Loader2,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Phase {
  id: string;
  phase_name: string;
  phase_order: number;
  notes: string | null;
  status: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
}

const PHASES = [
  { name: 'Reconnaissance', icon: Search, description: 'Gather target information' },
  { name: 'Scanning', icon: Scan, description: 'Identify vulnerabilities' },
  { name: 'Exploitation', icon: Bug, description: 'Gain access to target' },
  { name: 'Persistence', icon: Lock, description: 'Maintain access' },
  { name: 'Reporting', icon: FileText, description: 'Document findings' },
];

export function MissionControl() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      fetchPhases(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load projects', variant: 'destructive' });
    } else {
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0]);
      }
    }
    setLoading(false);
  };

  const fetchPhases = async (projectId: string) => {
    const { data, error } = await supabase
      .from('mission_phases')
      .select('*')
      .eq('project_id', projectId)
      .order('phase_order');

    if (error) {
      toast({ title: 'Error', description: 'Failed to load phases', variant: 'destructive' });
    } else {
      setPhases(data || []);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim() || !user) return;

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({ name: newProjectName, user_id: user.id })
      .select()
      .single();

    if (projectError) {
      toast({ title: 'Error', description: 'Failed to create project', variant: 'destructive' });
      return;
    }

    // Create default phases
    const phaseInserts = PHASES.map((phase, index) => ({
      project_id: project.id,
      phase_name: phase.name,
      phase_order: index,
      status: 'pending',
    }));

    const { error: phasesError } = await supabase
      .from('mission_phases')
      .insert(phaseInserts);

    if (phasesError) {
      toast({ title: 'Error', description: 'Failed to create phases', variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Project created' });
    setNewProjectName('');
    fetchProjects();
    setSelectedProject(project);
  };

  const updatePhase = async (phaseId: string, updates: Partial<Phase>) => {
    setSaving(true);
    const { error } = await supabase
      .from('mission_phases')
      .update(updates)
      .eq('id', phaseId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update phase', variant: 'destructive' });
    } else {
      setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, ...updates } : p));
    }
    setSaving(false);
  };

  const toggleStatus = (phase: Phase) => {
    const newStatus = phase.status === 'done' ? 'pending' : 'done';
    updatePhase(phase.id, { status: newStatus });
  };

  const getPhaseIcon = (phaseName: string) => {
    const phase = PHASES.find(p => p.name === phaseName);
    return phase?.icon || FileText;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Projects Sidebar */}
      <div className="w-64 border-r border-border p-4 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Projects</h2>
        
        <div className="flex gap-2">
          <Input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="New project..."
            className="flex-1 bg-background"
            onKeyDown={(e) => e.key === 'Enter' && createProject()}
          />
          <Button size="icon" variant="cyber" onClick={createProject}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-1">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg transition-all",
                selectedProject?.id === project.id
                  ? "bg-primary/10 border border-primary/30 text-primary"
                  : "hover:bg-secondary text-muted-foreground"
              )}
            >
              <span className="block text-sm font-medium truncate">{project.name}</span>
            </button>
          ))}
        </div>

        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No projects yet. Create one to get started.
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedProject ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedProject.name}</h2>
                <p className="text-muted-foreground text-sm">Hacking Lifecycle Tracker</p>
              </div>
              {saving && (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Saving...</span>
                </div>
              )}
            </div>

            <div className="relative space-y-6">
              {phases.map((phase, index) => {
                const Icon = getPhaseIcon(phase.phase_name);
                const phaseInfo = PHASES.find(p => p.name === phase.phase_name);
                const isDone = phase.status === 'done';

                return (
                  <div key={phase.id} className="relative flex gap-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    {/* Timeline connector */}
                    {index < phases.length - 1 && (
                      <div className="absolute left-5 top-12 w-0.5 h-[calc(100%-20px)] bg-gradient-to-b from-primary/40 to-transparent" />
                    )}

                    {/* Phase indicator */}
                    <div className={cn(
                      "relative z-10 w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                      isDone 
                        ? "bg-primary text-primary-foreground terminal-glow" 
                        : "bg-card border border-border"
                    )}>
                      {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5 text-muted-foreground" />}
                    </div>

                    {/* Phase content */}
                    <div className={cn(
                      "flex-1 bg-card border rounded-lg p-4 transition-all",
                      isDone ? "border-primary/30" : "border-border"
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{phase.phase_name}</h3>
                          <p className="text-xs text-muted-foreground">{phaseInfo?.description}</p>
                        </div>
                        <Button
                          variant={isDone ? "cyber" : "outline"}
                          size="sm"
                          onClick={() => toggleStatus(phase)}
                          className="gap-2"
                        >
                          {isDone ? (
                            <>
                              <Check className="w-4 h-4" /> Done
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4" /> Pending
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        value={phase.notes || ''}
                        onChange={(e) => updatePhase(phase.id, { notes: e.target.value })}
                        placeholder="Add notes for this phase..."
                        className="bg-background border-border min-h-[80px] text-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 terminal-glow">
              <Crosshair className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No Project Selected</h2>
            <p className="text-muted-foreground">Create or select a project to start tracking</p>
          </div>
        )}
      </div>
    </div>
  );
}

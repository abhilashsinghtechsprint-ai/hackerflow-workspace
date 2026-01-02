-- Create projects table for storing user projects and progress
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mission phases table for tracking hacking lifecycle phases
CREATE TABLE public.mission_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  phase_order INTEGER NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table for storing generated AI reports
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'security' CHECK (report_type IN ('security', 'audit', 'log_analysis')),
  raw_input TEXT,
  generated_content TEXT NOT NULL,
  severity TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
ON public.projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON public.projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.projects FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for mission_phases (through project ownership)
CREATE POLICY "Users can view phases of their projects"
ON public.mission_phases FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = mission_phases.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can create phases for their projects"
ON public.mission_phases FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = mission_phases.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update phases of their projects"
ON public.mission_phases FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = mission_phases.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete phases of their projects"
ON public.mission_phases FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = mission_phases.project_id 
  AND projects.user_id = auth.uid()
));

-- RLS Policies for reports
CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
ON public.reports FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mission_phases_updated_at
BEFORE UPDATE ON public.mission_phases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
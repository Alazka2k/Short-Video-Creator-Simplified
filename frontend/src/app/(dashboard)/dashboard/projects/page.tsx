import { Metadata } from 'next';
import { ProjectList } from '@/components/dashboard/projects/project-list';

export const metadata: Metadata = {
  title: 'Projects - Video Creator',
  description: 'Manage your video projects and drafts',
};

export default function ProjectsPage() {
  return (
    <div className="relative flex-1 space-y-8 p-8 pt-6">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute -top-1/4 right-1/3 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 left-1/3 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
      </div>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Projects
        </h2>
        <p className="text-muted-foreground mt-2">
          Manage your video projects and drafts
        </p>
      </div>

      {/* Content */}
      <div className="relative">
        <ProjectList />
      </div>
    </div>
  );
} 
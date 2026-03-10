import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  FolderKanban,
  Plus,
  Users,
  Settings,
  Calendar,
  ArrowRight,
  MoreHorizontal,
} from 'lucide-react'
import { CreateProjectDialog } from '@/components/create-project-dialog'

interface WorkspacePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: WorkspacePageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name')
    .eq('slug', slug)
    .single()

  return {
    title: workspace?.name || 'Workspace',
  }
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch workspace with membership check
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members!inner(role, user_id)
    `)
    .eq('slug', slug)
    .eq('workspace_members.user_id', user?.id)
    .single()

  if (error || !workspace) {
    notFound()
  }

  // Fetch projects for this workspace
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      tasks(count)
    `)
    .eq('workspace_id', workspace.id)
    .order('updated_at', { ascending: false })

  // Fetch workspace members
  const { data: members } = await supabase
    .from('workspace_members')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('workspace_id', workspace.id)
    .order('joined_at', { ascending: false })
    .limit(5)

  const userRole = workspace.workspace_members.find(
    (m: { user_id: string; role: string }) => m.user_id === user?.id
  )?.role

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500'
      case 'on_hold':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'completed':
        return 'bg-blue-500/10 text-blue-500'
      case 'archived':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-2xl font-bold text-primary">
              {workspace.name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{workspace.name}</h1>
            <p className="text-muted-foreground">
              {workspace.description || 'No description'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(userRole === 'owner' || userRole === 'admin') && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workspaces/${slug}/members`}>
                  <Users className="mr-2 h-4 w-4" />
                  Members
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workspaces/${slug}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </>
          )}
          <CreateProjectDialog workspaceId={workspace.id} workspaceSlug={slug} />
        </div>
      </div>

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Badge variant="secondary">{projects?.length || 0} projects</Badge>
        </div>

        {!projects || projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                Get started by creating your first project to organize and track your team&apos;s work.
              </p>
              <CreateProjectDialog 
                workspaceId={workspace.id} 
                workspaceSlug={slug}
                className="mt-4"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/workspaces/${slug}/projects/${project.slug}`}
              >
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <Badge variant="secondary" className={getStatusColor(project.status)}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{project.tasks?.[0]?.count || 0} tasks</span>
                      {project.end_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(project.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>People with access to this workspace</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/workspaces/${slug}/members`}>
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {members?.map((member) => (
              <div key={member.id} className="group relative">
                <Avatar className="h-10 w-10 border-2 border-background">
                  <AvatarImage src={member.profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {member.profile?.full_name?.[0]?.toUpperCase() || 
                     member.profile?.email?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  {member.profile?.full_name || member.profile?.email}
                </div>
              </div>
            ))}
            {members && members.length > 4 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25 text-xs text-muted-foreground">
                +{(members?.length || 0) - 4}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

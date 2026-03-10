import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Plus,
  TrendingUp,
  Users,
  Calendar,
} from 'lucide-react'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's workspaces with project counts
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members!inner(role),
      projects(count)
    `)
    .eq('workspace_members.user_id', user?.id)
    .order('updated_at', { ascending: false })
    .limit(5)

  // Fetch recent tasks assigned to user
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects(name, workspace:workspaces(slug))
    `)
    .eq('assigned_to', user?.id)
    .in('status', ['todo', 'in_progress', 'in_review'])
    .order('updated_at', { ascending: false })
    .limit(5)

  // Fetch task statistics
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', user?.id)

  const { count: completedTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', user?.id)
    .eq('status', 'done')

  const { count: inProgressTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', user?.id)
    .eq('status', 'in_progress')

  const { count: overdueTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', user?.id)
    .lt('due_date', new Date().toISOString())
    .in('status', ['todo', 'in_progress', 'in_review'])

  const completionRate = totalTasks ? Math.round((completedTasks || 0) / totalTasks * 100) : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-muted text-muted-foreground'
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500'
      case 'in_review':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'done':
        return 'bg-green-500/10 text-green-500'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-500'
      case 'high':
        return 'bg-orange-500/10 text-orange-500'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'low':
        return 'bg-green-500/10 text-green-500'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your work.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently working on
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks || 0}</div>
            <div className="mt-1 flex items-center gap-2">
              <Progress value={completionRate} className="h-1" />
              <span className="text-xs text-muted-foreground">{completionRate}%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Tasks assigned to you</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tasks">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!recentTasks || recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No tasks assigned to you yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.project?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workspaces */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Workspaces</CardTitle>
              <CardDescription>Quick access to your workspaces</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/workspaces">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!workspaces || workspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No workspaces yet
                </p>
                <Button size="sm" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create workspace
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {workspaces.map((workspace) => (
                  <Link
                    key={workspace.id}
                    href={`/workspaces/${workspace.slug}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <span className="text-lg font-semibold text-primary">
                        {workspace.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{workspace.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {workspace.projects?.[0]?.count || 0} projects
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {workspace.workspace_members[0]?.role}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

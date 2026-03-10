import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LayoutGrid,
  List,
  Settings,
  Calendar,
  BarChart3,
} from 'lucide-react'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { ProjectHeader } from '@/components/project-header'

interface ProjectPageProps {
  params: Promise<{ slug: string; projectSlug: string }>
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug, projectSlug } = await params
  const supabase = await createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('slug', projectSlug)
    .single()

  return {
    title: project?.name || 'Project',
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug, projectSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*, workspace_members!inner(role)')
    .eq('slug', slug)
    .eq('workspace_members.user_id', user?.id)
    .single()

  if (!workspace) {
    notFound()
  }

  // Fetch project with board and columns
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      boards(
        *,
        columns:board_columns(
          *,
          tasks(
            *,
            assignee:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url, email),
            labels:task_labels(
              label:labels(*)
            )
          )
        )
      )
    `)
    .eq('slug', projectSlug)
    .eq('workspace_id', workspace.id)
    .single()

  if (error || !project) {
    notFound()
  }

  // Fetch workspace labels
  const { data: labels } = await supabase
    .from('labels')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('name')

  // Fetch workspace members for assignment
  const { data: members } = await supabase
    .from('workspace_members')
    .select('*, profile:profiles(*)')
    .eq('workspace_id', workspace.id)

  // Get the first board (or create one if none exists)
  let board = project.boards?.[0]
  
  if (!board) {
    // Create default board with columns
    const { data: newBoard } = await supabase
      .from('boards')
      .insert({
        project_id: project.id,
        name: 'Main Board',
        position: 0,
      })
      .select()
      .single()

    if (newBoard) {
      // Create default columns
      const defaultColumns = [
        { name: 'Backlog', color: '#6b7280', position: 0 },
        { name: 'To Do', color: '#3b82f6', position: 1 },
        { name: 'In Progress', color: '#f59e0b', position: 2 },
        { name: 'In Review', color: '#8b5cf6', position: 3 },
        { name: 'Done', color: '#22c55e', position: 4 },
      ]

      await supabase.from('board_columns').insert(
        defaultColumns.map((col) => ({
          board_id: newBoard.id,
          ...col,
        }))
      )

      // Refetch the board with columns
      const { data: refetchedBoard } = await supabase
        .from('boards')
        .select(`
          *,
          columns:board_columns(
            *,
            tasks(
              *,
              assignee:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url, email),
              labels:task_labels(
                label:labels(*)
              )
            )
          )
        `)
        .eq('id', newBoard.id)
        .single()

      board = refetchedBoard
    }
  }

  // Sort columns by position
  const sortedColumns = board?.columns?.sort((a: { position: number }, b: { position: number }) => a.position - b.position) || []

  return (
    <div className="flex flex-col h-full">
      <ProjectHeader
        project={project}
        workspace={workspace}
        workspaceSlug={slug}
      />
      
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="board" className="h-full flex flex-col">
          <div className="border-b px-6">
            <TabsList className="h-10 bg-transparent p-0">
              <TabsTrigger
                value="board"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Board
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <List className="mr-2 h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="board" className="flex-1 m-0 overflow-hidden">
            <KanbanBoard
              projectId={project.id}
              boardId={board?.id}
              columns={sortedColumns}
              labels={labels || []}
              members={members || []}
              workspaceSlug={slug}
              projectSlug={projectSlug}
            />
          </TabsContent>

          <TabsContent value="list" className="flex-1 m-0 p-6">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              List view coming soon
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="flex-1 m-0 p-6">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Calendar view coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

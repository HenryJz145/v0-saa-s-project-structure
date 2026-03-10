'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { KanbanColumn } from './kanban-column'
import { CreateTaskDialog } from './create-task-dialog'
import { TaskDetailSheet } from './task-detail-sheet'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus, Filter } from 'lucide-react'
import type { Task, BoardColumn, Label, Profile, WorkspaceMember } from '@/lib/types/database'

interface KanbanBoardProps {
  projectId: string
  boardId: string
  columns: (BoardColumn & { tasks: Task[] })[]
  labels: Label[]
  members: (WorkspaceMember & { profile: Profile })[]
  workspaceSlug: string
  projectSlug: string
}

export function KanbanBoard({
  projectId,
  boardId,
  columns,
  labels,
  members,
  workspaceSlug,
  projectSlug,
}: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createColumnId, setCreateColumnId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task)
    setIsTaskSheetOpen(true)
  }, [])

  const handleCreateTask = useCallback((columnId: string) => {
    setCreateColumnId(columnId)
    setIsCreating(true)
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.setData('sourceColumnId', task.column_id || '')
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    const sourceColumnId = e.dataTransfer.getData('sourceColumnId')

    if (sourceColumnId === targetColumnId) return

    const supabase = createClient()

    // Get the column's status mapping
    const targetColumn = columns.find(c => c.id === targetColumnId)
    const statusMap: Record<string, string> = {
      'Backlog': 'backlog',
      'To Do': 'todo',
      'In Progress': 'in_progress',
      'In Review': 'in_review',
      'Done': 'done',
    }
    const newStatus = statusMap[targetColumn?.name || ''] || 'todo'

    const { error } = await supabase
      .from('tasks')
      .update({
        column_id: targetColumnId,
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      })
      .eq('id', taskId)

    if (error) {
      toast.error('Failed to move task')
      return
    }

    router.refresh()
  }, [columns, router])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
        <CreateTaskDialog
          projectId={projectId}
          boardId={boardId}
          columnId={columns[0]?.id}
          labels={labels}
          members={members}
          onSuccess={() => router.refresh()}
        />
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={column.tasks || []}
              onTaskClick={handleTaskClick}
              onCreateTask={() => handleCreateTask(column.id)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={handleDragOver}
              isDragging={isDragging}
            />
          ))}
        </div>
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={isTaskSheetOpen}
        onOpenChange={setIsTaskSheetOpen}
        labels={labels}
        members={members}
        onUpdate={() => {
          router.refresh()
        }}
      />

      <CreateTaskDialog
        projectId={projectId}
        boardId={boardId}
        columnId={createColumnId || columns[0]?.id}
        labels={labels}
        members={members}
        open={isCreating}
        onOpenChange={setIsCreating}
        onSuccess={() => {
          setIsCreating(false)
          setCreateColumnId(null)
          router.refresh()
        }}
      />
    </div>
  )
}

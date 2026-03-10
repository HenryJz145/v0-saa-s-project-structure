'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { KanbanColumn } from './kanban-column'
import { CreateTaskDialog } from './create-task-dialog'
import { TaskDetailSheet } from './task-detail-sheet'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Filter } from 'lucide-react'
import type { Task, BoardList, Tag, WorkspaceMembershipWithProfile, TaskStatus } from '@/lib/types/database'

interface KanbanBoardProps {
  projectId: string
  boardId: string
  boardLists: (BoardList & { tasks: Task[] })[]
  tags: Tag[]
  members: WorkspaceMembershipWithProfile[]
  workspaceId: string
}

// Map board list names to task status
const statusMap: Record<string, TaskStatus> = {
  'Backlog': 'backlog',
  'Pending': 'pending',
  'To Do': 'pending',
  'In Progress': 'ongoing',
  'Ongoing': 'ongoing',
  'In Review': 'ongoing',
  'Done': 'complete',
  'Complete': 'complete',
  'Archived': 'archived',
}

export function KanbanBoard({
  projectId,
  boardId,
  boardLists,
  tags,
  members,
  workspaceId,
}: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createListId, setCreateListId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task)
    setIsTaskSheetOpen(true)
  }, [])

  const handleCreateTask = useCallback((listId: string) => {
    setCreateListId(listId)
    setIsCreating(true)
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.setData('sourceListId', task.board_list_id || '')
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, targetListId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    const sourceListId = e.dataTransfer.getData('sourceListId')

    if (sourceListId === targetListId) return

    const supabase = createClient()

    // Get the target list to determine new status
    const targetList = boardLists.find(l => l.id === targetListId)
    const newStatus = statusMap[targetList?.name || ''] || 'pending'

    const updateData: {
      board_list_id: string
      status: TaskStatus
      completed_at?: string | null
      started_at?: string | null
    } = {
      board_list_id: targetListId,
      status: newStatus,
      completed_at: newStatus === 'complete' ? new Date().toISOString() : null,
    }

    // Set started_at when moving to ongoing
    if (newStatus === 'ongoing') {
      updateData.started_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)

    if (error) {
      toast.error('Failed to move task')
      return
    }

    router.refresh()
  }, [boardLists, router])

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
          boardListId={boardLists[0]?.id}
          tags={tags}
          members={members}
          workspaceId={workspaceId}
          onSuccess={() => router.refresh()}
        />
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {boardLists.map((list) => (
            <KanbanColumn
              key={list.id}
              boardList={list}
              tasks={list.tasks || []}
              onTaskClick={handleTaskClick}
              onCreateTask={() => handleCreateTask(list.id)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, list.id)}
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
        tags={tags}
        members={members}
        workspaceId={workspaceId}
        onUpdate={() => {
          router.refresh()
        }}
      />

      <CreateTaskDialog
        projectId={projectId}
        boardId={boardId}
        boardListId={createListId || boardLists[0]?.id}
        tags={tags}
        members={members}
        workspaceId={workspaceId}
        open={isCreating}
        onOpenChange={setIsCreating}
        onSuccess={() => {
          setIsCreating(false)
          setCreateListId(null)
          router.refresh()
        }}
      />
    </div>
  )
}

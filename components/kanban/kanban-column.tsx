'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KanbanCard } from './kanban-card'
import { Plus, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, BoardColumn } from '@/lib/types/database'

interface KanbanColumnProps {
  column: BoardColumn
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onCreateTask: () => void
  onDragStart: (e: React.DragEvent, task: Task) => void
  onDragEnd: () => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  isDragging: boolean
}

export function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  onCreateTask,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  isDragging,
}: KanbanColumnProps) {
  // Sort tasks by position
  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position)

  return (
    <div
      className={cn(
        'flex flex-col w-72 shrink-0 rounded-lg bg-muted/30',
        isDragging && 'ring-2 ring-primary/20'
      )}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-medium text-sm">{column.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCreateTask}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
        {sortedTasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            onDragStart={(e) => onDragStart(e, task)}
            onDragEnd={onDragEnd}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p className="text-sm">No tasks</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={onCreateTask}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add task
            </Button>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={onCreateTask}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      </div>
    </div>
  )
}

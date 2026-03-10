'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, MessageSquare, Paperclip, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskWithRelations, TaskStatus } from '@/lib/types/database'

interface KanbanCardProps {
  task: Task | TaskWithRelations
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
}

// Status color mapping
const statusColorMap: Record<TaskStatus, string> = {
  'pending': 'bg-yellow-500',
  'backlog': 'bg-muted-foreground',
  'ongoing': 'bg-blue-500',
  'complete': 'bg-green-500',
  'archived': 'bg-muted-foreground/50',
}

export function KanbanCard({ task, onClick, onDragStart, onDragEnd }: KanbanCardProps) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'complete'
  
  // Check if task has relations
  const taskWithRelations = task as TaskWithRelations
  const hasAssignees = taskWithRelations.assignees && taskWithRelations.assignees.length > 0
  const hasTags = taskWithRelations.tags && taskWithRelations.tags.length > 0
  const hasComments = taskWithRelations.comments && taskWithRelations.comments.length > 0
  const hasAttachments = taskWithRelations.attachments && taskWithRelations.attachments.length > 0

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:ring-2 hover:ring-primary/20',
        'active:scale-[0.98]'
      )}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      {/* Status indicator and tags */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('h-1.5 w-1.5 rounded-full', statusColorMap[task.status])} />
        {hasTags && (
          <div className="flex gap-1 flex-wrap">
            {taskWithRelations.tags.slice(0, 3).map((tt) => (
              tt.tag && (
                <Badge
                  key={tt.tag.id}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                  style={{
                    backgroundColor: `${tt.tag.color}20`,
                    color: tt.tag.color,
                  }}
                >
                  {tt.tag.name}
                </Badge>
              )
            ))}
            {taskWithRelations.tags.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{taskWithRelations.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Time tracking info */}
      {(task.estimated_time_minutes || task.actual_time_minutes) && (
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {task.actual_time_minutes ? (
            <span>
              {Math.floor(task.actual_time_minutes / 60)}h {task.actual_time_minutes % 60}m
              {task.estimated_time_minutes && (
                <span className="text-muted-foreground/70">
                  {' '}/ {Math.floor(task.estimated_time_minutes / 60)}h est
                </span>
              )}
            </span>
          ) : (
            task.estimated_time_minutes && (
              <span>{Math.floor(task.estimated_time_minutes / 60)}h {task.estimated_time_minutes % 60}m est</span>
            )
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          {task.due_date && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue && 'text-destructive'
            )}>
              <Calendar className="h-3 w-3" />
              {new Date(task.due_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          )}
          {hasComments && (
            <div className="flex items-center gap-1 text-xs">
              <MessageSquare className="h-3 w-3" />
              {taskWithRelations.comments.length}
            </div>
          )}
          {hasAttachments && (
            <div className="flex items-center gap-1 text-xs">
              <Paperclip className="h-3 w-3" />
              {taskWithRelations.attachments.length}
            </div>
          )}
        </div>

        {/* Assignees */}
        {hasAssignees && (
          <div className="flex -space-x-1">
            {taskWithRelations.assignees.slice(0, 3).map((assignee) => (
              <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={assignee.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {assignee.profile?.name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            ))}
            {taskWithRelations.assignees.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                +{taskWithRelations.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

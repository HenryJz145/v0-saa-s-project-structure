'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, MessageSquare, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/lib/types/database'

interface KanbanCardProps {
  task: Task
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
}

export function KanbanCard({ task, onClick, onDragStart, onDragEnd }: KanbanCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-muted'
    }
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

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
      {/* Priority indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('h-1.5 w-1.5 rounded-full', getPriorityColor(task.priority))} />
        {task.labels && task.labels.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {task.labels.slice(0, 3).map((tl: { label?: { id: string; name: string; color: string } }) => (
              tl.label && (
                <Badge
                  key={tl.label.id}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                  style={{
                    backgroundColor: `${tl.label.color}20`,
                    color: tl.label.color,
                  }}
                >
                  {tl.label.name}
                </Badge>
              )
            ))}
            {task.labels.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{task.labels.length - 3}
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
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <MessageSquare className="h-3 w-3" />
              {task.comments.length}
            </div>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Paperclip className="h-3 w-3" />
              {task.attachments.length}
            </div>
          )}
        </div>

        {task.assignee && (
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.assignee.avatar_url || undefined} />
            <AvatarFallback className="text-[10px]">
              {task.assignee.full_name?.[0]?.toUpperCase() ||
               task.assignee.email?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </Card>
  )
}

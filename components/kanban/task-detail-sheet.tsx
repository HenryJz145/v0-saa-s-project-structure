'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import {
  CalendarIcon,
  X,
  MessageSquare,
  Paperclip,
  Trash2,
  User,
  Flag,
  Tag,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Task, Label as LabelType, Profile, WorkspaceMember } from '@/lib/types/database'

interface TaskDetailSheetProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  labels: LabelType[]
  members: (WorkspaceMember & { profile: Profile })[]
  onUpdate: () => void
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  labels,
  members,
  onUpdate,
}: TaskDetailSheetProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [assigneeId, setAssigneeId] = useState<string | undefined>()
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setAssigneeId(task.assigned_to || undefined)
      setDueDate(task.due_date ? new Date(task.due_date) : undefined)
      setSelectedLabels(task.labels?.map((tl: any) => tl.label?.id).filter(Boolean) || [])
      fetchComments()
    }
  }, [task])

  const fetchComments = async () => {
    if (!task) return
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select('*, user:profiles(*)')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false })
    setComments(data || [])
  }

  const handleUpdate = async (field: string, value: any) => {
    if (!task) return
    const supabase = createClient()

    const updates: any = { [field]: value }
    if (field === 'status' && value === 'done') {
      updates.completed_at = new Date().toISOString()
    } else if (field === 'status' && value !== 'done') {
      updates.completed_at = null
    }

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id)

    if (error) {
      toast.error('Failed to update task')
      return
    }

    onUpdate()
  }

  const handleLabelToggle = async (labelId: string) => {
    if (!task) return
    const supabase = createClient()

    if (selectedLabels.includes(labelId)) {
      await supabase
        .from('task_labels')
        .delete()
        .eq('task_id', task.id)
        .eq('label_id', labelId)
      setSelectedLabels((prev) => prev.filter((id) => id !== labelId))
    } else {
      await supabase
        .from('task_labels')
        .insert({ task_id: task.id, label_id: labelId })
      setSelectedLabels((prev) => [...prev, labelId])
    }
    onUpdate()
  }

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('You must be logged in')
      return
    }

    const { error } = await supabase.from('comments').insert({
      task_id: task.id,
      user_id: user.id,
      content: newComment.trim(),
    })

    if (error) {
      toast.error('Failed to add comment')
      return
    }

    setNewComment('')
    fetchComments()
    onUpdate()
  }

  const handleDeleteTask = async () => {
    if (!task) return
    const supabase = createClient()

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id)

    if (error) {
      toast.error('Failed to delete task')
      return
    }

    toast.success('Task deleted')
    onOpenChange(false)
    onUpdate()
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-muted-foreground'
    }
  }

  if (!task) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="sr-only">Task Details</SheetTitle>
          <SheetDescription className="sr-only">
            View and edit task details
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleUpdate('title', title)}
              className="text-xl font-semibold border-none px-0 focus-visible:ring-0"
              placeholder="Task title"
            />
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Select
                value={assigneeId || 'unassigned'}
                onValueChange={(value) => {
                  const newValue = value === 'unassigned' ? null : value
                  setAssigneeId(newValue || undefined)
                  handleUpdate('assigned_to', newValue)
                }}
              >
                <SelectTrigger className="w-40 h-8">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {member.profile?.full_name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">
                          {member.profile?.full_name || member.profile?.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Flag className={cn('h-4 w-4', getPriorityColor(priority))} />
              <Select
                value={priority}
                onValueChange={(value) => {
                  setPriority(value)
                  handleUpdate('priority', value)
                }}
              >
                <SelectTrigger className="w-28 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'justify-start',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date)
                    handleUpdate('due_date', date?.toISOString() || null)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleUpdate('description', description || null)}
              placeholder="Add a description..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Labels */}
          {labels.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Labels
              </Label>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <Badge
                    key={label.id}
                    variant={selectedLabels.includes(label.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    style={{
                      backgroundColor: selectedLabels.includes(label.id) ? label.color : 'transparent',
                      borderColor: label.color,
                      color: selectedLabels.includes(label.id) ? 'white' : label.color,
                    }}
                    onClick={() => handleLabelToggle(label.id)}
                  >
                    {label.name}
                    {selectedLabels.includes(label.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Comments */}
          <div className="space-y-4">
            <Label className="text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </Label>

            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={2}
                className="resize-none"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                size="sm"
              >
                Post
              </Button>
            </div>

            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {comment.user?.full_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.user?.full_name || comment.user?.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteTask}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete task
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { Plus, CalendarIcon, X, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Tag, WorkspaceMembershipWithProfile, TaskStatus } from '@/lib/types/database'

interface CreateTaskDialogProps {
  projectId: string
  boardId: string
  boardListId: string
  tags: Tag[]
  members: WorkspaceMembershipWithProfile[]
  workspaceId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateTaskDialog({
  projectId,
  boardId,
  boardListId,
  tags,
  members,
  workspaceId,
  open,
  onOpenChange,
  onSuccess,
}: CreateTaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [estimatedHours, setEstimatedHours] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('You must be logged in')
      setIsLoading(false)
      return
    }

    // Get max position in board list
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('position')
      .eq('board_list_id', boardListId)
      .order('position', { ascending: false })
      .limit(1)

    const position = existingTasks?.[0]?.position !== undefined 
      ? existingTasks[0].position + 1 
      : 0

    // Calculate estimated time in minutes
    const estimatedTimeMinutes = 
      (parseInt(estimatedHours || '0') * 60) + parseInt(estimatedMinutes || '0') || null

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        board_id: boardId,
        board_list_id: boardListId,
        title: title.trim(),
        description: description.trim() || null,
        status,
        position,
        estimated_time_minutes: estimatedTimeMinutes,
        due_date: dueDate?.toISOString().split('T')[0] || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    // Add task assignees
    if (assigneeIds.length > 0) {
      const assigneeInserts = assigneeIds.map((userId) => ({
        task_id: task.id,
        user_id: userId,
        assigned_by: user.id,
      }))
      
      const { error: assigneeError } = await supabase
        .from('task_assignees')
        .insert(assigneeInserts)
      
      if (assigneeError) {
        console.error('Failed to add assignees:', assigneeError)
      }
    }

    // Add task tags
    if (selectedTags.length > 0) {
      const tagInserts = selectedTags.map((tagId) => ({
        task_id: task.id,
        tag_id: tagId,
      }))
      
      const { error: tagError } = await supabase
        .from('task_tags')
        .insert(tagInserts)
      
      if (tagError) {
        console.error('Failed to add tags:', tagError)
      }
    }

    toast.success('Task created successfully!')
    resetForm()
    setIsOpen(false)
    setIsLoading(false)
    onSuccess?.()
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStatus('pending')
    setAssigneeIds([])
    setDueDate(undefined)
    setEstimatedHours('')
    setEstimatedMinutes('')
    setSelectedTags([])
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!open && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
            <DialogDescription>
              Add a new task to your project board.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="backlog">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                        Backlog
                      </div>
                    </SelectItem>
                    <SelectItem value="ongoing">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        Ongoing
                      </div>
                    </SelectItem>
                    <SelectItem value="complete">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Complete
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dueDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Estimated time
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">hours</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assignees</Label>
              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1 rounded-md border cursor-pointer transition-colors',
                      assigneeIds.includes(member.user_id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    )}
                    onClick={() => toggleAssignee(member.user_id)}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {member.profile?.name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.profile?.name || 'Unknown'}</span>
                    {assigneeIds.includes(member.user_id) && (
                      <X className="h-3 w-3" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {tags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      style={{
                        backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                        borderColor: tag.color,
                        color: selectedTags.includes(tag.id) ? 'white' : tag.color,
                      }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      {selectedTags.includes(tag.id) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

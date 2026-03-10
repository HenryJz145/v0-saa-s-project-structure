export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived'
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type SubscriptionTier = 'free' | 'pro' | 'business' | 'enterprise'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  invited_by: string | null
  joined_at: string
  updated_at: string
  profile?: Profile
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  slug: string
  description: string | null
  status: ProjectStatus
  color: string
  icon: string | null
  start_date: string | null
  end_date: string | null
  created_by: string
  created_at: string
  updated_at: string
  workspace?: Workspace
}

export interface Board {
  id: string
  project_id: string
  name: string
  description: string | null
  position: number
  created_at: string
  updated_at: string
  columns?: BoardColumn[]
}

export interface BoardColumn {
  id: string
  board_id: string
  name: string
  color: string
  position: number
  wip_limit: number | null
  created_at: string
  updated_at: string
  tasks?: Task[]
}

export interface Task {
  id: string
  project_id: string
  board_id: string | null
  column_id: string | null
  parent_task_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  position: number
  due_date: string | null
  estimated_hours: number | null
  actual_hours: number | null
  created_by: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  assignee?: Profile
  creator?: Profile
  labels?: TaskLabel[]
  comments?: Comment[]
  attachments?: Attachment[]
  subtasks?: Task[]
}

export interface Label {
  id: string
  workspace_id: string
  name: string
  color: string
  created_at: string
}

export interface TaskLabel {
  task_id: string
  label_id: string
  label?: Label
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: Profile
}

export interface Attachment {
  id: string
  task_id: string
  uploaded_by: string
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  created_at: string
  uploader?: Profile
}

export interface Subscription {
  id: string
  workspace_id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  workspace_id: string
  user_id: string
  entity_type: string
  entity_id: string
  action: string
  metadata: Record<string, unknown> | null
  created_at: string
  user?: Profile
}

// Extended types for UI
export interface WorkspaceWithMembers extends Workspace {
  members: WorkspaceMember[]
  subscription?: Subscription
}

export interface ProjectWithTasks extends Project {
  tasks: Task[]
  boards: Board[]
}

export interface BoardWithColumns extends Board {
  columns: BoardColumn[]
}

export interface TaskWithRelations extends Task {
  assignee: Profile | null
  creator: Profile
  labels: (TaskLabel & { label: Label })[]
  comments: (Comment & { user: Profile })[]
  attachments: (Attachment & { uploader: Profile })[]
  subtasks: Task[]
}

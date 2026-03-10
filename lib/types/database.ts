// Enums matching database schema
export type WorkspaceRole = 'owner' | 'admin' | 'member'
export type MembershipStatus = 'invited' | 'active' | 'removed'
export type ProjectStatus = 'active' | 'archived' | 'deleted'
export type BoardType = 'kanban' | 'list' | 'gantt'
export type BoardStatus = 'active' | 'archived'
export type TaskStatus = 'pending' | 'backlog' | 'ongoing' | 'complete' | 'archived'
export type SubscriptionPlan = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due'
export type RenewalPeriod = 'monthly' | 'yearly'

// Profile extends auth.users
export interface Profile {
  id: string
  name: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

// Workspace
export interface Workspace {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
}

// Workspace Membership
export interface WorkspaceMembership {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  status: MembershipStatus
  invited_by: string | null
  invite_email: string | null
  invite_token: string | null
  joined_at: string | null
  left_at: string | null
  created_at: string
  updated_at: string
}

// Project
export interface Project {
  id: string
  workspace_id: string
  name: string
  description: string | null
  status: ProjectStatus
  performance_metrics: Record<string, unknown> | null
  created_by: string
  created_at: string
  updated_at: string
}

// Board
export interface Board {
  id: string
  project_id: string
  name: string
  type: BoardType
  status: BoardStatus
  created_by: string
  created_at: string
  updated_at: string
}

// Board List (columns in Kanban)
export interface BoardList {
  id: string
  board_id: string
  name: string
  position: number
  created_at: string
  updated_at: string
}

// Task
export interface Task {
  id: string
  board_id: string
  board_list_id: string | null
  project_id: string
  parent_task_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  position: number
  estimated_time_minutes: number | null
  actual_time_minutes: number | null
  performance_score: number | null
  due_date: string | null
  created_by: string
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
  archived_at: string | null
}

// Task Assignee
export interface TaskAssignee {
  id: string
  task_id: string
  user_id: string
  assigned_by: string | null
  assigned_at: string
  unassigned_at: string | null
}

// Task Comment
export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  message: string
  created_at: string
  updated_at: string
}

// Tag (used for labeling tasks)
export interface Tag {
  id: string
  workspace_id: string
  name: string
  color: string
  created_at: string
}

// Task Tag junction
export interface TaskTag {
  id: string
  task_id: string
  tag_id: string
  created_at: string
}

// Attachment
export interface Attachment {
  id: string
  workspace_id: string
  project_id: string | null
  board_id: string | null
  task_id: string | null
  uploaded_by: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  created_at: string
  deleted_at: string | null
}

// Subscription
export interface Subscription {
  id: string
  user_id: string
  workspace_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  started_at: string
  ended_at: string | null
  renewal_period: RenewalPeriod
  current_period_end: string | null
}

// Audit Log
export interface AuditLog {
  id: string
  user_id: string
  workspace_id: string
  project_id: string | null
  action: string
  entity_type: string
  entity_id: string
  details: Record<string, unknown> | null
  created_at: string
}

// Extended types for UI with relations
export interface WorkspaceMembershipWithProfile extends WorkspaceMembership {
  profile: Profile
}

export interface WorkspaceWithMembers extends Workspace {
  memberships: WorkspaceMembershipWithProfile[]
}

export interface BoardListWithTasks extends BoardList {
  tasks: TaskWithRelations[]
}

export interface BoardWithLists extends Board {
  board_lists: BoardListWithTasks[]
}

export interface TaskWithRelations extends Task {
  assignees: (TaskAssignee & { profile: Profile })[]
  creator: Profile
  tags: (TaskTag & { tag: Tag })[]
  comments: (TaskComment & { profile: Profile })[]
  attachments: Attachment[]
  subtasks: Task[]
}

export interface ProjectWithBoards extends Project {
  boards: Board[]
}

// Helper type for user from auth
export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    name?: string
    avatar_url?: string
  }
}

// Combined user type for UI
export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
}

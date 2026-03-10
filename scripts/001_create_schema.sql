-- Taskflow SaaS Database Schema
-- This script creates all tables for the task management system

------------------------------------------------------
-- EXTENSIONS
------------------------------------------------------
create extension if not exists "uuid-ossp";

------------------------------------------------------
-- ENUMS
------------------------------------------------------

-- User roles within a workspace
create type user_role as enum ('owner', 'admin', 'member');

-- Workspace membership status
create type membership_status as enum ('invited', 'active', 'removed');

-- Project status
create type project_status as enum ('active', 'archived', 'deleted');

-- Board view types
create type board_type as enum ('kanban', 'list', 'gantt');

-- Board status
create type board_status as enum ('active', 'archived');

-- Task status
create type task_status as enum ('pending', 'backlog', 'ongoing', 'complete', 'archived');

-- Subscription plans
create type subscription_plan as enum ('free', 'pro');

-- Subscription status
create type subscription_status as enum ('active', 'canceled', 'past_due');

-- Billing period
create type renewal_period as enum ('monthly', 'yearly');

------------------------------------------------------
-- PROFILES (extends auth.users)
------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name varchar(255),
  avatar_url varchar(500),
  phone varchar(50),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

------------------------------------------------------
-- WORKSPACES
------------------------------------------------------

create table if not exists public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

------------------------------------------------------
-- WORKSPACE MEMBERSHIPS
------------------------------------------------------

create table if not exists public.workspace_memberships (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role user_role not null default 'member',
  invited_by uuid references auth.users(id) on delete set null,
  invite_email varchar(255),
  invite_token varchar(255),
  status membership_status not null default 'invited',
  joined_at timestamp with time zone,
  left_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(workspace_id, user_id)
);

-- Index for invite token lookups
create index if not exists idx_workspace_memberships_invite_token on public.workspace_memberships(invite_token);

------------------------------------------------------
-- PROJECTS
------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name varchar(255) not null,
  description text,
  status project_status not null default 'active',
  performance_metrics jsonb default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for workspace lookups
create index if not exists idx_projects_workspace_id on public.projects(workspace_id);

------------------------------------------------------
-- BOARDS
------------------------------------------------------

create table if not exists public.boards (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name varchar(255) not null,
  type board_type not null default 'kanban',
  status board_status not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for project lookups
create index if not exists idx_boards_project_id on public.boards(project_id);

------------------------------------------------------
-- BOARD LISTS (columns in kanban)
------------------------------------------------------

create table if not exists public.board_lists (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references public.boards(id) on delete cascade,
  name varchar(255) not null,
  position int not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for board lookups
create index if not exists idx_board_lists_board_id on public.board_lists(board_id);

------------------------------------------------------
-- TASKS
------------------------------------------------------

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references public.boards(id) on delete cascade,
  board_list_id uuid references public.board_lists(id) on delete set null,
  project_id uuid not null references public.projects(id) on delete cascade,
  title varchar(500) not null,
  description text,
  status task_status not null default 'pending',
  position int not null default 0,
  estimated_time_minutes int,
  actual_time_minutes int default 0,
  performance_score float,
  due_date date,
  created_by uuid references auth.users(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  archived_at timestamp with time zone
);

-- Indexes for common lookups
create index if not exists idx_tasks_board_id on public.tasks(board_id);
create index if not exists idx_tasks_board_list_id on public.tasks(board_list_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_parent_task_id on public.tasks(parent_task_id);

------------------------------------------------------
-- TASK ASSIGNEES
------------------------------------------------------

create table if not exists public.task_assignees (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  assigned_at timestamp with time zone default now(),
  assigned_by uuid references auth.users(id) on delete set null,
  unassigned_at timestamp with time zone,
  unique(task_id, user_id)
);

-- Index for task lookups
create index if not exists idx_task_assignees_task_id on public.task_assignees(task_id);
create index if not exists idx_task_assignees_user_id on public.task_assignees(user_id);

------------------------------------------------------
-- TASK COMMENTS
------------------------------------------------------

create table if not exists public.task_comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for task lookups
create index if not exists idx_task_comments_task_id on public.task_comments(task_id);

------------------------------------------------------
-- TAGS
------------------------------------------------------

create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name varchar(100) not null,
  color varchar(7) default '#6366f1',
  created_at timestamp with time zone default now()
);

-- Index for workspace lookups
create index if not exists idx_tags_workspace_id on public.tags(workspace_id);

------------------------------------------------------
-- TASK TAGS (many-to-many)
------------------------------------------------------

create table if not exists public.task_tags (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(task_id, tag_id)
);

------------------------------------------------------
-- ATTACHMENTS
------------------------------------------------------

create table if not exists public.attachments (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  board_id uuid references public.boards(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  file_url varchar(1000) not null,
  file_name varchar(500) not null,
  file_type varchar(100),
  file_size int,
  storage_path varchar(1000),
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

-- Indexes for lookups
create index if not exists idx_attachments_workspace_id on public.attachments(workspace_id);
create index if not exists idx_attachments_project_id on public.attachments(project_id);
create index if not exists idx_attachments_task_id on public.attachments(task_id);

------------------------------------------------------
-- SUBSCRIPTIONS
------------------------------------------------------

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  plan subscription_plan not null default 'free',
  status subscription_status not null default 'active',
  stripe_customer_id varchar(255),
  stripe_subscription_id varchar(255),
  started_at timestamp with time zone default now(),
  ended_at timestamp with time zone,
  renewal_period renewal_period default 'monthly',
  current_period_end timestamp with time zone
);

-- Index for user lookups
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);

------------------------------------------------------
-- AUDIT LOGS
------------------------------------------------------

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  action varchar(100) not null,
  entity_type varchar(100) not null,
  entity_id uuid,
  details jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Indexes for lookups
create index if not exists idx_audit_logs_workspace_id on public.audit_logs(workspace_id);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);

------------------------------------------------------
-- UPDATED_AT TRIGGER FUNCTION
------------------------------------------------------

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers to all tables with updated_at
create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();
create trigger update_workspaces_updated_at before update on public.workspaces for each row execute function public.update_updated_at_column();
create trigger update_workspace_memberships_updated_at before update on public.workspace_memberships for each row execute function public.update_updated_at_column();
create trigger update_projects_updated_at before update on public.projects for each row execute function public.update_updated_at_column();
create trigger update_boards_updated_at before update on public.boards for each row execute function public.update_updated_at_column();
create trigger update_board_lists_updated_at before update on public.board_lists for each row execute function public.update_updated_at_column();
create trigger update_tasks_updated_at before update on public.tasks for each row execute function public.update_updated_at_column();
create trigger update_task_comments_updated_at before update on public.task_comments for each row execute function public.update_updated_at_column();

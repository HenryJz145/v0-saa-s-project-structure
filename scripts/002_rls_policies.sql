-- Taskflow Row Level Security Policies
-- Users can only access resources in workspaces they belong to

------------------------------------------------------
-- HELPER FUNCTIONS
------------------------------------------------------

-- Check if user is a member of a workspace
create or replace function public.is_workspace_member(workspace_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.workspace_memberships
    where workspace_id = workspace_uuid
    and user_id = auth.uid()
    and status = 'active'
  );
end;
$$ language plpgsql security definer;

-- Check if user has specific role in workspace
create or replace function public.has_workspace_role(workspace_uuid uuid, required_role user_role)
returns boolean as $$
begin
  return exists (
    select 1 from public.workspace_memberships
    where workspace_id = workspace_uuid
    and user_id = auth.uid()
    and status = 'active'
    and (
      role = required_role
      or role = 'owner'
      or (role = 'admin' and required_role = 'member')
    )
  );
end;
$$ language plpgsql security definer;

-- Check if user is owner or admin of workspace
create or replace function public.is_workspace_admin(workspace_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.workspace_memberships
    where workspace_id = workspace_uuid
    and user_id = auth.uid()
    and status = 'active'
    and role in ('owner', 'admin')
  );
end;
$$ language plpgsql security definer;

-- Get workspace ID from project
create or replace function public.get_workspace_from_project(project_uuid uuid)
returns uuid as $$
  select workspace_id from public.projects where id = project_uuid;
$$ language sql security definer;

-- Get workspace ID from board
create or replace function public.get_workspace_from_board(board_uuid uuid)
returns uuid as $$
  select p.workspace_id from public.boards b
  join public.projects p on b.project_id = p.id
  where b.id = board_uuid;
$$ language sql security definer;

-- Get workspace ID from task
create or replace function public.get_workspace_from_task(task_uuid uuid)
returns uuid as $$
  select p.workspace_id from public.tasks t
  join public.projects p on t.project_id = p.id
  where t.id = task_uuid;
$$ language sql security definer;

------------------------------------------------------
-- ENABLE RLS ON ALL TABLES
------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.projects enable row level security;
alter table public.boards enable row level security;
alter table public.board_lists enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_comments enable row level security;
alter table public.tags enable row level security;
alter table public.task_tags enable row level security;
alter table public.attachments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_logs enable row level security;

------------------------------------------------------
-- PROFILES POLICIES
------------------------------------------------------

-- Users can view their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Users can view profiles of workspace members
create policy "profiles_select_workspace_members" on public.profiles
  for select using (
    exists (
      select 1 from public.workspace_memberships wm1
      join public.workspace_memberships wm2 on wm1.workspace_id = wm2.workspace_id
      where wm1.user_id = auth.uid()
      and wm2.user_id = profiles.id
      and wm1.status = 'active'
      and wm2.status = 'active'
    )
  );

-- Users can insert their own profile
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Users can update their own profile
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

------------------------------------------------------
-- WORKSPACES POLICIES
------------------------------------------------------

-- Users can view workspaces they are members of
create policy "workspaces_select_member" on public.workspaces
  for select using (public.is_workspace_member(id));

-- Any authenticated user can create a workspace
create policy "workspaces_insert_authenticated" on public.workspaces
  for insert with check (auth.uid() is not null);

-- Only owners and admins can update workspace
create policy "workspaces_update_admin" on public.workspaces
  for update using (public.is_workspace_admin(id));

-- Only owners can delete workspace
create policy "workspaces_delete_owner" on public.workspaces
  for delete using (
    exists (
      select 1 from public.workspace_memberships
      where workspace_id = workspaces.id
      and user_id = auth.uid()
      and status = 'active'
      and role = 'owner'
    )
  );

------------------------------------------------------
-- WORKSPACE MEMBERSHIPS POLICIES
------------------------------------------------------

-- Users can view memberships of their workspaces
create policy "workspace_memberships_select" on public.workspace_memberships
  for select using (
    public.is_workspace_member(workspace_id)
    or user_id = auth.uid()
    or invite_email = (select email from auth.users where id = auth.uid())
  );

-- Admins can insert memberships (invites)
create policy "workspace_memberships_insert" on public.workspace_memberships
  for insert with check (
    public.is_workspace_admin(workspace_id)
    or (
      -- Allow creating own membership when accepting invite
      user_id = auth.uid()
      and invite_token is not null
    )
  );

-- Admins can update memberships
create policy "workspace_memberships_update" on public.workspace_memberships
  for update using (
    public.is_workspace_admin(workspace_id)
    or user_id = auth.uid()
  );

-- Admins can delete memberships
create policy "workspace_memberships_delete" on public.workspace_memberships
  for delete using (public.is_workspace_admin(workspace_id));

------------------------------------------------------
-- PROJECTS POLICIES
------------------------------------------------------

-- Users can view projects in their workspaces
create policy "projects_select_member" on public.projects
  for select using (public.is_workspace_member(workspace_id));

-- Admins can create projects
create policy "projects_insert_admin" on public.projects
  for insert with check (public.is_workspace_admin(workspace_id));

-- Admins can update projects
create policy "projects_update_admin" on public.projects
  for update using (public.is_workspace_admin(workspace_id));

-- Admins can delete projects
create policy "projects_delete_admin" on public.projects
  for delete using (public.is_workspace_admin(workspace_id));

------------------------------------------------------
-- BOARDS POLICIES
------------------------------------------------------

-- Users can view boards in their workspace projects
create policy "boards_select_member" on public.boards
  for select using (
    public.is_workspace_member(public.get_workspace_from_project(project_id))
  );

-- Admins can create boards
create policy "boards_insert_admin" on public.boards
  for insert with check (
    public.is_workspace_admin(public.get_workspace_from_project(project_id))
  );

-- Admins can update boards
create policy "boards_update_admin" on public.boards
  for update using (
    public.is_workspace_admin(public.get_workspace_from_project(project_id))
  );

-- Admins can delete boards
create policy "boards_delete_admin" on public.boards
  for delete using (
    public.is_workspace_admin(public.get_workspace_from_project(project_id))
  );

------------------------------------------------------
-- BOARD LISTS POLICIES
------------------------------------------------------

-- Users can view lists in their workspace boards
create policy "board_lists_select_member" on public.board_lists
  for select using (
    public.is_workspace_member(public.get_workspace_from_board(board_id))
  );

-- Members can create lists
create policy "board_lists_insert_member" on public.board_lists
  for insert with check (
    public.is_workspace_member(public.get_workspace_from_board(board_id))
  );

-- Members can update lists
create policy "board_lists_update_member" on public.board_lists
  for update using (
    public.is_workspace_member(public.get_workspace_from_board(board_id))
  );

-- Admins can delete lists
create policy "board_lists_delete_admin" on public.board_lists
  for delete using (
    public.is_workspace_admin(public.get_workspace_from_board(board_id))
  );

------------------------------------------------------
-- TASKS POLICIES
------------------------------------------------------

-- Users can view tasks in their workspace
create policy "tasks_select_member" on public.tasks
  for select using (
    public.is_workspace_member(public.get_workspace_from_project(project_id))
  );

-- Members can create tasks
create policy "tasks_insert_member" on public.tasks
  for insert with check (
    public.is_workspace_member(public.get_workspace_from_project(project_id))
  );

-- Members can update tasks
create policy "tasks_update_member" on public.tasks
  for update using (
    public.is_workspace_member(public.get_workspace_from_project(project_id))
  );

-- Admins can delete tasks
create policy "tasks_delete_admin" on public.tasks
  for delete using (
    public.is_workspace_admin(public.get_workspace_from_project(project_id))
  );

------------------------------------------------------
-- TASK ASSIGNEES POLICIES
------------------------------------------------------

-- Members can view task assignees
create policy "task_assignees_select_member" on public.task_assignees
  for select using (
    public.is_workspace_member(public.get_workspace_from_task(task_id))
  );

-- Members can assign tasks
create policy "task_assignees_insert_member" on public.task_assignees
  for insert with check (
    public.is_workspace_member(public.get_workspace_from_task(task_id))
  );

-- Members can update assignments
create policy "task_assignees_update_member" on public.task_assignees
  for update using (
    public.is_workspace_member(public.get_workspace_from_task(task_id))
  );

-- Members can remove assignments
create policy "task_assignees_delete_member" on public.task_assignees
  for delete using (
    public.is_workspace_member(public.get_workspace_from_task(task_id))
  );

------------------------------------------------------
-- TASK COMMENTS POLICIES
------------------------------------------------------

-- Members can view comments
create policy "task_comments_select_member" on public.task_comments
  for select using (
    public.is_workspace_member(public.get_workspace_from_task(task_id))
  );

-- Members can create comments
create policy "task_comments_insert_member" on public.task_comments
  for insert with check (
    public.is_workspace_member(public.get_workspace_from_task(task_id))
    and user_id = auth.uid()
  );

-- Users can update their own comments
create policy "task_comments_update_own" on public.task_comments
  for update using (user_id = auth.uid());

-- Users can delete their own comments or admins can delete any
create policy "task_comments_delete" on public.task_comments
  for delete using (
    user_id = auth.uid()
    or public.is_workspace_admin(public.get_workspace_from_task(task_id))
  );

------------------------------------------------------
-- TAGS POLICIES
------------------------------------------------------

-- Members can view tags
create policy "tags_select_member" on public.tags
  for select using (public.is_workspace_member(workspace_id));

-- Admins can create tags
create policy "tags_insert_admin" on public.tags
  for insert with check (public.is_workspace_admin(workspace_id));

-- Admins can update tags
create policy "tags_update_admin" on public.tags
  for update using (public.is_workspace_admin(workspace_id));

-- Admins can delete tags
create policy "tags_delete_admin" on public.tags
  for delete using (public.is_workspace_admin(workspace_id));

------------------------------------------------------
-- TASK TAGS POLICIES
------------------------------------------------------

-- Members can view task tags
create policy "task_tags_select_member" on public.task_tags
  for select using (
    public.is_workspace_member(public.get_workspace_from_task(task_id))
  );

-- Members can add tags to tasks
create policy "task_tags_insert_member" on public.task_tags
  for insert with check (
    public.is_workspace_member(public.get_workspace_from_task(task_id))
  );

-- Members can remove tags from tasks
create policy "task_tags_delete_member" on public.task_tags
  for delete using (
    public.is_workspace_member(public.get_workspace_from_task(task_id))
  );

------------------------------------------------------
-- ATTACHMENTS POLICIES
------------------------------------------------------

-- Members can view attachments
create policy "attachments_select_member" on public.attachments
  for select using (public.is_workspace_member(workspace_id));

-- Members can upload attachments
create policy "attachments_insert_member" on public.attachments
  for insert with check (
    public.is_workspace_member(workspace_id)
    and uploaded_by = auth.uid()
  );

-- Users can update their own attachments
create policy "attachments_update_own" on public.attachments
  for update using (uploaded_by = auth.uid());

-- Users can delete their own attachments or admins can delete any
create policy "attachments_delete" on public.attachments
  for delete using (
    uploaded_by = auth.uid()
    or public.is_workspace_admin(workspace_id)
  );

------------------------------------------------------
-- SUBSCRIPTIONS POLICIES
------------------------------------------------------

-- Users can view their own subscriptions
create policy "subscriptions_select_own" on public.subscriptions
  for select using (user_id = auth.uid());

-- System manages subscriptions (service role only for inserts/updates)
create policy "subscriptions_insert" on public.subscriptions
  for insert with check (user_id = auth.uid());

create policy "subscriptions_update" on public.subscriptions
  for update using (user_id = auth.uid());

------------------------------------------------------
-- AUDIT LOGS POLICIES
------------------------------------------------------

-- Admins can view audit logs
create policy "audit_logs_select_admin" on public.audit_logs
  for select using (public.is_workspace_admin(workspace_id));

-- System inserts audit logs (members can log their actions)
create policy "audit_logs_insert" on public.audit_logs
  for insert with check (
    user_id = auth.uid()
    and public.is_workspace_member(workspace_id)
  );

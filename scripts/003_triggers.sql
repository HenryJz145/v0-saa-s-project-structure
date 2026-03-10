-- Taskflow Triggers and Functions
-- Auto-create profile on signup, workspace membership on workspace creation

------------------------------------------------------
-- AUTO-CREATE PROFILE ON SIGNUP
------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  )
  on conflict (id) do nothing;
  
  return new;
end;
$$;

-- Drop existing trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

------------------------------------------------------
-- AUTO-ADD OWNER MEMBERSHIP WHEN WORKSPACE IS CREATED
------------------------------------------------------

create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Add creator as owner
  insert into public.workspace_memberships (
    workspace_id,
    user_id,
    role,
    status,
    joined_at
  )
  values (
    new.id,
    new.created_by,
    'owner',
    'active',
    now()
  );
  
  return new;
end;
$$;

-- Drop existing trigger if exists
drop trigger if exists on_workspace_created on public.workspaces;

-- Create trigger
create trigger on_workspace_created
  after insert on public.workspaces
  for each row
  execute function public.handle_new_workspace();

------------------------------------------------------
-- GENERATE INVITE TOKEN
------------------------------------------------------

create or replace function public.generate_invite_token()
returns trigger
language plpgsql
as $$
begin
  if new.invite_token is null and new.status = 'invited' then
    new.invite_token := encode(gen_random_bytes(32), 'hex');
  end if;
  return new;
end;
$$;

-- Drop existing trigger if exists
drop trigger if exists generate_membership_invite_token on public.workspace_memberships;

-- Create trigger
create trigger generate_membership_invite_token
  before insert on public.workspace_memberships
  for each row
  execute function public.generate_invite_token();

------------------------------------------------------
-- CALCULATE TASK PERFORMANCE ON COMPLETION
------------------------------------------------------

create or replace function public.calculate_task_performance()
returns trigger
language plpgsql
as $$
begin
  -- When task is completed, calculate performance score
  if new.status = 'complete' and old.status != 'complete' then
    new.completed_at := now();
    
    -- Calculate actual time if started_at exists
    if new.started_at is not null then
      new.actual_time_minutes := extract(epoch from (now() - new.started_at)) / 60;
    end if;
    
    -- Calculate performance score (estimated vs actual)
    if new.estimated_time_minutes is not null and new.estimated_time_minutes > 0 and new.actual_time_minutes is not null then
      new.performance_score := (new.estimated_time_minutes::float / greatest(new.actual_time_minutes, 1)::float) * 100;
    end if;
  end if;
  
  -- When task is started, record start time
  if new.status = 'ongoing' and old.status != 'ongoing' then
    new.started_at := now();
  end if;
  
  return new;
end;
$$;

-- Drop existing trigger if exists
drop trigger if exists calculate_task_performance_trigger on public.tasks;

-- Create trigger
create trigger calculate_task_performance_trigger
  before update on public.tasks
  for each row
  execute function public.calculate_task_performance();

------------------------------------------------------
-- CREATE DEFAULT BOARD LISTS FOR NEW BOARDS
------------------------------------------------------

create or replace function public.create_default_board_lists()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create default kanban columns
  insert into public.board_lists (board_id, name, position)
  values 
    (new.id, 'Backlog', 0),
    (new.id, 'To Do', 1),
    (new.id, 'In Progress', 2),
    (new.id, 'Done', 3);
  
  return new;
end;
$$;

-- Drop existing trigger if exists
drop trigger if exists on_board_created on public.boards;

-- Create trigger
create trigger on_board_created
  after insert on public.boards
  for each row
  execute function public.create_default_board_lists();

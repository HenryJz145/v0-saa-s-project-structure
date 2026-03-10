'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, MoreHorizontal, Trash2, Archive, Share2 } from 'lucide-react'
import type { Project, Workspace } from '@/lib/types/database'

interface ProjectHeaderProps {
  project: Project
  workspace: Workspace
  workspaceSlug: string
}

export function ProjectHeader({ project, workspace, workspaceSlug }: ProjectHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500'
      case 'on_hold':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'completed':
        return 'bg-blue-500/10 text-blue-500'
      case 'archived':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-6 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/workspaces/${workspaceSlug}`}>{workspace.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <Badge variant="secondary" className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/workspaces/${workspaceSlug}/projects/${project.slug}/settings`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Project settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive project
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {project.description && (
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            {project.description}
          </p>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Project } from "@/types/project-types"
import { ProjectCard } from "./ProjectCard"
import { Button } from "@/components/ui/button"

interface ProjectListProps {
  projects: Project[]
  onProjectClick: (project: Project) => void
  loading?: boolean
}

const ITEMS_PER_PAGE = 50

export function ProjectList({ projects, onProjectClick, loading }: ProjectListProps) {
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)

  const displayedProjects = projects.slice(0, displayCount)
  const hasMore = displayCount < projects.length

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, projects.length))
  }

  if (loading && projects.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-muted-foreground">Projecten laden...</p>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-muted-foreground mb-2">Geen projecten gevonden</p>
        <p className="text-sm text-muted-foreground">
          Pas je filters aan om meer resultaten te zien
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {displayedProjects.map((project, idx) => (
          <ProjectCard
            key={`${project.nis_code}-${project.ac_code}-${idx}`}
            project={project}
            onClick={() => onProjectClick(project)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={handleLoadMore}>
            Laad meer ({displayCount} van {projects.length})
          </Button>
        </div>
      )}

      {!hasMore && projects.length > ITEMS_PER_PAGE && (
        <p className="text-center text-sm text-muted-foreground pt-4">
          Alle {projects.length} projecten getoond
        </p>
      )}
    </div>
  )
}

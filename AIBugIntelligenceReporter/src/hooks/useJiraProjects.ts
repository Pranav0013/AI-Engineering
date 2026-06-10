import { useQuery } from '@tanstack/react-query'
import { JiraProject } from '@/types'

async function fetchJiraProjects(): Promise<JiraProject[]> {
  const res = await fetch('/api/jira/projects')
  if (!res.ok) return []
  const data = await res.json() as JiraProject[]
  return Array.isArray(data) ? data : []
}

export function useJiraProjects() {
  return useQuery({
    queryKey: ['jira-projects'],
    queryFn: fetchJiraProjects,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

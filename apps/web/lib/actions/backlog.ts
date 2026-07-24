'use server'

function buildBacklogIssueUrl(issueKey: string): string {
  const spaceId = process.env.BACKLOG_SPACE_ID
  if (!spaceId) return ''
  return `https://${spaceId}.backlog.com/view/${issueKey}`
}

export interface BacklogIssue {
  id: number
  issueKey: string
  summary: string
  status: { name: string }
  assignee: { name: string } | null
  url: string
}

export async function searchBacklogIssues(keyword: string, projectKey?: string): Promise<BacklogIssue[]> {
  const spaceId = process.env.BACKLOG_SPACE_ID
  const apiKey = process.env.BACKLOG_API_KEY

  if (!spaceId || !apiKey) {
    return []
  }

  const params = new URLSearchParams({
    apiKey,
    keyword,
    count: '20',
    statusId: ['1', '2', '3'].join('&statusId[]='),
  })
  if (projectKey) params.append('projectId[]', projectKey)

  try {
    const res = await fetch(
      `https://${spaceId}.backlog.com/api/v2/issues?${params}`,
      { next: { revalidate: 30 } },
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data as any[]).map(issue => ({
      id: issue.id,
      issueKey: issue.issueKey,
      summary: issue.summary,
      status: issue.status,
      assignee: issue.assignee,
      url: buildBacklogIssueUrl(issue.issueKey),
    }))
  } catch {
    return []
  }
}

export async function getBacklogProjects(): Promise<{ id: number; projectKey: string; name: string }[]> {
  const spaceId = process.env.BACKLOG_SPACE_ID
  const apiKey = process.env.BACKLOG_API_KEY
  if (!spaceId || !apiKey) return []

  try {
    const res = await fetch(
      `https://${spaceId}.backlog.com/api/v2/projects?apiKey=${apiKey}`,
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data as any[]).map(p => ({ id: p.id, projectKey: p.projectKey, name: p.name }))
  } catch {
    return []
  }
}

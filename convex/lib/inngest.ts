import { requireEnv } from "./auth"

export async function emitWorkflowEvent(args: {
  name: string
  data: Record<string, unknown>
}) {
  const baseUrl = requireEnv("NEXT_PUBLIC_SITE_URL")

  const response = await fetch(`${baseUrl}/api/inngest/emit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-workflow-secret": requireEnv("WORKFLOW_SECRET"),
    },
    body: JSON.stringify({
      name: args.name,
      data: args.data,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to emit ${args.name} event`)
  }

  return await response.json()
}

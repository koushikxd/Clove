import { NextResponse } from "next/server"
import { inngest } from "@/inngest/client"

export async function POST(request: Request) {
  const secret = request.headers.get("x-workflow-secret")

  if (!process.env.WORKFLOW_SECRET || secret !== process.env.WORKFLOW_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await request.json()
  await inngest.send(payload)

  return NextResponse.json({ ok: true })
}

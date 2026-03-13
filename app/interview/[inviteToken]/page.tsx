import { InterviewSession } from "@/components/interview-session"

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ inviteToken: string }>
}) {
  const { inviteToken } = await params
  return <InterviewSession inviteToken={inviteToken} />
}

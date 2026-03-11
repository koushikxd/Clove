export function buildCandidateInviteLink({
  baseUrl,
  email,
  inviteToken,
}: {
  baseUrl: string
  email: string
  inviteToken: string
}) {
  const url = new URL("/login", baseUrl)
  url.searchParams.set("role", "candidate")
  url.searchParams.set("email", email)
  url.searchParams.set("invite", inviteToken)
  return url.toString()
}

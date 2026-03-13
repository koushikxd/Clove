import type { Doc } from "../_generated/dataModel"

const MAX_RESUME_CONTEXT_LENGTH = 4_000

export function buildJobAwareResumeContext(args: {
  job: Doc<"jobs">
  resumeText?: string | null
  yearsOfExperience?: number
}) {
  const normalizedResume = normalizeResumeText(args.resumeText)
  if (!normalizedResume) {
    return undefined
  }

  const highlightedLines = collectRelevantResumeLines(
    normalizedResume,
    args.job.requirements
  )
  const matchedRequirements = collectMatchedRequirements(
    normalizedResume,
    args.job.requirements
  )
  const sectionSummary = extractImportantSections(normalizedResume)

  const parts = [
    args.yearsOfExperience !== undefined
      ? `Years of experience: ${args.yearsOfExperience}`
      : null,
    matchedRequirements.length > 0
      ? `Matched job requirements: ${matchedRequirements.join(", ")}`
      : "Matched job requirements: none clearly found in extracted resume text",
    highlightedLines.length > 0
      ? `Relevant resume evidence:\n- ${highlightedLines.join("\n- ")}`
      : null,
    sectionSummary ? `Resume summary:\n${sectionSummary}` : null,
  ].filter(Boolean)

  return parts.join("\n\n").slice(0, MAX_RESUME_CONTEXT_LENGTH)
}

function normalizeResumeText(text: string | null | undefined) {
  if (!text) {
    return undefined
  }

  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/[^\x20-\x7E\n\t]/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()

  return normalized || undefined
}

function collectMatchedRequirements(resumeText: string, requirements: string[]) {
  const lowerResume = resumeText.toLowerCase()
  return requirements.filter((requirement) => {
    const keywords = tokenizeRequirement(requirement)
    return keywords.some((keyword) => lowerResume.includes(keyword))
  })
}

function collectRelevantResumeLines(resumeText: string, requirements: string[]) {
  const lines = resumeText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 24)

  const seen = new Set<string>()
  const relevant: string[] = []

  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    const matches = requirements.some((requirement) =>
      tokenizeRequirement(requirement).some((keyword) => lowerLine.includes(keyword))
    )

    if (!matches || seen.has(lowerLine)) {
      continue
    }

    seen.add(lowerLine)
    relevant.push(line)

    if (relevant.length >= 8) {
      break
    }
  }

  return relevant
}

function extractImportantSections(resumeText: string) {
  const lines = resumeText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const sectionHeaders = new Set([
    "summary",
    "experience",
    "work experience",
    "professional experience",
    "projects",
    "skills",
    "technical skills",
    "education",
  ])

  const collected: string[] = []
  let activeHeader: string | null = null

  for (const line of lines) {
    const normalizedLine = line.toLowerCase().replace(/[:\-]/g, "").trim()
    if (sectionHeaders.has(normalizedLine)) {
      activeHeader = line
      collected.push(line)
      continue
    }

    if (!activeHeader) {
      continue
    }

    collected.push(line)
    if (collected.join("\n").length >= 2_500) {
      break
    }
  }

  return collected.join("\n").slice(0, 2_500)
}

function tokenizeRequirement(requirement: string) {
  return requirement
    .toLowerCase()
    .split(/[^a-z0-9+#./-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
}

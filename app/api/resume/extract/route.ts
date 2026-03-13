import { NextResponse } from "next/server"
import { extractResumeTextFromFile } from "@/lib/resume-parser"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const formData = await request.formData()
  const resume = formData.get("resume")

  if (!(resume instanceof File)) {
    return NextResponse.json(
      { error: "Resume file is required" },
      { status: 400 }
    )
  }

  try {
    const resumeText = await extractResumeTextFromFile(resume)

    return NextResponse.json({
      resumeText,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract resume text",
      },
      { status: 500 }
    )
  }
}

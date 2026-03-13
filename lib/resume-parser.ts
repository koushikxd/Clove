import { unzipSync } from "fflate"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"

const MAX_RESUME_TEXT_LENGTH = 50_000

export async function extractResumeTextFromFile(file: File) {
  const mimeType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()

  try {
    if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) {
      return await extractPdfText(file)
    }

    if (
      mimeType.includes(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) ||
      fileName.endsWith(".docx")
    ) {
      return await extractDocxText(file)
    }
  } catch {
    // Fall back to plain text extraction below.
  }

  return normalizeResumeText(await file.text())
}

async function extractPdfText(file: File) {
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = getDocument({
    data,
    useSystemFonts: true,
  })

  try {
    const pdf = await loadingTask.promise
    const pages: string[] = []

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber)
      const textContent = await page.getTextContent()
      const lines: string[] = []
      let currentLine = ""

      for (const item of textContent.items as Array<{
        str?: string
        hasEOL?: boolean
      }>) {
        const chunk = item.str?.trim()
        if (chunk) {
          currentLine = currentLine ? `${currentLine} ${chunk}` : chunk
        }

        if (item.hasEOL && currentLine) {
          lines.push(currentLine)
          currentLine = ""
        }
      }

      if (currentLine) {
        lines.push(currentLine)
      }

      if (lines.length > 0) {
        pages.push(lines.join("\n"))
      }
    }

    return normalizeResumeText(pages.join("\n\n"))
  } finally {
    await loadingTask.destroy()
  }
}

async function extractDocxText(file: File) {
  const archive = unzipSync(new Uint8Array(await file.arrayBuffer()))
  const decoder = new TextDecoder()
  const xmlParts = Object.entries(archive)
    .filter(([filePath]) =>
      /^word\/(document|header\d+|footer\d+)\.xml$/i.test(filePath)
    )
    .map(([, content]) => decoder.decode(content))

  if (xmlParts.length === 0) {
    return undefined
  }

  return normalizeResumeText(extractTextFromWordXml(xmlParts.join("\n")))
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

  if (!normalized) {
    return undefined
  }

  return normalized.slice(0, MAX_RESUME_TEXT_LENGTH)
}

function extractTextFromWordXml(xml: string) {
  return decodeXmlEntities(
    xml
      .replace(/<w:tab\/>/gi, "\t")
      .replace(/<w:br[^>]*\/>/gi, "\n")
      .replace(/<\/w:p>/gi, "\n")
      .replace(/<\/w:tr>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
}

function decodeXmlEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

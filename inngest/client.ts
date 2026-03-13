import { Inngest } from "inngest"

export const inngest = new Inngest({
  id: "clove",
  eventKey: process.env.INNGEST_EVENT_KEY,
  baseUrl: process.env.INNGEST_BASE_URL || process.env.INNGEST_DEVSERVER_URL,
})

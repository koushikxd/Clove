import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Workflow functions will be registered here:
    // sourcingWorkflow,
    // interviewFollowup,
    // evaluationWorkflow,
  ],
})

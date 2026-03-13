import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import { evaluationWorkflow } from "@/inngest/evaluation-workflow"
import { sourcingWorkflow } from "@/inngest/sourcing-workflow"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sourcingWorkflow, evaluationWorkflow],
})

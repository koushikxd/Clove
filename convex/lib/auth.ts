import { ConvexError } from "convex/values"
import type { MutationCtx, QueryCtx, ActionCtx } from "./types"
import { authComponent } from "../better-auth/auth"

type ReaderCtx = QueryCtx | MutationCtx

export async function requireAuthUser(ctx: ReaderCtx) {
  const authUser = await authComponent.getAuthUser(ctx)
  if (!authUser) {
    throw new ConvexError("Unauthenticated")
  }
  return authUser
}

export async function requireAppUser(ctx: ReaderCtx) {
  const authUser = await requireAuthUser(ctx)
  const appUser = await ctx.db
    .query("users")
    .withIndex("by_user_id", (q) => q.eq("userId", authUser._id))
    .unique()

  if (!appUser) {
    throw new ConvexError("User has not been initialized")
  }

  return { authUser, appUser }
}

export function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export function assertWorkflowSecret(secret: string | undefined) {
  const expected = process.env.WORKFLOW_SECRET
  if (!expected || secret !== expected) {
    throw new ConvexError("Invalid workflow secret")
  }
}

export function splitName(name: string | null | undefined) {
  const trimmed = name?.trim() ?? ""
  if (!trimmed) {
    return { firstName: undefined, lastName: undefined }
  }

  const [firstName, ...rest] = trimmed.split(/\s+/)
  return {
    firstName,
    lastName: rest.length > 0 ? rest.join(" ") : undefined,
  }
}

export type AuthActionCtx = ActionCtx

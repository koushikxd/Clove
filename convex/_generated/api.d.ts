/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appUsers from "../appUsers.js"
import type * as evaluations from "../evaluations.js"
import type * as events from "../events.js"
import type * as http from "../http.js"
import type * as interviewActions from "../interviewActions.js"
import type * as interviews from "../interviews.js"
import type * as jobInvites from "../jobInvites.js"
import type * as jobs from "../jobs.js"
import type * as lib_auth from "../lib/auth.js"
import type * as lib_evaluationWorker from "../lib/evaluationWorker.js"
import type * as lib_inngest from "../lib/inngest.js"
import type * as lib_interviewWorker from "../lib/interviewWorker.js"
import type * as lib_resume from "../lib/resume.js"
import type * as lib_types from "../lib/types.js"
import type * as sourcing from "../sourcing.js"

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server"

declare const fullApi: ApiFromModules<{
  appUsers: typeof appUsers
  evaluations: typeof evaluations
  events: typeof events
  http: typeof http
  interviewActions: typeof interviewActions
  interviews: typeof interviews
  jobInvites: typeof jobInvites
  jobs: typeof jobs
  "lib/auth": typeof lib_auth
  "lib/evaluationWorker": typeof lib_evaluationWorker
  "lib/inngest": typeof lib_inngest
  "lib/interviewWorker": typeof lib_interviewWorker
  "lib/resume": typeof lib_resume
  "lib/types": typeof lib_types
  sourcing: typeof sourcing
}>

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>

export declare const components: {
  betterAuth: {
    adapter: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                data: {
                  createdAt: number
                  displayUsername?: null | string
                  email: string
                  emailVerified: boolean
                  image?: null | string
                  isAnonymous?: null | boolean
                  name: string
                  phoneNumber?: null | string
                  phoneNumberVerified?: null | boolean
                  twoFactorEnabled?: null | boolean
                  updatedAt: number
                  userId?: null | string
                  username?: null | string
                }
                model: "user"
              }
            | {
                data: {
                  createdAt: number
                  expiresAt: number
                  ipAddress?: null | string
                  token: string
                  updatedAt: number
                  userAgent?: null | string
                  userId: string
                }
                model: "session"
              }
            | {
                data: {
                  accessToken?: null | string
                  accessTokenExpiresAt?: null | number
                  accountId: string
                  createdAt: number
                  idToken?: null | string
                  password?: null | string
                  providerId: string
                  refreshToken?: null | string
                  refreshTokenExpiresAt?: null | number
                  scope?: null | string
                  updatedAt: number
                  userId: string
                }
                model: "account"
              }
            | {
                data: {
                  createdAt: number
                  expiresAt: number
                  identifier: string
                  updatedAt: number
                  value: string
                }
                model: "verification"
              }
            | {
                data: {
                  createdAt: number
                  privateKey: string
                  publicKey: string
                }
                model: "jwks"
              }
            | {
                data: {
                  count?: null | number
                  key?: null | string
                  lastRequest?: null | number
                }
                model: "rateLimit"
              }
          onCreateHandle?: string
          select?: Array<string>
        },
        any
      >
      deleteMany: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                model: "user"
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "name"
                    | "email"
                    | "emailVerified"
                    | "image"
                    | "createdAt"
                    | "updatedAt"
                    | "twoFactorEnabled"
                    | "isAnonymous"
                    | "username"
                    | "displayUsername"
                    | "phoneNumber"
                    | "phoneNumberVerified"
                    | "userId"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "session"
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "expiresAt"
                    | "token"
                    | "createdAt"
                    | "updatedAt"
                    | "ipAddress"
                    | "userAgent"
                    | "userId"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "account"
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "accountId"
                    | "providerId"
                    | "userId"
                    | "accessToken"
                    | "refreshToken"
                    | "idToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "scope"
                    | "password"
                    | "createdAt"
                    | "updatedAt"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "verification"
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "identifier"
                    | "value"
                    | "expiresAt"
                    | "createdAt"
                    | "updatedAt"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "jwks"
                where?: Array<{
                  connector?: "AND" | "OR"
                  field: "publicKey" | "privateKey" | "createdAt" | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "rateLimit"
                where?: Array<{
                  connector?: "AND" | "OR"
                  field: "key" | "count" | "lastRequest" | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
          onDeleteHandle?: string
          paginationOpts: {
            cursor: string | null
            endCursor?: string | null
            id?: number
            maximumBytesRead?: number
            maximumRowsRead?: number
            numItems: number
          }
        },
        any
      >
      deleteOne: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                model: "user"
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "name"
                    | "email"
                    | "emailVerified"
                    | "image"
                    | "createdAt"
                    | "updatedAt"
                    | "twoFactorEnabled"
                    | "isAnonymous"
                    | "username"
                    | "displayUsername"
                    | "phoneNumber"
                    | "phoneNumberVerified"
                    | "userId"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "session"
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "expiresAt"
                    | "token"
                    | "createdAt"
                    | "updatedAt"
                    | "ipAddress"
                    | "userAgent"
                    | "userId"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "account"
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "accountId"
                    | "providerId"
                    | "userId"
                    | "accessToken"
                    | "refreshToken"
                    | "idToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "scope"
                    | "password"
                    | "createdAt"
                    | "updatedAt"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "verification"
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "identifier"
                    | "value"
                    | "expiresAt"
                    | "createdAt"
                    | "updatedAt"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "jwks"
                where?: Array<{
                  connector?: "AND" | "OR"
                  field: "publicKey" | "privateKey" | "createdAt" | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "rateLimit"
                where?: Array<{
                  connector?: "AND" | "OR"
                  field: "key" | "count" | "lastRequest" | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
          onDeleteHandle?: string
        },
        any
      >
      findMany: FunctionReference<
        "query",
        "internal",
        {
          join?: any
          limit?: number
          model:
            | "user"
            | "session"
            | "account"
            | "verification"
            | "jwks"
            | "rateLimit"
          offset?: number
          paginationOpts: {
            cursor: string | null
            endCursor?: string | null
            id?: number
            maximumBytesRead?: number
            maximumRowsRead?: number
            numItems: number
          }
          sortBy?: { direction: "asc" | "desc"; field: string }
          where?: Array<{
            connector?: "AND" | "OR"
            field: string
            operator?:
              | "lt"
              | "lte"
              | "gt"
              | "gte"
              | "eq"
              | "in"
              | "not_in"
              | "ne"
              | "contains"
              | "starts_with"
              | "ends_with"
            value:
              | string
              | number
              | boolean
              | Array<string>
              | Array<number>
              | null
          }>
        },
        any
      >
      findOne: FunctionReference<
        "query",
        "internal",
        {
          join?: any
          model:
            | "user"
            | "session"
            | "account"
            | "verification"
            | "jwks"
            | "rateLimit"
          select?: Array<string>
          where?: Array<{
            connector?: "AND" | "OR"
            field: string
            operator?:
              | "lt"
              | "lte"
              | "gt"
              | "gte"
              | "eq"
              | "in"
              | "not_in"
              | "ne"
              | "contains"
              | "starts_with"
              | "ends_with"
            value:
              | string
              | number
              | boolean
              | Array<string>
              | Array<number>
              | null
          }>
        },
        any
      >
      updateMany: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                model: "user"
                update: {
                  createdAt?: number
                  displayUsername?: null | string
                  email?: string
                  emailVerified?: boolean
                  image?: null | string
                  isAnonymous?: null | boolean
                  name?: string
                  phoneNumber?: null | string
                  phoneNumberVerified?: null | boolean
                  twoFactorEnabled?: null | boolean
                  updatedAt?: number
                  userId?: null | string
                  username?: null | string
                }
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "name"
                    | "email"
                    | "emailVerified"
                    | "image"
                    | "createdAt"
                    | "updatedAt"
                    | "twoFactorEnabled"
                    | "isAnonymous"
                    | "username"
                    | "displayUsername"
                    | "phoneNumber"
                    | "phoneNumberVerified"
                    | "userId"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "session"
                update: {
                  createdAt?: number
                  expiresAt?: number
                  ipAddress?: null | string
                  token?: string
                  updatedAt?: number
                  userAgent?: null | string
                  userId?: string
                }
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "expiresAt"
                    | "token"
                    | "createdAt"
                    | "updatedAt"
                    | "ipAddress"
                    | "userAgent"
                    | "userId"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "account"
                update: {
                  accessToken?: null | string
                  accessTokenExpiresAt?: null | number
                  accountId?: string
                  createdAt?: number
                  idToken?: null | string
                  password?: null | string
                  providerId?: string
                  refreshToken?: null | string
                  refreshTokenExpiresAt?: null | number
                  scope?: null | string
                  updatedAt?: number
                  userId?: string
                }
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "accountId"
                    | "providerId"
                    | "userId"
                    | "accessToken"
                    | "refreshToken"
                    | "idToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "scope"
                    | "password"
                    | "createdAt"
                    | "updatedAt"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "verification"
                update: {
                  createdAt?: number
                  expiresAt?: number
                  identifier?: string
                  updatedAt?: number
                  value?: string
                }
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "identifier"
                    | "value"
                    | "expiresAt"
                    | "createdAt"
                    | "updatedAt"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "jwks"
                update: {
                  createdAt?: number
                  privateKey?: string
                  publicKey?: string
                }
                where?: Array<{
                  connector?: "AND" | "OR"
                  field: "publicKey" | "privateKey" | "createdAt" | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "rateLimit"
                update: {
                  count?: null | number
                  key?: null | string
                  lastRequest?: null | number
                }
                where?: Array<{
                  connector?: "AND" | "OR"
                  field: "key" | "count" | "lastRequest" | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
          onUpdateHandle?: string
          paginationOpts: {
            cursor: string | null
            endCursor?: string | null
            id?: number
            maximumBytesRead?: number
            maximumRowsRead?: number
            numItems: number
          }
        },
        any
      >
      updateOne: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                model: "user"
                update: {
                  createdAt?: number
                  displayUsername?: null | string
                  email?: string
                  emailVerified?: boolean
                  image?: null | string
                  isAnonymous?: null | boolean
                  name?: string
                  phoneNumber?: null | string
                  phoneNumberVerified?: null | boolean
                  twoFactorEnabled?: null | boolean
                  updatedAt?: number
                  userId?: null | string
                  username?: null | string
                }
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "name"
                    | "email"
                    | "emailVerified"
                    | "image"
                    | "createdAt"
                    | "updatedAt"
                    | "twoFactorEnabled"
                    | "isAnonymous"
                    | "username"
                    | "displayUsername"
                    | "phoneNumber"
                    | "phoneNumberVerified"
                    | "userId"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "session"
                update: {
                  createdAt?: number
                  expiresAt?: number
                  ipAddress?: null | string
                  token?: string
                  updatedAt?: number
                  userAgent?: null | string
                  userId?: string
                }
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "expiresAt"
                    | "token"
                    | "createdAt"
                    | "updatedAt"
                    | "ipAddress"
                    | "userAgent"
                    | "userId"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "account"
                update: {
                  accessToken?: null | string
                  accessTokenExpiresAt?: null | number
                  accountId?: string
                  createdAt?: number
                  idToken?: null | string
                  password?: null | string
                  providerId?: string
                  refreshToken?: null | string
                  refreshTokenExpiresAt?: null | number
                  scope?: null | string
                  updatedAt?: number
                  userId?: string
                }
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "accountId"
                    | "providerId"
                    | "userId"
                    | "accessToken"
                    | "refreshToken"
                    | "idToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "scope"
                    | "password"
                    | "createdAt"
                    | "updatedAt"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "verification"
                update: {
                  createdAt?: number
                  expiresAt?: number
                  identifier?: string
                  updatedAt?: number
                  value?: string
                }
                where?: Array<{
                  connector?: "AND" | "OR"
                  field:
                    | "identifier"
                    | "value"
                    | "expiresAt"
                    | "createdAt"
                    | "updatedAt"
                    | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "jwks"
                update: {
                  createdAt?: number
                  privateKey?: string
                  publicKey?: string
                }
                where?: Array<{
                  connector?: "AND" | "OR"
                  field: "publicKey" | "privateKey" | "createdAt" | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
            | {
                model: "rateLimit"
                update: {
                  count?: null | number
                  key?: null | string
                  lastRequest?: null | number
                }
                where?: Array<{
                  connector?: "AND" | "OR"
                  field: "key" | "count" | "lastRequest" | "_id"
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with"
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null
                }>
              }
          onUpdateHandle?: string
        },
        any
      >
    }
  }
}

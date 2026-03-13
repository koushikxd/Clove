"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAction, useMutation, useQuery } from "convex/react"
import { makeFunctionReference } from "convex/server"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { authClient } from "@/lib/auth-client"
import { BarVisualizer, type AgentState } from "@/components/ui/bar-visualizer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type BrowserSpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

type BrowserSpeechRecognitionErrorEvent = {
  error: string
}

type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null
  start(): void
  stop(): void
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
}

export function InterviewSession({ inviteToken }: { inviteToken: string }) {
  const router = useRouter()
  const session = authClient.useSession()
  const viewer = useQuery(api.appUsers.getViewer, session.data ? {} : "skip")
  const canLoadInterview =
    session.data &&
    viewer?.appUser.role === "candidate" &&
    viewer.appUser.onboardingStatus === "completed"
  const interviewState = useQuery(
    api.interviews.getInterviewState,
    canLoadInterview ? { inviteToken } : "skip"
  )
  const startInterviewAction = useAction(
    makeFunctionReference<"action", { inviteToken: string }, unknown>(
      "interviewActions:startInterview"
    )
  )
  const submitAnswerAction = useAction(
    makeFunctionReference<
      "action",
      {
        interviewId: Id<"interviews">
        questionIndex: number
        content: string
      },
      unknown
    >("interviewActions:submitAnswer")
  )
  const savePartialAnswer = useMutation(api.interviews.upsertPartialAnswer)

  const [agentState, setAgentState] = useState<AgentState>("connecting")
  const [error, setError] = useState("")
  const [liveTranscript, setLiveTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [isSubmitting, startSubmitTransition] = useTransition()

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const hasStartedRef = useRef(false)
  const hasRequestedMicRef = useRef(false)
  const lastPartialSentRef = useRef("")
  const lastSpokenQuestionIdRef = useRef<string | null>(null)
  const currentInterviewRef = useRef<{
    interviewId: Id<"interviews">
    questionIndex: number
  } | null>(null)

  function stopListening() {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  function getSpeechRecognition() {
    const SpeechRecognitionApi =
      window.SpeechRecognition ?? window.webkitSpeechRecognition

    if (!SpeechRecognitionApi) {
      throw new Error("This interview currently requires Chrome speech recognition")
    }

    return SpeechRecognitionApi
  }

  function ensureRecognition() {
    if (recognitionRef.current) {
      return recognitionRef.current
    }

    const Recognition = getSpeechRecognition()
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      let nextTranscript = ""

      for (let index = 0; index < event.results.length; index++) {
        nextTranscript += event.results[index][0]?.transcript ?? ""
      }

      const cleaned = nextTranscript.trim()
      setLiveTranscript(cleaned)

      const currentInterview = currentInterviewRef.current

      if (cleaned && cleaned !== lastPartialSentRef.current && currentInterview) {
        lastPartialSentRef.current = cleaned
        void savePartialAnswer({
          interviewId: currentInterview.interviewId,
          questionIndex: currentInterview.questionIndex,
          content: cleaned,
        }).catch(() => {})
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
      setIsListening(false)
      setError(`Speech recognition error: ${event.error}`)
    }

    recognitionRef.current = recognition
    return recognition
  }

  function startListening() {
    try {
      const recognition = ensureRecognition()
      recognition.start()
      setIsListening(true)
      setAgentState("listening")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start speech recognition"
      )
    }
  }

  function speakQuestion(text: string) {
    if (!text.trim()) {
      return
    }

    window.speechSynthesis.cancel()
    stopListening()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onstart = () => setAgentState("speaking")
    utterance.onend = () => {
      setAgentState("listening")
      startListening()
    }
    utterance.onerror = () => {
      setError("Text-to-speech failed. You can still answer manually.")
      setAgentState("listening")
      startListening()
    }

    window.speechSynthesis.speak(utterance)
  }

  function handleSubmitAnswer() {
    if (!interviewState?.interview) {
      return
    }

    const finalAnswer = liveTranscript.trim()
    if (!finalAnswer) {
      setError("Please speak an answer before submitting")
      return
    }

    setError("")
    stopListening()
    window.speechSynthesis.cancel()
    setAgentState("thinking")

    startSubmitTransition(() => {
      void submitAnswerAction({
        interviewId: interviewState.interview!.id as Id<"interviews">,
        questionIndex: interviewState.interview!.currentQuestionIndex,
        content: finalAnswer,
      })
        .then(() => {
          setLiveTranscript("")
          lastPartialSentRef.current = ""
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to submit answer")
        })
    })
  }

  useEffect(() => {
    currentInterviewRef.current = interviewState?.interview
      ? {
          interviewId: interviewState.interview.id as Id<"interviews">,
          questionIndex: interviewState.interview.currentQuestionIndex,
        }
      : null
  }, [interviewState?.interview])

  useEffect(() => {
    if (!session.isPending && !session.data) {
      router.replace(`/login?role=candidate&invite=${inviteToken}`)
    }
  }, [inviteToken, router, session.data, session.isPending])

  useEffect(() => {
    if (!viewer) {
      return
    }

    if (viewer.appUser.role !== "candidate") {
      router.replace("/")
      return
    }

    if (viewer.appUser.onboardingStatus !== "completed") {
      router.replace(`/onboarding?invite=${inviteToken}`)
    }
  }, [inviteToken, router, viewer])

  useEffect(() => {
    if (hasRequestedMicRef.current || !session.data) {
      return
    }

    hasRequestedMicRef.current = true

    void navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setMediaStream(stream)
        setAgentState("initializing")
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Microphone access is required for the interview"
        )
      })
  }, [session.data])

  useEffect(() => {
    if (
      !session.data ||
      !viewer ||
      viewer.appUser.role !== "candidate" ||
      viewer.appUser.onboardingStatus !== "completed" ||
      interviewState === undefined ||
      interviewState.interview !== null ||
      hasStartedRef.current
    ) {
      return
    }

    hasStartedRef.current = true

    void startInterviewAction({ inviteToken }).catch((err) => {
      hasStartedRef.current = false
      setError(err instanceof Error ? err.message : "Failed to start interview")
    })
  }, [interviewState, inviteToken, session.data, startInterviewAction, viewer])

  useEffect(() => {
    if (!interviewState?.currentQuestion) {
      return
    }

    if (interviewState.interview?.status === "completed") {
      recognitionRef.current?.stop()
      window.speechSynthesis.cancel()
      return
    }

    if (lastSpokenQuestionIdRef.current === interviewState.currentQuestion.id) {
      return
    }

    lastSpokenQuestionIdRef.current = interviewState.currentQuestion.id
    speakQuestion(interviewState.currentQuestion.content)
    // `speakQuestion` reads the latest listening state directly from the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewState?.currentQuestion, interviewState?.interview?.status])

  useEffect(() => {
    return () => {
      stopListening()
      window.speechSynthesis.cancel()
      mediaStream?.getTracks().forEach((track) => track.stop())
    }
  }, [mediaStream])

  const finalizedTurns = (interviewState?.turns ?? []).filter((turn) => !turn.isPartial)
  const visualizerState =
    interviewState?.interview?.status === "completed" ? "thinking" : agentState

  if (session.isPending || (session.data && viewer === undefined)) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
        Loading interview…
      </div>
    )
  }

  if (!session.data || !viewer) {
    return null
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {interviewState?.job?.title ?? "Interview"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Chrome live interview with speech synthesis and speech recognition.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span>
                Question{" "}
                {interviewState?.interview
                  ? interviewState.interview.currentQuestionIndex + 1
                  : 1}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {interviewState?.interview?.status ?? "starting"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <BarVisualizer
              state={visualizerState}
              mediaStream={visualizerState === "listening" ? mediaStream : null}
              demo={visualizerState !== "listening"}
              centerAlign
              className="border"
            />

            <div className="rounded-2xl border p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                AI question
              </p>
              <p className="mt-3 text-lg leading-8">
                {interviewState?.currentQuestion?.content ??
                  "Preparing your first question…"}
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Your live answer
              </p>
              <p className="mt-3 min-h-24 whitespace-pre-wrap text-base leading-7 text-foreground">
                {liveTranscript || "Start speaking after the AI finishes."}
              </p>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  speakQuestion(interviewState?.currentQuestion?.content ?? "")
                }
                disabled={!interviewState?.currentQuestion?.content}
              >
                Replay question
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setError("")
                  startListening()
                }}
                disabled={isListening}
              >
                {isListening ? "Listening…" : "Restart listening"}
              </Button>
              <Button
                variant="outline"
                onClick={stopListening}
                disabled={!isListening}
              >
                Stop listening
              </Button>
              <Button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || !liveTranscript.trim()}
              >
                {isSubmitting ? "Submitting…" : "Submit answer"}
              </Button>
            </div>

            {interviewState?.interview?.status === "completed" ? (
              <div className="rounded-2xl border p-5 text-sm text-muted-foreground">
                Interview complete. We have stored the transcript and final state for
                the next evaluation step.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {finalizedTurns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Transcript will appear here as the interview progresses.
              </p>
            ) : null}
            {finalizedTurns.map((turn) => (
              <div
                key={turn.id}
                className="rounded-xl border p-3 text-sm leading-6"
              >
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {turn.role === "ai" ? "AI" : "Candidate"} · Q
                  {turn.questionIndex + 1}
                </p>
                <p>{turn.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

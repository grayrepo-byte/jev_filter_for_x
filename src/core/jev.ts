import type {
  Classification,
  NoiseType,
  Post,
  Topic,
  Value,
  Want,
} from './types'
import { NOISE_TYPES, TOPICS, WANTS } from './types'
import { SCORE_LEVELS, composeScore } from './scoring'
import type { Classifier } from './classifier'

export const NOUL_HIT_THRESHOLD = 0.5

export class JevAuthError extends Error {
  constructor(readonly status: number) {
    super(`Jev rejected the request: ${status}`)
    this.name = 'JevAuthError'
  }
}

export class JevRequestError extends Error {
  constructor(
    readonly status: number,
    readonly detail?: string,
  ) {
    super(`Jev request failed: ${status}${detail ? ` (${detail})` : ''}`)
    this.name = 'JevRequestError'
  }
}

const MAX_RETRIES = 2
const RETRY_BASE_MS = 500
const RETRYABLE = new Set([429, 529])
const ENDPOINT = 'https://api.typesafe.ai/v1/systemone'
const MODEL = 'jev-latest'
export const REQUEST_TIMEOUT_MS = 15_000

export type JevQuestion = {
  type: 'choice' | 'score' | 'noul'
  instructions: string
  criteria?: unknown
}

export type JevAnswer = {
  type?: string
  choice?: string
  noul?: number
  score?: number
  confidence?: number
}

const VALUE_CRITERIA = {
  USEFUL:
    'The reader gains something concrete: a skill, an opportunity, a lesson, or real insight.',
  NEUTRAL: 'Pleasant or harmless but neither valuable nor objectionable.',
  NOISE:
    'Adds nothing: filler, chatter, engagement bait, or pure self-expression.',
}

export function buildQuestions(posts: Post[]): Record<string, JevQuestion> {
  const questions: Record<string, JevQuestion> = {}

  posts.forEach((_, index) => {
    const text = `\`posts[${index}].text\``
    const prefix = `p${index}_`

    questions[`${prefix}value`] = {
      type: 'choice',
      instructions: `What does ${text} offer someone who wants a high-signal feed?`,
      criteria: VALUE_CRITERIA,
    }

    const addScore = (name: string, instructions: string) => {
      questions[`${prefix}${name}`] = {
        type: 'score',
        instructions: `${instructions} Judge only ${text} on its own.`,
        criteria: [...SCORE_LEVELS],
      }
    }
    addScore('signal', 'How much real information does it convey?')
    addScore('action', 'How much could the reader act on after reading it?')
    addScore(
      'original',
      'How original is it rather than recycled, restated, or clickbait?',
    )

    for (const topic of TOPICS) {
      questions[`${prefix}topic_${topic}`] = {
        type: 'noul',
        instructions: `Is ${text} substantively about ${topic.toLowerCase()}? Judge the subject matter, not the quality.`,
      }
    }
    for (const want of WANTS) {
      questions[`${prefix}want_${want}`] = {
        type: 'noul',
        instructions: `Would a reader plausibly get ${want.replace(/_/g, ' ').toLowerCase()} out of ${text}?`,
      }
    }

    questions[`${prefix}noise`] = {
      type: 'choice',
      instructions: `Assuming ${text} is low-value everyday content, which category fits it best? Answer NONE if it is not low-value content.`,
      criteria: {
        DAILY: 'Personal life updates, food, weather, travel, or mundane status.',
        ENTERTAINMENT: 'Sports, celebrities, movies, games, or fandom chatter.',
        RANT: 'Complaining, venting, or frustration with no lesson for the reader.',
        MEME: 'Jokes, image macros, or humorous one-liners.',
        PROMOTION: 'Marketing, affiliate links, or engagement farming.',
        NONE: 'Not low-value content.',
      },
    }
  })

  return questions
}

function pickOne<T extends string>(
  answers: Record<string, JevAnswer>,
  id: string,
  allowed: readonly T[],
): T | null {
  const choice = answers[id]?.choice
  return choice && (allowed as readonly string[]).includes(choice)
    ? (choice as T)
    : null
}

function scoreOf(answers: Record<string, JevAnswer>, id: string): number {
  const value = answers[id]?.score
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function isHit(answers: Record<string, JevAnswer>, id: string): boolean {
  const value = answers[id]?.noul
  return typeof value === 'number' && value > NOUL_HIT_THRESHOLD
}

export function mapAnswers(
  posts: Post[],
  answers: Record<string, JevAnswer>,
): Classification[] {
  const classifiedAt = Date.now()
  return posts.map((post, index) => {
    const prefix = `p${index}_`
    const noiseType = pickOne(
      answers,
      `${prefix}noise`,
      NOISE_TYPES,
    ) as NoiseType | null
    return {
      tweetId: post.id,
      topics: TOPICS.filter((topic) =>
        isHit(answers, `${prefix}topic_${topic}`),
      ) as Topic[],
      value:
        (pickOne(
          answers,
          `${prefix}value`,
          ['USEFUL', 'NEUTRAL', 'NOISE'] as const,
        ) as Value | null) ?? 'NEUTRAL',
      wants: WANTS.filter((want) =>
        isHit(answers, `${prefix}want_${want}`),
      ) as Want[],
      noiseType,
      score: composeScore({
        signal: scoreOf(answers, `${prefix}signal`),
        action: scoreOf(answers, `${prefix}action`),
        original: scoreOf(answers, `${prefix}original`),
      }),
      confidence: answers[`${prefix}value`]?.confidence ?? 0,
      classifiedAt,
      model: MODEL,
    }
  })
}

type JevOptions = {
  fetchImpl?: typeof fetch
  sleep?: (milliseconds: number) => Promise<void>
  timeoutMs?: number
}

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds))

export class JevClassifier implements Classifier {
  private readonly fetchImpl: typeof fetch
  private readonly sleep: (milliseconds: number) => Promise<void>
  private readonly timeoutMs: number

  constructor(
    private readonly apiKey: string,
    options: JevOptions = {},
  ) {
    // Keep the native function bound to the extension worker global. Calling a
    // detached Web API as a class member can otherwise use the classifier as
    // its receiver and fail before Chrome creates a network request.
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis)
    this.sleep = options.sleep ?? defaultSleep
    this.timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS
  }

  private async send(posts: Post[]): Promise<Response> {
    const body = JSON.stringify({
      model: MODEL,
      state: {
        posts: posts.map(({ id, author, text }) => ({ id, author, text })),
      },
      questions: buildQuestions(posts),
    })

    for (let attempt = 0; ; attempt++) {
      let response: Response
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
      try {
        response = await this.fetchImpl(ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body,
          signal: controller.signal,
        })
      } catch (error) {
        const detail =
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : String(error)
        throw new JevRequestError(0, detail)
      } finally {
        clearTimeout(timeout)
      }

      if (response.ok) return response
      if (response.status === 401 || response.status === 422) {
        throw new JevAuthError(response.status)
      }
      if (RETRYABLE.has(response.status) && attempt < MAX_RETRIES) {
        await this.sleep(RETRY_BASE_MS * 2 ** attempt)
        continue
      }
      throw new JevRequestError(response.status)
    }
  }

  async classify(posts: Post[]): Promise<Classification[]> {
    if (posts.length === 0) return []
    const response = await this.send(posts)
    const body = (await response.json()) as {
      answers?: Record<string, JevAnswer>
    }
    return mapAnswers(posts, body.answers ?? {})
  }
}

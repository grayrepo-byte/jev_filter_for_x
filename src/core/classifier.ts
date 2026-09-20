import type {
  Classification,
  NoiseType,
  Post,
  Topic,
  Value,
  Want,
} from './types'
import { NOISE_TYPES, TOPICS, WANTS } from './types'
import { MAX_LEVEL, composeScore } from './scoring'
import { JevClassifier } from './jev'
import { DEFAULT_ENDPOINT } from './endpoint'

const MOCK_CLASSIFIED_AT = Date.now()

export interface Classifier {
  classify(posts: Post[]): Promise<Classification[]>
}

function hash32(input: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

export class MockClassifier implements Classifier {
  async classify(posts: Post[]): Promise<Classification[]> {
    return posts.map((post) => {
      const hash = hash32(post.text)
      const level = (shift: number) =>
        (hash >>> shift) % (MAX_LEVEL + 1)
      const score = composeScore({
        signal: level(0),
        action: level(4),
        original: level(8),
      })
      const value: Value =
        score >= 60 ? 'USEFUL' : score < 30 ? 'NOISE' : 'NEUTRAL'

      return {
        tweetId: post.id,
        topics: TOPICS.filter(
          (_, index) => (hash >>> index) % 4 === 0,
        ) as Topic[],
        value,
        wants: WANTS.filter(
          (_, index) => (hash >>> (index + 2)) % 3 === 0,
        ) as Want[],
        noiseType:
          value === 'NOISE'
            ? (NOISE_TYPES[(hash >>> 6) % NOISE_TYPES.length] as NoiseType)
            : null,
        score,
        confidence: 0.5 + (hash % 50) / 100,
        classifiedAt: MOCK_CLASSIFIED_AT,
        model: 'mock',
      }
    })
  }
}

export function createClassifier(
  apiKey: string,
  endpoint = DEFAULT_ENDPOINT,
): Classifier {
  return apiKey
    ? new JevClassifier(apiKey, { endpoint })
    : new MockClassifier()
}

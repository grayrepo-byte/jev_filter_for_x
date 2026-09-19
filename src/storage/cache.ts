import type { Classification } from '../core/types'

const DB_NAME = 'signalfeed'
const DB_VERSION = 1
const STORE = 'classifications'

export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'tweetId' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function useStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const request = operation(transaction.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.onabort = () => reject(transaction.error)
    transaction.oncomplete = () => db.close()
  })
}

export async function getCached(
  keys: string[],
): Promise<Map<string, Classification>> {
  const found = new Map<string, Classification>()
  if (keys.length === 0) return found

  const now = Date.now()
  const results = await Promise.all(
    keys.map((key) =>
      useStore('readonly', (store) => store.get(key)) as Promise<
        Classification | undefined
      >,
    ),
  )
  for (const item of results) {
    if (item && now - item.classifiedAt <= CACHE_TTL_MS) {
      found.set(item.tweetId, item)
    }
  }
  return found
}

export async function putCached(items: Classification[]): Promise<void> {
  if (items.length === 0) return
  await useStore('readwrite', (store) => {
    for (const item of items) store.put(item)
    return store.count()
  })
}

export async function pruneExpired(): Promise<number> {
  const all = (await useStore('readonly', (store) =>
    store.getAll(),
  )) as Classification[]
  const now = Date.now()
  const expired = all.filter(
    (item) => now - item.classifiedAt > CACHE_TTL_MS,
  )
  if (expired.length === 0) return 0

  await useStore('readwrite', (store) => {
    for (const item of expired) store.delete(item.tweetId)
    return store.count()
  })
  return expired.length
}

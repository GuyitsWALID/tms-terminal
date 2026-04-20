import type { NewsItem } from "@/types/api";

type FinancialJuiceLiveItem = NewsItem & {
  sourcePostId: string;
  publishedAt: string;
  url?: string;
  rawText?: string;
  receivedAt: string;
};

type FinancialJuiceStoreState = {
  items: FinancialJuiceLiveItem[];
  seenPostIds: Set<string>;
  sequence: number;
};

const MAX_ITEMS = 300;

declare global {
  var __tmsFinancialJuiceStore: FinancialJuiceStoreState | undefined;
}

const getStore = (): FinancialJuiceStoreState => {
  if (!globalThis.__tmsFinancialJuiceStore) {
    globalThis.__tmsFinancialJuiceStore = {
      items: [],
      seenPostIds: new Set<string>(),
      sequence: 0,
    };
  }

  return globalThis.__tmsFinancialJuiceStore;
};

const normalizeHeadline = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

export const addFinancialJuiceLiveItem = (item: FinancialJuiceLiveItem) => {
  const store = getStore();
  const normalizedPostId = item.sourcePostId.trim();

  if (store.seenPostIds.has(normalizedPostId)) {
    return { added: false, item: null as FinancialJuiceLiveItem | null, sequence: store.sequence };
  }

  const duplicateByContent = store.items.some((row) => {
    return normalizeHeadline(row.headline) === normalizeHeadline(item.headline) && row.publishedAt === item.publishedAt;
  });

  if (duplicateByContent) {
    store.seenPostIds.add(normalizedPostId);
    return { added: false, item: null as FinancialJuiceLiveItem | null, sequence: store.sequence };
  }

  const nextItem: FinancialJuiceLiveItem = {
    ...item,
    sourcePostId: normalizedPostId,
  };

  store.items.unshift(nextItem);
  store.seenPostIds.add(normalizedPostId);

  if (store.items.length > MAX_ITEMS) {
    const removed = store.items.splice(MAX_ITEMS);
    removed.forEach((row) => {
      store.seenPostIds.delete(row.sourcePostId);
    });
  }

  store.sequence += 1;

  return { added: true, item: nextItem, sequence: store.sequence };
};

export const getFinancialJuiceSnapshot = (limit = 100) => {
  const store = getStore();
  return store.items.slice(0, limit);
};

export const getFinancialJuiceSequence = () => {
  const store = getStore();
  return store.sequence;
};

export const getFinancialJuiceChangesSince = (sequence: number, limit = 100) => {
  const store = getStore();
  if (store.sequence <= sequence) {
    return { sequence: store.sequence, items: [] as FinancialJuiceLiveItem[] };
  }

  return {
    sequence: store.sequence,
    items: store.items.slice(0, limit),
  };
};

export type { FinancialJuiceLiveItem };

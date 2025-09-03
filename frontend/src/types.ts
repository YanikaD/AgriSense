export type Hit = {
  id: string;
  text: string;
  score: number;
  doc_id?: string;
  product?: string;
  market_code?: string[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  hits?: Hit[];
  latency_ms?: number;
};

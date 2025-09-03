import type { Hit } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_BASE!;

export async function searchHits(query: string): Promise<Hit[]> {
  const t0 = performance.now();
  const r = await fetch(`${BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: 6 }),
  });
  if (!r.ok) throw new Error(`search failed: ${r.status}`);
  const data = await r.json();
  const t1 = performance.now();
  // normalize as needed
  return data.hits?.map((h: any) => ({
    id: h.id, text: h.text, score: h.score,
    doc_id: h.doc_id, product: h.product, market_code: h.market_code
  })) || [];
}

export const streamUrl = () => `${BASE}/chat/stream`;

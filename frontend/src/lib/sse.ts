export async function streamSSE(
  url: string,
  body: any,
  onToken: (t: string) => void,
  onDone: () => void,
  onError: (e: any) => void
) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
  });
  if (!resp.ok || !resp.body) {
    onError(new Error(`Bad response: ${resp.status}`));
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      // SSE frames look like: "data: {...}\n\n" or "data: token\n\n"
      const parts = buf.split("\n\n");
      for (let i = 0; i < parts.length - 1; i++) {
        const line = parts[i].trim();
        if (line.startsWith("data:")) {
          const data = line.slice(5).trim();
          if (data === "[DONE]") {
            onDone();
            return;
          }
          onToken(data);
        }
      }
      buf = parts[parts.length - 1]; // carry over partial
    }
    onDone();
  } catch (e) {
    onError(e);
  }
}

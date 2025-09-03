// src/components/ChatPanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { 
  id: string;
  role: "user" | "assistant"; 
  text: string; 
  loading?: boolean; 
  error?: boolean;
  timestamp: number;
};

export default function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("themeColor") : null;
    const isLight = saved === "light_mode";
    setLightMode(isLight);
    document.body.classList.toggle("light_mode", isLight);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo(0, chatRef.current.scrollHeight);
    }
  }, [messages]);

  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const copyMessage = (text: string, btn: HTMLSpanElement | null) => {
    navigator.clipboard.writeText(text);
    if (btn) {
      const prev = btn.innerText;
      btn.innerText = "done";
      setTimeout(() => (btn.innerText = prev), 1000);
    }
  };

  const toggleTheme = () => {
    const next = !lightMode;
    setLightMode(next);
    document.body.classList.toggle("light_mode", next);
    localStorage.setItem("themeColor", next ? "light_mode" : "dark_mode");
  };

  // --- Send message and stream assistant response ---
  const send = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    const userMessage: Msg = {
      id: generateId(),
      role: "user",
      text: text.trim(),
      timestamp: Date.now()
    };

    const assistantMessage: Msg = {
      id: generateId(),
      role: "assistant",
      text: "",
      loading: true,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      const resp = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text.trim() }),
      });

      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, text: msg.text + chunk }
              : msg
          ));
        }
      }

      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, loading: false }
          : msg
      ));

    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              text: err instanceof Error ? `Error: ${err.message}` : "Error generating response",
              loading: false,
              error: true 
            }
          : msg
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    if (isGenerating) return;
    setMessages([]);
  };

  // ✅ New: question-active when there's at least one assistant message
  const hasAssistantMessage = messages.some(m => m.role === "assistant");
  const rootClass = `h-full overflow-hidden relative ${hasAssistantMessage ? "question-active" : ""}`;

  return (
    <div className={rootClass}>
      {/* Floating theme toggle */}
      <span
        className="floating-theme-toggle material-symbols-rounded"
        onClick={toggleTheme}
        role="button"
        aria-label="Toggle theme"
      >
        {lightMode ? "dark_mode" : "light_mode"}
      </span>

      {/* Header - Hide when there are messages */}
      <header className={`header ${messages.length > 0 ? 'hidden' : ''}`}>
        <div className="title-row">
          <h1 className="title">Hello, there</h1>
          <p className="subtitle">How can I help you today?</p>
        </div>
      </header>

      {/* Chat messages */}
      <div ref={chatRef} className="chat-list">
        {messages.map((m) => {
          const incoming = m.role === "assistant";
          return (
            <div
              key={m.id}
              className={`message-container ${incoming ? "assistant-container" : "user-container"}`}
            >
              <div
                className={`message-cloud ${incoming ? "assistant-cloud" : "user-cloud"} ${
                  m.loading ? "loading" : ""
                } ${m.error ? "error" : ""}`}
              >
                <div className="cloud-content">
                  <div className="message-header">
                    <span className="message-role">
                      {incoming ? "🤖 Assistant" : "👤 You"}
                    </span>
                    {!m.loading && m.text && (
                      <span
                        className="icon material-symbols-rounded copy-button"
                        onClick={(e) => copyMessage(m.text, e.currentTarget as HTMLSpanElement)}
                        title="Copy"
                        role="button"
                        aria-label="Copy message"
                      >
                        content_copy
                      </span>
                    )}
                  </div>
                  <div className="message-body">
                    <p className="text">{m.text}</p>
                    {m.loading && !m.text && (
                      <div className="loading-indicator">
                        <div className="network-container">
                          <div className="network-node"></div>
                          <div className="network-node"></div>
                          <div className="network-node"></div>
                          <div className="network-node"></div>
                          <div className="network-node"></div>
                          <div className="network-node"></div>
                          <div className="network-node"></div>
                          <div className="network-line"></div>
                          <div className="network-line"></div>
                          <div className="network-line"></div>
                          <div className="network-line"></div>
                          <div className="network-line"></div>
                          <div className="network-line"></div>
                        </div>
                        <div className="loading-text">Searching...</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="cloud-decoration">
                  <div className="cloud-bubble cloud-bubble-1"></div>
                  <div className="cloud-bubble cloud-bubble-2"></div>
                  <div className="cloud-bubble cloud-bubble-3"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Typing area */}
      <div className="typing-area">
        <form
          className="typing-form"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="input-wrapper">
            <input
              className="typing-input"
              placeholder="Enter a prompt here"
              required
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isGenerating}
            />
            <button 
              id="send-message-button" 
              className="icon material-symbols-rounded"
              type="submit"
              disabled={isGenerating || !input.trim()}
            >
              send
            </button>
          </div>
          <div className="action-buttons">
            <span
              id="delete-chat-button"
              className="icon material-symbols-rounded"
              onClick={clearChat}
              role="button"
              aria-label="Clear chat"
            >
              delete
            </span>
          </div>
        </form>
        <p className="disclaimer-text">@2025 AgrIsense demo</p>
      </div>
    </div>
  );
}

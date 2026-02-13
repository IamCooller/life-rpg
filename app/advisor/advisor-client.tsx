"use client";

import { useState } from "react";
import { Bot, Send, Loader2 } from "lucide-react";
import { GameCard } from "@/components/ui/game-card";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AdvisorClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Привет! Я твой AI-коуч. Могу проанализировать твой прогресс и дать рекомендации. Спроси меня о чём угодно — какие привычки добавить, как улучшить баланс скиллов, или просто попроси совет.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "Не удалось получить ответ." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ошибка соединения. Попробуй ещё раз." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold">
        <Bot size={24} className="text-accent-cyan" />
        AI Коуч
      </h1>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-accent-purple/20 text-foreground"
                  : "border border-card-border bg-card text-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-card-border bg-card px-4 py-3">
              <Loader2 size={16} className="animate-spin text-accent-cyan" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <GameCard className="mt-auto">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Спроси AI-коуча..."
            className="flex-1 rounded-xl border border-card-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-accent-purple focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple px-4 py-2.5 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </GameCard>
    </div>
  );
}

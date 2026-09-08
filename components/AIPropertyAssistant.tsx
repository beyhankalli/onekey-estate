"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bot, ChevronDown, Send, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";

type Recommendation = {
  id: string;
  title: string | null;
  location: string | null;
  rent_pcm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  image: string | null;
  availability: string | null;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  recommendations?: Recommendation[];
};

const quickPrompts = [
  "Find me a 2 bedroom home under £1,200 pcm",
  "Which properties allow pets?",
  "Show me properties suitable for students",
];

export default function AIPropertyAssistant() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm OneKey AI. I can help you find properties, compare options and answer questions about our listings.",
    },
  ]);

  const currentPropertyId = useMemo(() => {
    if (!pathname?.startsWith("/listings/")) return null;

    const id = pathname.split("/listings/")[1]?.split("/")[0];

    return id || null;
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function sendMessage(customMessage?: string) {
    const message = (customMessage ?? input).trim();

    if (!message || loading) return;

    setInput("");

    const userMessage: Message = {
      role: "user",
      content: message,
    };

    const previousMessages = messages;

    setMessages((current) => [...current, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/property-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          currentPropertyId,
          history: previousMessages.slice(-8).map((item) => ({
            role: item.role,
            content: item.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "The AI assistant is temporarily unavailable."
        );
      }

      const assistantMessage: Message = {
        role: "assistant",
        content:
          data?.answer ||
          "I couldn't find an answer to that. Please try another question.",
        recommendations: Array.isArray(data?.recommendations)
          ? data.recommendations
          : [],
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      console.error(error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:scale-[1.03] hover:bg-neutral-800"
          aria-label="Open OneKey AI"
        >
          <Sparkles className="h-4 w-4" />
          OneKey AI
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(680px,calc(100vh-40px))] w-[min(420px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-black px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <Bot className="h-5 w-5" />
              </div>

              <div>
                <div className="text-sm font-semibold">
                  OneKey AI
                </div>
                <div className="text-xs text-white/60">
                  Property Assistant
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close OneKey AI"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-neutral-50 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-md bg-black px-4 py-3 text-sm text-white"
                      : "max-w-[92%] rounded-2xl rounded-bl-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-sm"
                  }
                >
                  <div className="whitespace-pre-wrap leading-6">
                    {message.content}
                  </div>

                  {message.recommendations &&
                    message.recommendations.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {message.recommendations.map((property) => (
                          <Link
                            key={property.id}
                            href={`/listings/${property.id}`}
                            onClick={() => setOpen(false)}
                            className="block overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-neutral-400 hover:shadow-md"
                          >
                            {property.image && (
                              <img
                                src={property.image}
                                alt={property.title || "Property"}
                                className="h-32 w-full object-cover"
                              />
                            )}

                            <div className="p-3">
                              <div className="line-clamp-2 text-sm font-semibold text-neutral-900">
                                {property.title || "Property"}
                              </div>

                              {property.location && (
                                <div className="mt-1 text-xs text-neutral-500">
                                  {property.location}
                                </div>
                              )}

                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-600">
                                {property.rent_pcm != null && (
                                  <span>
                                    £
                                    {property.rent_pcm.toLocaleString()}
                                    /pcm
                                  </span>
                                )}

                                {property.bedrooms != null && (
                                  <span>
                                    {property.bedrooms} bed
                                  </span>
                                )}

                                {property.bathrooms != null && (
                                  <span>
                                    {property.bathrooms} bath
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500 shadow-sm">
                  OneKey AI is thinking...
                </div>
              </div>
            )}
          </div>

          {messages.length === 1 && (
            <div className="border-t border-neutral-200 bg-white px-4 py-3">
              <div className="mb-2 text-xs font-medium text-neutral-500">
                Try asking:
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    disabled={loading}
                    className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 transition hover:border-neutral-400 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
            className="border-t border-neutral-200 bg-white p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2 focus-within:border-neutral-400">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Ask about our properties..."
                rows={2}
                maxLength={1200}
                disabled={loading}
                className="min-h-[48px] flex-1 resize-none bg-transparent px-2 py-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-neutral-400">
              <span>OneKey AI</span>
              <span>{input.length}/1200</span>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
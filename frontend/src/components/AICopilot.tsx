"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Trash2,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Crosshair,
  Trophy,
  Layers,
  ChevronDown,
} from "lucide-react";
import { ChatMessage, CopilotChatResponse } from "../lib/types";
import { sendCopilotMessage } from "../lib/api";

interface AICopilotProps {
  fileId: string;
  datasetName?: string;
  onTriggerAction?: (action: string, targetColumn?: string) => void;
}

export const AICopilot: React.FC<AICopilotProps> = ({
  fileId,
  datasetName = "Dataset",
  onTriggerAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `👋 Hi! I'm your **AI Data Scientist Copilot** for **${datasetName}**.\n\nAsk me anything about your schema, distributions, data quality, or ask for recommendations on which machine learning model to train.`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([
    "Summarize this dataset",
    "Which features have highest correlation?",
    "What are the data quality issues?",
    "Recommend the best ML model",
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage("");

    const newHistory: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const res: CopilotChatResponse = await sendCopilotMessage({
        file_id: fileId,
        message: text,
        history: newHistory,
      });

      setMessages([
        ...newHistory,
        { role: "assistant", content: res.reply },
      ]);

      if (res.suggested_actions && res.suggested_actions.length > 0) {
        setSuggestedActions(res.suggested_actions);
      }
      if (res.suggested_follow_ups && res.suggested_follow_ups.length > 0) {
        setSuggestedFollowUps(res.suggested_follow_ups);
      }
    } catch (err: any) {
      console.error("Copilot chat error:", err);
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content:
            "⚠️ Sorry, I encountered an issue connecting with the AI model. Please check your network and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        role: "assistant",
        content: `Chat history cleared. How can I assist you with **${datasetName}**?`,
      },
    ]);
    setSuggestedActions([]);
    setSuggestedFollowUps([
      "Summarize this dataset",
      "Which features have highest correlation?",
      "Recommend the best ML model",
    ]);
  };

  const getActionLabel = (action: string) => {
    switch (action.toLowerCase()) {
      case "clean":
        return { label: "Clean & Transform", icon: <Sparkles className="h-3 w-3" /> };
      case "visualize":
        return { label: "Generate Visualizations", icon: <BarChart3 className="h-3 w-3" /> };
      case "predict":
        return { label: "Predict & Forecast", icon: <TrendingUp className="h-3 w-3" /> };
      case "insights":
        return { label: "Extract Insights", icon: <Lightbulb className="h-3 w-3" /> };
      case "classify":
        return { label: "Train Classifier", icon: <Crosshair className="h-3 w-3" /> };
      case "automl":
        return { label: "Run AutoML Benchmark", icon: <Trophy className="h-3 w-3" /> };
      case "analyze_all":
        return { label: "Analyze Everything", icon: <Layers className="h-3 w-3" /> };
      default:
        return { label: action, icon: <Sparkles className="h-3 w-3" /> };
    }
  };

  return (
    <>
      {/* Floating Trigger Button (when drawer is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-sm shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all group"
          aria-label="Open AI Copilot"
        >
          <div className="relative">
            <Bot className="h-5 w-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>
          <span>AI Copilot</span>
          <Sparkles className="h-4 w-4 text-amber-300 opacity-80 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Slide-Over Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[440px] max-w-[calc(100vw-2rem)] h-[640px] max-h-[calc(100vh-5rem)] rounded-2xl shadow-2xl bg-slate-950/95 border border-slate-700/80 backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Bot className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-slate-100">AI Data Scientist Copilot</h4>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono uppercase">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                  Context: <span className="font-mono text-slate-300">{datasetName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-slate-400">
              <button
                onClick={clearHistory}
                title="Clear conversation"
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Copilot"
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={index}
                  className={`flex items-start space-x-2.5 ${
                    isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                      isUser
                        ? "bg-indigo-600 text-white"
                        : "bg-purple-600/20 border border-purple-500/40 text-purple-300"
                    }`}
                  >
                    {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>

                  <div
                    className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10"
                        : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center space-x-2.5 text-slate-400">
                <div className="h-7 w-7 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                  <span className="text-xs text-slate-400">AI is analyzing dataset context...</span>
                </div>
              </div>
            )}

            {/* Dynamic Action Trigger Chips */}
            {suggestedActions.length > 0 && !isLoading && (
              <div className="pt-2 pb-1 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Suggested Actions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedActions.map((action) => {
                    const info = getActionLabel(action);
                    return (
                      <button
                        key={action}
                        onClick={() => onTriggerAction && onTriggerAction(action)}
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium transition-all active:scale-95"
                      >
                        {info.icon}
                        <span>{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Smart Follow-Up Prompts */}
          {suggestedFollowUps.length > 0 && (
            <div className="px-3 pt-2 pb-1 border-t border-slate-800/80 bg-slate-900/50">
              <div className="flex items-center space-x-1 mb-1.5 text-slate-400 text-[10px] font-semibold">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>Suggested Follow-ups</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                {suggestedFollowUps.map((q, idx) => (
                  <button
                    key={idx}
                    disabled={isLoading}
                    onClick={() => handleSendMessage(q)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition-colors disabled:opacity-50 shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask anything about the dataset..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:pointer-events-none active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

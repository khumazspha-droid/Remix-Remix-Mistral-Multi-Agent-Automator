import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Brain, 
  Zap, 
  ShieldAlert,
  ChevronRight,
  History,
  Globe
} from "lucide-react";

// Utility for tailwind classes
const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

interface LogEntry {
  agent: "BLUE" | "RED" | "BLACK" | "ORCHESTRATOR";
  status: "thinking" | "completed" | "failed";
  message: string;
  timestamp: string;
}

const AGENT_INFO = {
  BLUE: {
    name: "Blue Agent",
    role: "Navigator",
    icon: Brain,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  RED: {
    name: "Red Agent",
    role: "Executor",
    icon: Zap,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  BLACK: {
    name: "Black Agent",
    role: "Fallback",
    icon: ShieldAlert,
    color: "text-zinc-900",
    bg: "bg-zinc-100",
  },
};

export default function App() {
  const [goal, setGoal] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const scanPage = async () => {
    // In a real extension, this would use chrome.tabs.sendMessage
    // For this demo, we simulate the scan
    return {
      url: "https://example.com",
      title: "Example Domain",
      interactiveElements: [
        { tag: "A", text: "More information...", id: "", className: "" }
      ]
    };
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    setLogs([]);

    try {
      const pageState = await scanPage();
      setPageInfo(pageState);

      const response = await fetch("http://localhost:3000/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, pageState }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Execution failed");
      }

      for (const log of data.logs) {
        setLogs((prev) => [...prev, log]);
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="w-[400px] min-h-[500px] bg-[#E4E3E0] text-[#141414] font-sans p-4 flex flex-col gap-4 border border-[#141414]">
      <header className="border-b border-[#141414] pb-3 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold tracking-tighter uppercase">Blue & Red <span className="opacity-50">Agent</span></h1>
          <p className="text-[10px] italic font-serif opacity-60">Extension Controller v2.0</p>
        </div>
        <div className="text-[9px] font-mono opacity-40">ID: BR-774</div>
      </header>

      <main className="flex flex-col gap-4 flex-1">
        <section className="border border-[#141414] p-3 bg-white/50">
          <h2 className="text-[10px] uppercase font-serif italic opacity-60 mb-2 flex items-center gap-1">
            <Terminal size={10} /> Objective
          </h2>
          <form onSubmit={handleExecute} className="space-y-2">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What should the agent do on this page?"
              className="w-full h-20 p-2 bg-white border border-[#141414] text-xs font-mono focus:outline-none resize-none"
              disabled={isExecuting}
            />
            <button
              type="submit"
              disabled={isExecuting || !goal.trim()}
              className={cn(
                "w-full py-2 px-4 flex items-center justify-center gap-2 font-bold uppercase text-[10px] tracking-widest transition-all",
                isExecuting ? "bg-zinc-200 text-zinc-400" : "bg-zinc-900 text-white hover:bg-zinc-800"
              )}
            >
              {isExecuting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
              {isExecuting ? "Executing" : "Start Agent"}
            </button>
          </form>
        </section>

        {pageInfo && (
          <div className="text-[9px] font-mono bg-white p-2 border border-[#141414] flex items-center gap-2">
            <Globe size={10} />
            <span className="truncate">{pageInfo.url}</span>
          </div>
        )}

        <section className="border border-[#141414] bg-zinc-900 text-zinc-300 flex-1 flex flex-col overflow-hidden min-h-[200px]">
          <div className="p-1.5 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
            <span className="text-[8px] font-mono uppercase opacity-50 tracking-widest">Live Logs</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
            </div>
          </div>
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-3"
          >
            {logs.length === 0 && !isExecuting && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-10">
                <Terminal size={24} strokeWidth={1} className="mb-2" />
                <p>System Ready</p>
              </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-1 py-0.5 text-[8px] font-bold rounded-sm",
                    log.agent === "BLUE" ? "bg-blue-500/20 text-blue-400" :
                    log.agent === "RED" ? "bg-red-500/20 text-red-400" :
                    "bg-zinc-500/20 text-zinc-400"
                  )}>
                    {log.agent}
                  </span>
                  <span className="text-[8px] opacity-30">[{log.timestamp}]</span>
                </div>
                <div className="text-zinc-100 leading-tight">{log.message}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#141414] pt-2 flex justify-between text-[8px] font-mono uppercase opacity-40">
        <span>Mistral Orchestrator</span>
        <span>&copy; 2026</span>
      </footer>
    </div>
  );
}

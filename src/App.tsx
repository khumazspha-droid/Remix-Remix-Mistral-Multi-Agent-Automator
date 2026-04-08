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
  Globe,
  Layout
} from "lucide-react";

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

interface LogEntry {
  agent: "BLUE" | "RED" | "BLACK" | "ORCHESTRATOR";
  status: "thinking" | "completed" | "failed";
  message: string;
  timestamp: string;
  screenshot?: string;
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
  const [targetUrl, setTargetUrl] = useState("https://www.google.com");
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    setLogs([]);
    setCurrentScreenshot(null);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          goal, 
          pageState: { url: targetUrl, title: "Target Page" } 
        }),
      });

      if (!response.ok) {
        throw new Error("Execution failed to start");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const log: LogEntry = JSON.parse(line.slice(6));
              
              if (log.message !== "Updating visual state...") {
                setLogs((prev) => [...prev, log]);
              }
              
              if (log.screenshot) {
                setCurrentScreenshot(log.screenshot);
              }
            } catch (err) {
              console.error("Error parsing log:", err);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans p-6 flex flex-col gap-6 max-w-5xl mx-auto">
      <header className="border-b border-[#141414] pb-6 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layout size={20} className="opacity-40" />
            <span className="text-[10px] uppercase tracking-widest font-mono opacity-40">Backend Preview & Extension Controller</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tighter uppercase">Blue & Red <span className="opacity-40">AI Agent</span></h1>
          <p className="text-sm italic font-serif opacity-60 mt-1">Full-Stack Multi-Agent Orchestration Framework</p>
        </div>
        <div className="flex gap-4 text-[10px] font-mono uppercase opacity-40">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Backend Online
          </div>
          <div>v2.0.0-alpha</div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left: Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="border border-[#141414] p-6 bg-white/50 backdrop-blur-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="text-xs uppercase font-serif italic opacity-60 mb-4 flex items-center gap-2">
              <Terminal size={14} /> Task Orchestration
            </h2>
            <form onSubmit={handleExecute} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase opacity-40">Target URL (Crawl Source)</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#141414] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all"
                    disabled={isExecuting}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase opacity-40">Objective</label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Define the objective for the agents..."
                  className="w-full h-32 p-3 bg-white border border-[#141414] text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all resize-none"
                  disabled={isExecuting}
                />
              </div>
              <button
                type="submit"
                disabled={isExecuting || !goal.trim()}
                className={cn(
                  "w-full py-4 px-4 flex items-center justify-center gap-3 font-bold uppercase tracking-[0.2em] transition-all",
                  isExecuting ? "bg-zinc-200 text-zinc-400" : "bg-zinc-900 text-white hover:bg-zinc-800 active:translate-y-0.5 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                )}
              >
                {isExecuting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                {isExecuting ? "Executing Sequence" : "Initialize Agents"}
              </button>
            </form>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </section>

          <section className="border border-[#141414] p-6 bg-white/50 backdrop-blur-sm flex-1">
            <h2 className="text-xs uppercase font-serif italic opacity-60 mb-4 flex items-center gap-2">
              <History size={14} /> Agent Registry
            </h2>
            <div className="space-y-3">
              {(Object.keys(AGENT_INFO) as Array<keyof typeof AGENT_INFO>).map((key) => {
                const info = AGENT_INFO[key];
                const isActive = logs.some(l => l.agent === key && l.status === "thinking");
                return (
                  <div key={key} className={cn(
                    "p-4 border border-[#141414] transition-all flex items-center gap-4",
                    isActive ? "bg-zinc-900 text-white" : "bg-white"
                  )}>
                    <div className={cn("w-12 h-12 flex items-center justify-center border border-[#141414]", isActive ? "bg-zinc-800" : info.bg)}>
                      <info.icon size={24} className={isActive ? "text-white" : info.color} />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-tight">{info.name}</div>
                      <div className="text-[10px] opacity-60 font-mono uppercase">{info.role}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right: Logs & Preview */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Live View */}
          <section className="border border-[#141414] bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
            <div className="p-3 border-b border-[#141414] bg-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Globe size={14} />
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Live Browser View</span>
              </div>
              {isExecuting && (
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-green-600 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  LIVE STREAMING
                </div>
              )}
            </div>
            <div className="aspect-video bg-zinc-200 relative overflow-hidden group">
              {currentScreenshot ? (
                <img 
                  src={`data:image/jpeg;base64,${currentScreenshot}`} 
                  alt="Browser View" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
                  <Globe size={48} strokeWidth={1} className="mb-2" />
                  <p className="text-[10px] font-mono uppercase">Waiting for browser initialization...</p>
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[8px] px-2 py-1 font-mono backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                60% JPEG QUALITY • PLAYWRIGHT-CORE
              </div>
            </div>
          </section>

          {/* Logs */}
          <section className="border border-[#141414] bg-zinc-900 text-zinc-300 flex-1 flex flex-col overflow-hidden shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Orchestrator Logs</span>
              </div>
              <div className="text-[10px] font-mono opacity-30">TTY: /dev/agent-v2</div>
            </div>
            
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-6 scroll-smooth"
            >
              {logs.length === 0 && !isExecuting && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20">
                  <Terminal size={64} strokeWidth={1} className="mb-4" />
                  <p className="text-lg">Awaiting Command Input...</p>
                  <p className="text-[10px] mt-2 opacity-50">The extension will relay DOM state to this backend.</p>
                </div>
              )}
              
              <AnimatePresence mode="popLayout">
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 group"
                  >
                    <span className="opacity-20 shrink-0 select-none">[{log.timestamp}]</span>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-bold rounded-sm",
                          log.agent === "BLUE" ? "bg-blue-500/20 text-blue-400" :
                          log.agent === "RED" ? "bg-red-500/20 text-red-400" :
                          "bg-zinc-500/20 text-zinc-400"
                        )}>
                          {log.agent}
                        </span>
                        <span className={cn(
                          "text-[9px] uppercase tracking-widest",
                          log.status === "thinking" ? "text-yellow-500 animate-pulse" :
                          log.status === "completed" ? "text-green-500" :
                          "text-red-500"
                        )}>
                          {log.status}
                        </span>
                      </div>
                      <div className="text-zinc-100 leading-relaxed whitespace-pre-wrap text-sm">
                        {log.message}
                      </div>
                      {log.screenshot && (
                        <div className="mt-2 border border-zinc-700 rounded overflow-hidden w-48 aspect-video bg-zinc-800">
                          <img 
                            src={`data:image/jpeg;base64,${log.screenshot}`} 
                            alt="Action Snapshot" 
                            className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => setCurrentScreenshot(log.screenshot!)}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#141414] pt-6 flex flex-col md:flex-row justify-between gap-4 text-[10px] font-mono uppercase opacity-40">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <ChevronRight size={12} /> Mistral AI Integration
          </div>
          <div className="flex items-center gap-2">
            <ChevronRight size={12} /> Playwright Automation
          </div>
          <div className="flex items-center gap-2">
            <ChevronRight size={12} /> Redis State Management
          </div>
        </div>
        <div>&copy; 2026 Blue & Red AI Agent Project</div>
      </footer>
    </div>
  );
}

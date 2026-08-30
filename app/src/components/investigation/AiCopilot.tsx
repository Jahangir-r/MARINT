import { useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useMarintStore } from "../../lib/store";
import { askCopilot, questionsFor } from "../../lib/copilot";
import type { MarintEvent, TrackPoint, Vessel } from "../../types";

interface Message {
  role: "user" | "copilot";
  text: string;
}

export default function AiCopilot({
  vessel,
  events,
  track,
  relatedVessel,
  showQuickActions = true,
  asOfTime,
}: {
  vessel: Vessel;
  events: MarintEvent[];
  track?: TrackPoint[];
  relatedVessel?: Vessel;
  showQuickActions?: boolean;
  /** Overrides "now" for relative-time phrasing — pass the current playback
   * time when embedding this in a time-scrubbable view (Operations); the
   * vessel/events/track props are expected to already be clipped to it. */
  asOfTime?: string;
}) {
  const liveNow = useMarintStore((s) => s.demoNow);
  const demoNow = asOfTime ?? liveNow;
  const correlationDecision = useMarintStore((s) => s.correlationDecisions[vessel.id]);
  const revealDetection = useMarintStore((s) => s.revealDetection);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const questions = questionsFor(vessel);
  const sarEvent = events.find((e) => e.kind === "sar_detection");
  const opticalEvent = events.find((e) => e.kind === "optical_detection");

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    const answer = askCopilot(trimmed, { vessel, events, track, relatedVessel, correlationDecision, demoNow });
    setMessages((m) => [...m, { role: "user", text: trimmed }, { role: "copilot", text: answer }]);
    setInput("");
  }

  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-wider text-ink/40 mb-2.5 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
        MARINT Co-Pilot
      </h2>
      <div className="bg-surface-1 border border-hairline rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        {messages.length === 0 ? (
          <div className="p-3.5 text-ink/45 text-[12px] leading-relaxed">
            Ask about {vessel.name} — status, evidence, risk, or what to review next.
          </div>
        ) : (
          <div className="p-3.5 space-y-3 max-h-72 overflow-y-auto text-[12px]">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={clsx(
                    "inline-block max-w-[92%] rounded-lg px-3 py-2 text-left whitespace-pre-line leading-relaxed",
                    m.role === "user" ? "bg-cyan/15 text-cyan" : "bg-surface-2 text-ink/80"
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {showQuickActions && (vessel.scenario || sarEvent || opticalEvent) && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-3">
            {vessel.scenario && (
              <Link to={`/investigation/${vessel.id}`} className="text-[10.5px] px-2 py-1 rounded-md bg-cyan/10 text-cyan hover:bg-cyan/20 transition-colors">
                Open Investigation
              </Link>
            )}
            {sarEvent && (
              <button onClick={() => revealDetection(sarEvent.id, vessel.id)} className="text-[10.5px] px-2 py-1 rounded-md bg-surface-2 text-ink/60 hover:text-cyan transition-colors">
                Show SAR
              </button>
            )}
            {opticalEvent && (
              <button onClick={() => revealDetection(opticalEvent.id, vessel.id)} className="text-[10.5px] px-2 py-1 rounded-md bg-surface-2 text-ink/60 hover:text-cyan transition-colors">
                Show Optical
              </button>
            )}
            {vessel.scenario && (
              <Link to={`/investigation/${vessel.id}/report`} className="text-[10.5px] px-2 py-1 rounded-md bg-surface-2 text-ink/60 hover:text-cyan transition-colors">
                Generate Report
              </Link>
            )}
          </div>
        )}

        <div className="p-3 border-t border-hairline space-y-2 mt-1">
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q) => (
              <button
                key={q.label}
                onClick={() => ask(q.label)}
                className="text-[10.5px] px-2 py-1 rounded-md bg-surface-2 text-ink/60 hover:text-cyan hover:bg-cyan/10 transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the co-pilot…"
              className="flex-1 bg-surface-2 border border-hairline rounded-md px-2.5 py-1.5 text-[12px] text-ink/85 placeholder:text-ink/30 outline-none focus:border-cyan/40"
            />
            <button
              type="submit"
              className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-cyan text-navy-deep hover:bg-cyan-light transition-colors shadow-sm"
            >
              Ask
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

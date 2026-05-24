import { useState, useRef } from "react";

const MODES = {
  translate: {
    label: "Translate",
    system:
      "You are an expert bilingual customer operations translator. Translate input text into clear, concise English AND Chinese. Format with clear headers. Output zero conversational filler.",
  },
  explain: {
    label: "Explain",
    system:
      "Analyze the customer request. Provide a 1-sentence analytical extraction of their primary issue, then append their precise emotional sentiment/intent within a strict bracket token. Example: [Intent: Frustrated / Actionable]",
  },
  reply: {
    label: "Reply",
    system:
      "Transform the shorthand scratchpad bullet points provided by the operations agent into a grammatically flawless, highly professional customer support message.",
  },
};

const MODEL_NAME = "qwen3:1.5b";
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

export default function CopilotOverlay({ sourceText, onClose }) {
  const [text, setText] = useState(sourceText || "");
  const [output, setOutput] = useState("");
  const [activeMode, setActiveMode] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const process = async (mode) => {
    if (isProcessing) {
      abortRef.current?.abort();
      setIsProcessing(false);
      return;
    }

    setOutput("");
    setError("");
    setActiveMode(mode);
    setIsProcessing(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL_NAME,
          prompt: text,
          system: MODES[mode].system,
          stream: true,
          options: {
            num_predict: 200,
            temperature: 0.3,
            num_ctx: 2048,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Ollama returned ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              setOutput((prev) => prev + json.response);
            } catch {}
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Connection failed. Is Ollama running?");
      }
    } finally {
      setIsProcessing(false);
      abortRef.current = null;
    }
  };

  const commit = async () => {
    if (!output) return;
    try {
      await invoke("inject_processed_text", { text: output });
      onClose();
    } catch (err) {
      setError("Failed to copy to clipboard.");
    }
  };

  return (
    <div className="overlay">
      {/* Header */}
      <div className="header">
        <span className="header-title">ZenLink // Copilot</span>
        <div className="header-meta">
          {isProcessing && <span className="pulse-dot" />}
          <span className="model-badge">qwen3:1.5b</span>
        </div>
      </div>

      {/* Input */}
      <textarea
        className="input-area"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="No text captured — paste or type here..."
        rows={3}
      />

      {/* Mode Buttons */}
      <div className="mode-row">
        {Object.entries(MODES).map(([key, { label }]) => (
          <button
            key={key}
            className={`mode-btn ${activeMode === key ? "active" : ""}`}
            onClick={() => process(key)}
          >
            {isProcessing && activeMode === key ? "Stop" : label}
          </button>
        ))}
      </div>

      {/* Output */}
      <div className="output-area" onClick={commit}>
        {isProcessing && !output && <div className="loading-orb" />}
        {error ? (
          <span className="error-text">{error}</span>
        ) : (
          <span className="output-text">
            {output || (
              <span className="placeholder">
                Select a mode above to process...
              </span>
            )}
          </span>
        )}
      </div>

      <style>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: #0A0A0C;
          color: #F4F4F6;
          display: flex;
          flex-direction: column;
          padding: 12px;
          gap: 10px;
          font-family: system-ui, -apple-system, sans-serif;
          user-select: none;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #8E8E93;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 8px;
        }
        .header-title { font-weight: 600; }
        .header-meta { display: flex; align-items: center; gap: 8px; }
        .pulse-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #4D96FF;
          animation: ping 1s ease-in-out infinite;
        }
        @keyframes ping {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .model-badge { color: #4D96FF; }
        .input-area {
          background: #121215;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 10px;
          color: #F4F4F6;
          font-size: 13px;
          resize: none;
          line-height: 1.5;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-area:focus { border-color: rgba(255,255,255,0.2); }
        .input-area::placeholder { color: #8E8E93; }
        .mode-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        .mode-btn {
          padding: 7px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: 1px solid transparent;
          background: rgba(255,255,255,0.04);
          color: #8E8E93;
          transition: all 0.15s;
        }
        .mode-btn:hover { color: #F4F4F6; background: rgba(255,255,255,0.08); }
        .mode-btn.active {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          color: #F4F4F6;
        }
        .output-area {
          flex: 1;
          background: #121215;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 12px;
          overflow-y: auto;
          font-size: 13px;
          line-height: 1.6;
          cursor: pointer;
          transition: border-color 0.2s;
          position: relative;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .output-area:hover { border-color: rgba(255,255,255,0.2); }
        .placeholder { color: #8E8E93; font-style: italic; }
        .error-text { color: #ff6b6b; }
        .loading-orb {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4D96FF, #a855f7);
          opacity: 0.4;
          animation: ping 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
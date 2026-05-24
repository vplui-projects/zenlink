import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import CopilotOverlay from "./components/CopilotOverlay.jsx";

export default function App() {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [sourceText, setSourceText] = useState("");

  // Load initial clipboard content when overlay opens
  useEffect(() => {
    if (overlayVisible) {
      invoke("get_focused_text")
        .then((text) => {
          if (text && text.trim()) setSourceText(text);
        })
        .catch(() => setSourceText(""));
    } else {
      setSourceText("");
    }
  }, [overlayVisible]);

  return (
    <div className="app-root">
      {overlayVisible ? (
        <CopilotOverlay
          sourceText={sourceText}
          onClose={() => setOverlayVisible(false)}
        />
      ) : (
        <div className="idle-state" data-tauri-drag-region>
          <span>ZenLink ready — Alt+Q to activate</span>
        </div>
      )}

      <style>{`
        .app-root {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .idle-state {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(18, 18, 21, 0.85);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 12px;
          color: #8E8E93;
          backdrop-filter: blur(12px);
          pointer-events: auto;
        }
        .idle-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4D96FF, #a855f7);
          animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
        }
        @keyframes ping {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}

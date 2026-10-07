import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import LoadingState from "./LoadingState.jsx";

const quickPrompts = [
  "Give me a 60-second answer.",
  "Make this answer more senior-level.",
  "Give me a STAR-style answer.",
  "Ask me a follow-up question.",
  "What should I avoid saying?",
];

function InterviewCoach({
  history,
  loading,
  error,
  onSend,
  onClear,
  prefill,
  onPrefillConsumed,
}) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (prefill) {
      setMessage(prefill);
      onPrefillConsumed();
    }
  }, [prefill, onPrefillConsumed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  async function submit(event) {
    event?.preventDefault();
    const clean = message.trim();

    if (!clean || loading) return;

    setMessage("");
    await onSend(clean);
  }

  return (
    <section className="coach-panel" id="interview-coach">
      <div className="coach-header">
        <div>
          <span className="coach-kicker">INTERVIEW COACH</span>
          <h3>Ask anything about your interview</h3>
          <p>
            Get general technical and interview coaching with guidance grounded
            in this job posting when discussing the role.
          </p>
        </div>

        {history.length > 0 && (
          <button
            className="secondary-button compact-button"
            onClick={onClear}
            disabled={loading}
          >
            Clear chat
          </button>
        )}
      </div>

      <div className="coach-quick-prompts">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setMessage(prompt)}
            disabled={loading}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="coach-messages" aria-live="polite">
        {history.length === 0 ? (
          <div className="coach-empty">
            <strong>Your interview coach is ready.</strong>
            <span>
              Ask for a sample answer, a shorter version, a mock follow-up, or
              feedback on your own answer.
            </span>
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className={`chat-message ${item.role === "user" ? "user" : "assistant"}`}
            >
              <div className="chat-role">
                {item.role === "user" ? "You" : "Interview Coach"}
              </div>
              <div className="chat-bubble">
                {item.role === "assistant" ? (
                  <ReactMarkdown>{item.content}</ReactMarkdown>
                ) : (
                  item.content
                )}
              </div>
            </div>
          ))
        )}

        {loading && <LoadingState text="Interview Coach is thinking..." />}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      <form className="coach-composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="coach-message">
          Ask the Interview Coach
        </label>
        <textarea
          id="coach-message"
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask a custom question, paste your answer for review, or request a follow-up..."
          disabled={loading}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />

        <div className="composer-footer">
          <span>Enter to send · Shift + Enter for new line</span>
          <button
            className="primary-button"
            type="submit"
            disabled={loading || !message.trim()}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default InterviewCoach;

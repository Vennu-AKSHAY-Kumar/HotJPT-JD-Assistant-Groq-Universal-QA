import { useState } from "react";
import ReactMarkdown from "react-markdown";
import LoadingState from "./LoadingState.jsx";
import EvidenceCard from "./EvidenceCard.jsx";

const suggestedQuestions = [
  "What is the role name?",
  "What technologies are required?",
  "How many years of experience are required?",
  "What location or work arrangement is listed?",
];

function QASection({ history, loading, error, onAsk }) {
  const [question, setQuestion] = useState("");
  const [validationError, setValidationError] = useState("");

  async function submitQuestion(event) {
    event?.preventDefault();
    const cleanQuestion = question.trim();

    if (!cleanQuestion) {
      setValidationError("Please enter a question.");
      return;
    }

    setValidationError("");
    await onAsk(cleanQuestion);
    setQuestion("");
  }

  return (
    <div className="tool-panel">
      <div className="tool-heading">
        <span className="step-label">02</span>
        <h3>Ask about this Job Description</h3>
        <p>
          Answers are grounded only in the job posting and include supporting evidence.
        </p>
      </div>

      <div className="suggestions" aria-label="Suggested questions">
        {suggestedQuestions.map((item) => (
          <button
            key={item}
            onClick={() => {
              setQuestion(item);
              setValidationError("");
            }}
            disabled={loading}
          >
            {item}
          </button>
        ))}
      </div>

      <form className="question-form" onSubmit={submitQuestion}>
        <label htmlFor="question">Ask about this Job Description</label>
        <div className="question-row">
          <input
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. What is the role name?"
            disabled={loading}
          />
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Thinking..." : "Ask"}
          </button>
        </div>
      </form>

      {validationError && <div className="alert error" role="alert">{validationError}</div>}
      {error && <div className="alert error" role="alert">{error}</div>}
      {loading && <LoadingState text="Thinking about your question..." />}

      <div className="qa-history">
        {history.length === 0 && !loading ? (
          <div className="empty-state">
            <strong>No questions yet.</strong>
            <span>Ask about a role requirement, responsibility, or other fact in the posting.</span>
          </div>
        ) : (
          [...history].reverse().map((item) => (
            <article className="answer-card" key={item.id}>
              <div className="question-label">Question</div>
              <h4>{item.question}</h4>
              <div className="answer-label">Answer</div>
              <div className="answer-text markdown-answer">
                <ReactMarkdown>{item.answer}</ReactMarkdown>
              </div>
              {item.grounded && item.evidence?.map((evidence, index) => (
                <EvidenceCard key={`${item.id}-evidence-${index}`} evidence={evidence} />
              ))}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default QASection;

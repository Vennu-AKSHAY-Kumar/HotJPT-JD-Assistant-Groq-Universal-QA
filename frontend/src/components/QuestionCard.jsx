import { useState } from "react";

function QuestionCard({ item, index, onAskCoach }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="interview-question">
      <div className="question-number">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="question-content">
        <h4>{item.question}</h4>
        <p className="question-reason">
          <strong>Why this question:</strong> {item.reason}
        </p>

        <div className="question-actions">
          <button
            type="button"
            className="text-button"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Hide Suggested Answer" : "Show Suggested Answer"}
          </button>

          <button
            type="button"
            className="coach-button"
            onClick={() => onAskCoach(item)}
          >
            Ask Coach
          </button>
        </div>

        {expanded && (
          <div className="suggested-answer-panel">
            <div className="answer-section-label">Suggested answer</div>
            <p>{item.suggestedAnswer}</p>

            <div className="answer-section-label">Key points to mention</div>
            <ul>
              {item.keyPoints.map((point, pointIndex) => (
                <li key={`${point}-${pointIndex}`}>{point}</li>
              ))}
            </ul>

            <p className="personalize-note">
              Customize the example with your actual experience before using it
              in an interview.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

export default QuestionCard;

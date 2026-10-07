import { useCallback, useState } from "react";
import LoadingState from "./LoadingState.jsx";
import QuestionCard from "./QuestionCard.jsx";
import InterviewCoach from "./InterviewCoach.jsx";

function InterviewGroup({ title, subtitle, items, onAskCoach }) {
  return (
    <section className="interview-group">
      <div className="group-heading">
        <h4>{title}</h4>
        <span>{subtitle}</span>
      </div>

      {items.length ? (
        <div className="question-list">
          {items.map((item, index) => (
            <QuestionCard
              key={`${title}-${index}-${item.question}`}
              item={item}
              index={index}
              onAskCoach={onAskCoach}
            />
          ))}
        </div>
      ) : (
        <p className="muted">
          The JD did not provide enough grounded material for this category.
        </p>
      )}
    </section>
  );
}

function InterviewPrep({
  data,
  loading,
  error,
  onGenerate,
  coachHistory,
  coachLoading,
  coachError,
  onCoachMessage,
  onClearCoach,
}) {
  const [coachPrefill, setCoachPrefill] = useState("");

  function handleAskCoach(item) {
    setCoachPrefill(
      `Help me prepare for this interview question:\n\n"${item.question}"\n\nGive me a strong answer structure tailored to this role without inventing my personal experience.`
    );

    setTimeout(() => {
      document
        .getElementById("interview-coach")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  const consumePrefill = useCallback(() => {
    setCoachPrefill("");
  }, []);

  return (
    <div className="tool-panel">
      <div className="interview-topline">
        <div className="tool-heading">
          <span className="step-label">03</span>
          <h3>Interview preparation</h3>
          <p>
            JD-specific questions, suggested answer structures, key points, and
            interactive coaching.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading
            ? "Preparing..."
            : data
              ? "Regenerate"
              : "Generate Interview Prep"}
        </button>
      </div>

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      {loading && <LoadingState text="Preparing interview questions and answers..." />}

      {!data && !loading && (
        <div className="empty-state interview-empty">
          <strong>Ready when you are.</strong>
          <span>
            Generate JD-specific questions, answer guidance, and key points.
          </span>
        </div>
      )}

      {data && (
        <div className="interview-grid">
          <InterviewGroup
            title="Technical"
            subtitle="Skills, technologies, and technical responsibilities"
            items={data.technical || []}
            onAskCoach={handleAskCoach}
          />
          <InterviewGroup
            title="Behavioral"
            subtitle="Collaboration, ownership, communication, and working style"
            items={data.behavioral || []}
            onAskCoach={handleAskCoach}
          />
          <InterviewGroup
            title="Role-Specific"
            subtitle="How you would perform the actual work described"
            items={data.roleSpecific || []}
            onAskCoach={handleAskCoach}
          />
        </div>
      )}

      <InterviewCoach
        history={coachHistory}
        loading={coachLoading}
        error={coachError}
        onSend={onCoachMessage}
        onClear={onClearCoach}
        prefill={coachPrefill}
        onPrefillConsumed={consumePrefill}
      />
    </div>
  );
}

export default InterviewPrep;

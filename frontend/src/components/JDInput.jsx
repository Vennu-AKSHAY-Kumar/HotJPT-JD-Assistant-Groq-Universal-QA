import LoadingState from "./LoadingState.jsx";

function JDInput({
  value,
  onChange,
  onAnalyze,
  loading,
  error,
  analyzed,
  onReset,
}) {
  return (
    <section className="card jd-card">
      <div className="section-heading">
        <div>
          <span className="step-label">01</span>
          <h2>Paste your job description</h2>
          <p>
            The JD becomes the source of truth for job-specific facts and
            interview focus.
          </p>
        </div>

        <span className="character-count">
          {value.length.toLocaleString()} chars
        </span>
      </div>

      <label className="sr-only" htmlFor="job-description">
        Job description
      </label>

      <textarea
        id="job-description"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste the full job description here..."
        rows={13}
        disabled={loading}
      />

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      {loading && <LoadingState text="Analyzing job description..." />}

      <div className="button-row">
        <button
          className="primary-button"
          onClick={onAnalyze}
          disabled={loading}
        >
          {loading
            ? "Analyzing..."
            : analyzed
              ? "Analyze Again"
              : "Analyze Job Description"}
        </button>

        {analyzed && (
          <button
            className="secondary-button"
            onClick={onReset}
            disabled={loading}
          >
            Reset analysis
          </button>
        )}
      </div>
    </section>
  );
}

export default JDInput;

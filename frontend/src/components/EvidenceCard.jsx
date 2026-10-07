function EvidenceCard({ evidence }) {
  return (
    <div className="evidence-card">
      <div className="evidence-label">Evidence from the job description</div>
      <blockquote>“{evidence.text}”</blockquote>
      {evidence.reason && <p>{evidence.reason}</p>}
    </div>
  );
}

export default EvidenceCard;

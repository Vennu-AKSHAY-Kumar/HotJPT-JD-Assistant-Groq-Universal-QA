import { useState } from "react";
import Header from "./components/Header.jsx";
import JDInput from "./components/JDInput.jsx";
import QASection from "./components/QASection.jsx";
import InterviewPrep from "./components/InterviewPrep.jsx";
import {
  analyzeJobDescription,
  askQuestion,
  getInterviewPrep,
  sendInterviewCoachMessage,
} from "./api.js";

function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [context, setContext] = useState(null);
  const [activeTab, setActiveTab] = useState("qa");

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState("");
  const [qaHistory, setQaHistory] = useState([]);

  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewError, setInterviewError] = useState("");
  const [interviewData, setInterviewData] = useState(null);

  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState("");
  const [coachHistory, setCoachHistory] = useState([]);

  async function handleAnalyze() {
    const cleanJD = jobDescription.trim();

    if (!cleanJD) {
      setAnalysisError("Please paste a job description before continuing.");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError("");

    try {
      const data = await analyzeJobDescription(cleanJD);
      setContext(data.context);
      setQaHistory([]);
      setInterviewData(null);
      setCoachHistory([]);
      setActiveTab("qa");
    } catch (error) {
      setAnalysisError(error.message);
      setContext(null);
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function handleAsk(question) {
    setQaLoading(true);
    setQaError("");

    try {
      const recentHistory = qaHistory.flatMap((item) => [
        { role: "user", content: item.question },
        { role: "assistant", content: item.answer },
      ]).slice(-8);

      const data = await askQuestion(question, context, recentHistory);
      setQaHistory((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          question,
          answer: data.answer,
          grounded: data.grounded,
          evidence: data.evidence || [],
        },
      ]);
    } catch (error) {
      setQaError(error.message);
    } finally {
      setQaLoading(false);
    }
  }

  async function handleInterviewPrep() {
    setInterviewLoading(true);
    setInterviewError("");

    try {
      const data = await getInterviewPrep(context);
      setInterviewData(data);
    } catch (error) {
      setInterviewError(error.message);
    } finally {
      setInterviewLoading(false);
    }
  }

  async function handleCoachMessage(message) {
    const cleanMessage = message.trim();
    if (!cleanMessage || coachLoading) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: cleanMessage,
    };

    const historyForApi = [...coachHistory, userMessage].map(
      ({ role, content }) => ({ role, content })
    );

    setCoachHistory((current) => [...current, userMessage]);
    setCoachLoading(true);
    setCoachError("");

    try {
      const data = await sendInterviewCoachMessage(
        cleanMessage,
        context,
        historyForApi.slice(0, -1)
      );

      setCoachHistory((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error) {
      setCoachError(error.message);
    } finally {
      setCoachLoading(false);
    }
  }

  function handleClearCoach() {
    setCoachHistory([]);
    setCoachError("");
  }

  function handleReset() {
    setContext(null);
    setQaHistory([]);
    setInterviewData(null);
    setCoachHistory([]);
    setQaError("");
    setInterviewError("");
    setCoachError("");
    setAnalysisError("");
  }

  return (
    <div className="app-shell">
      <Header />

      <main className="main-content">
        <section className="intro">
          <span className="eyebrow">GROUND YOUR PREP IN THE ACTUAL POSTING</span>
          <h1>Understand the job. Prepare smarter.</h1>
          <p>
            Paste a job description once. Ask precise questions, generate
            interview answers, and continue with an AI Interview Coach.
          </p>
        </section>

        <JDInput
          value={jobDescription}
          onChange={setJobDescription}
          onAnalyze={handleAnalyze}
          loading={analysisLoading}
          error={analysisError}
          analyzed={Boolean(context)}
          onReset={handleReset}
        />

        {context && (
          <section className="workspace">
            <div className="workspace-header">
              <div>
                <span className="status-pill">✓ JD analyzed</span>
                <h2>Your grounded workspace</h2>
                <p>
                  JD Q&A and Interview Prep use the same validated posting facts.
                  Use Interview Coach for broader preparation guidance.
                </p>
              </div>

              <div className="tab-switcher" role="tablist" aria-label="JD tools">
                <button
                  className={activeTab === "qa" ? "tab active" : "tab"}
                  onClick={() => setActiveTab("qa")}
                  role="tab"
                  aria-selected={activeTab === "qa"}
                >
                  Ask about this Job Description
                </button>
                <button
                  className={activeTab === "interview" ? "tab active" : "tab"}
                  onClick={() => setActiveTab("interview")}
                  role="tab"
                  aria-selected={activeTab === "interview"}
                >
                  Interview Prep
                </button>
              </div>
            </div>

            {activeTab === "qa" ? (
              <QASection
                history={qaHistory}
                loading={qaLoading}
                error={qaError}
                onAsk={handleAsk}
              />
            ) : (
              <InterviewPrep
                data={interviewData}
                loading={interviewLoading}
                error={interviewError}
                onGenerate={handleInterviewPrep}
                coachHistory={coachHistory}
                coachLoading={coachLoading}
                coachError={coachError}
                onCoachMessage={handleCoachMessage}
                onClearCoach={handleClearCoach}
              />
            )}
          </section>
        )}
      </main>

      <footer>
        <span>JD Assistant</span>
        <span>JD-aware AI Q&A + Interview Prep + Groq Interview Coach</span>
      </footer>
    </div>
  );
}

export default App;

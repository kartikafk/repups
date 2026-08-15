import { useEffect, useState } from "react";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function QnAPage() {
  const [questions, setQuestions] = useState(null);

  useEffect(() => {
    fetch(apiUrl("questions"), { headers: authHeaders() })
      .then((response) => response.json())
      .then((data) => setQuestions(data.questions || []))
      .catch(() => setQuestions([]));
  }, []);

  const newCount = questions?.filter((q) => !q.answer && (q.replies || 0) === 0).length ?? 0;

  if (!questions) {
    return <main className="qna-page state-center state-loading">Loading…</main>;
  }

  return (
    <main className="qna-page">
      <div className="qna-inner">
        <div className="qna-header">
          <div>
            <h2 className="qna-title">RepUps Q&amp;A</h2>
            <p className="qna-subtitle">Questions matched to your specializations</p>
          </div>
          {newCount > 0 && (
            <span className="qna-new-badge">{newCount} new question{newCount === 1 ? "" : "s"}</span>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="qna-empty">No questions yet.</div>
        ) : (
          <div className="qna-list">
            {questions.map((question) => {
              const replies = question.replies ?? 0;
              const tags = question.tags || [];
              return (
                <section key={question._id} className="qna-card">
                  <div className="qna-card-top">
                    <div className="qna-author-row">
                      <div className="qna-avatar">{initials(question.authorName)}</div>
                      <div className="qna-author-meta">
                        <span className="qna-author-name">
                          {question.authorName || "Anonymous"}
                          <span className="qna-time">{timeAgo(question.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                    <span className={`qna-replies-badge${replies > 0 ? " has-replies" : ""}`}>
                      {replies} {replies === 1 ? "reply" : "replies"}
                    </span>
                  </div>

                  <p className="qna-question-text">{question.question}</p>

                  <div className="qna-tags">
                    {tags.map((tag) => (
                      <span key={tag} className="qna-tag">
                        {tag}
                      </span>
                    ))}
                    {question.answer && <span className="qna-tag qna-tag-ai">🤖 AI answered</span>}
                  </div>

                  {question.answer && (
                    <div className="qna-ai-response">
                      <div className="qna-ai-response-label">🤖 AI Response (client can see)</div>
                      <div className="qna-ai-response-text">{question.answer}</div>
                    </div>
                  )}

                  <div className="qna-card-actions">
                    <button className="qna-answer-btn">Answer Question</button>
                    <button className="qna-save-btn">Save for Later</button>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
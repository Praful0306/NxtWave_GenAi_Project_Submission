import React from 'react';
import AudioPlayer from '../AudioPlayer/AudioPlayer';
import './AssessmentCard.css';

const TYPE_CONFIG = {
  grammar: { label: 'Grammar', badgeClass: 'badge-grammar', icon: '📝' },
  vocabulary: { label: 'Vocabulary', badgeClass: 'badge-vocab', icon: '📖' },
  word_order: { label: 'Word Order', badgeClass: 'badge-wordorder', icon: '🔄' },
  register: { label: 'Formality / Register', badgeClass: 'badge-register', icon: '🎩' },
  pronunciation_note: { label: 'Pronunciation', badgeClass: 'badge-pronounce', icon: '🗣️' },
  other: { label: 'Suggestion', badgeClass: 'badge-other', icon: '💡' },
};

export default function AssessmentCard({
  assessment,
  targetSentence,
  userTranscript,
  onRetry,
  onNext,
  isLoading = false,
}) {
  if (!assessment) return null;

  const {
    correctedText,
    errors = [],
    fluencyScore = 0,
    encouragement = '',
    aiReply = '',
    providerUsed = '',
  } = assessment;

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-needs-work';
  };

  return (
    <div className="assessment-card-container">
      {/* Header with Score Meter & Provider */}
      <div className="assessment-header">
        <div className={`score-ring-wrapper ${getScoreColor(fluencyScore)}`}>
          <div className="score-ring-inner">
            <span className="score-number">{fluencyScore}</span>
            <span className="score-label">Fluency</span>
          </div>
        </div>

        <div className="assessment-title-area">
          <h3 className="assessment-heading">Utterance Assessment</h3>
          <p className="assessment-encouragement">"{encouragement}"</p>
          <div className="provider-tag">
            <span className="provider-dot"></span> Evaluated via <span className="provider-name">{providerUsed}</span>
          </div>
        </div>
      </div>

      {/* Target vs Spoken Comparison */}
      <div className="comparison-box">
        {targetSentence && (
          <div className="comparison-item">
            <span className="comp-label">Target Sentence:</span>
            <p className="comp-text target-text">{targetSentence}</p>
          </div>
        )}
        <div className="comparison-item">
          <span className="comp-label">You Said:</span>
          <p className="comp-text spoken-text">{userTranscript || '—'}</p>
        </div>
        {correctedText && (
          <div className="comparison-item">
            <div className="comp-header-row">
              <span className="comp-label">Corrected Native Text:</span>
              <AudioPlayer
                text={correctedText}
                languageCode={assessment.languageCode || 'hi-IN'}
                label="Listen Correction"
              />
            </div>
            <p className="comp-text corrected-text">{correctedText}</p>
          </div>
        )}
      </div>

      {/* Error Breakdown (6-Type Taxonomy) */}
      <div className="errors-section">
        <h4 className="section-subtitle">
          Detailed Feedback {errors.length > 0 ? `(${errors.length} item${errors.length > 1 ? 's' : ''})` : '• Perfect Delivery!'}
        </h4>

        {errors.length === 0 ? (
          <div className="perfect-message">
            <span className="perfect-icon">🌟</span>
            <p>Spot on! Your vocabulary, grammar, and register aligned accurately with the target.</p>
          </div>
        ) : (
          <div className="error-cards-list">
            {errors.map((err, idx) => {
              const config = TYPE_CONFIG[err.type] || TYPE_CONFIG.other;
              return (
                <div key={idx} className="error-item-card">
                  <div className="error-card-header">
                    <span className={`error-type-badge ${config.badgeClass}`}>
                      {config.icon} {config.label}
                    </span>
                  </div>
                  <div className="error-diff-row">
                    <span className="err-original-tag">
                      <span className="diff-label">Original:</span> {err.original}
                    </span>
                    <span className="arrow-sep">➔</span>
                    <span className="err-corrected-tag">
                      <span className="diff-label">Corrected:</span> {err.corrected}
                    </span>
                  </div>
                  {err.explanation && (
                    <p className="error-explanation">{err.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive AI Tutor Reply (Spec Section 6.9b) */}
      {aiReply && (
        <div className="ai-reply-card">
          <div className="ai-reply-header">
            <div className="tutor-info">
              <span className="tutor-avatar">🤖</span>
              <span className="tutor-label">Vaani Tutor Dialogue Continuation</span>
            </div>
            <AudioPlayer
              text={aiReply}
              languageCode={assessment.languageCode || 'hi-IN'}
              label="Listen Reply"
            />
          </div>
          <p className="ai-reply-text">"{aiReply}"</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="assessment-actions">
        {onRetry && (
          <button
            type="button"
            className="btn btn-secondary retry-btn"
            onClick={onRetry}
            disabled={isLoading}
          >
            🔄 Practice Again
          </button>
        )}
        {onNext && (
          <button
            type="button"
            className="btn btn-primary next-btn"
            onClick={onNext}
            disabled={isLoading}
          >
            Continue to Next Step ➔
          </button>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import './GameActivity.css';

export default function GameActivity({
  targetSentence,
  onComplete,
  languageCode,
  isSubmitting = false,
}) {
  // Split sentence into words and create initial scrambled tokens
  const cleanTokens = targetSentence
    .replace(/[।.,?!]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const [availableWords, setAvailableWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);
  const [attempts, setAttempts] = useState(0);

  // Scramble tokens on mount / targetSentence change
  useEffect(() => {
    const indexed = cleanTokens.map((w, idx) => ({ id: `${w}-${idx}`, word: w }));
    // Shuffle deterministic or pseudo-random
    const shuffled = [...indexed].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setSelectedWords([]);
    setIsCorrect(null);
    setAttempts(0);
  }, [targetSentence]);

  // Handle clicking an available word chip
  const handleSelectWord = (item) => {
    setAvailableWords((prev) => prev.filter((w) => w.id !== item.id));
    setSelectedWords((prev) => [...prev, item]);
    setIsCorrect(null);
  };

  // Handle unselecting a word from assembled area
  const handleDeselectWord = (item) => {
    setSelectedWords((prev) => prev.filter((w) => w.id !== item.id));
    setAvailableWords((prev) => [...prev, item]);
    setIsCorrect(null);
  };

  // Reset words
  const handleReset = () => {
    const indexed = cleanTokens.map((w, idx) => ({ id: `${w}-${idx}`, word: w }));
    const shuffled = [...indexed].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setSelectedWords([]);
    setIsCorrect(null);
  };

  // Validate assembled sentence
  const handleCheckAnswer = () => {
    const assembled = selectedWords.map((w) => w.word).join(' ');
    const expected = cleanTokens.join(' ');
    setAttempts((prev) => prev + 1);

    if (assembled === expected) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
  };

  const handleProceed = () => {
    if (onComplete) {
      onComplete({
        completed: true,
        correct: true,
        attempts: attempts || 1,
      });
    }
  };

  return (
    <div className="game-activity-card">
      <div className="game-header">
        <div className="game-badge">
          <Sparkles size={16} />
          <span>Activity 2: Word-Order Scramble</span>
        </div>
        <p className="game-instruction">
          Arrange the words in the correct order to form the target sentence:
        </p>
      </div>

      {/* Assembly Area */}
      <div className={`assembled-area ${isCorrect === true ? 'correct' : isCorrect === false ? 'incorrect' : ''}`}>
        {selectedWords.length === 0 ? (
          <span className="placeholder-text">Tap the word chips below to build your sentence...</span>
        ) : (
          <div className="chips-container">
            {selectedWords.map((item) => (
              <button
                key={item.id}
                type="button"
                className="word-chip assembled"
                onClick={() => handleDeselectWord(item)}
              >
                {item.word}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Available Chips Area */}
      <div className="available-chips-area">
        {availableWords.map((item) => (
          <button
            key={item.id}
            type="button"
            className="word-chip available"
            onClick={() => handleSelectWord(item)}
          >
            {item.word}
          </button>
        ))}
      </div>

      {/* Feedback banner */}
      {isCorrect === true && (
        <div className="feedback-banner success">
          <CheckCircle2 size={20} className="banner-icon" />
          <div className="banner-text">
            <strong>Excellent! Correct word order!</strong>
            <p>You reconstructed the phrase perfectly.</p>
          </div>
        </div>
      )}

      {isCorrect === false && (
        <div className="feedback-banner error">
          <AlertCircle size={20} className="banner-icon" />
          <div className="banner-text">
            <strong>Not quite right yet.</strong>
            <p>Try rearranging the order or tap Reset to start over.</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="game-actions">
        <button
          type="button"
          className="btn-reset"
          onClick={handleReset}
          disabled={selectedWords.length === 0 || isSubmitting}
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>

        {isCorrect !== true ? (
          <button
            type="button"
            className="btn-check"
            onClick={handleCheckAnswer}
            disabled={selectedWords.length === 0 || isSubmitting}
          >
            <span>Check Order</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-proceed"
            onClick={handleProceed}
            disabled={isSubmitting}
          >
            <span>Continue to Quiz</span>
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

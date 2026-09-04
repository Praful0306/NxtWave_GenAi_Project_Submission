import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Award, ArrowRight, Flame } from 'lucide-react';
import './QuizActivity.css';

export default function QuizActivity({
  quiz = [],
  dayNumber,
  targetSentence,
  onComplete,
  isSubmitting = false,
}) {
  // Fallback default quiz if roadmap day quiz array is empty
  const questions =
    quiz && quiz.length > 0
      ? quiz
      : [
          {
            question: `What is the key phrase practiced in Day ${dayNumber}?`,
            options: [
              targetSentence,
              'A different greeting',
              'An unrelated sentence',
              'None of the above',
            ],
            correctAnswerIndex: 0,
          },
          {
            question: 'How would you use this phrase in a daily conversation?',
            options: [
              'When formally introducing yourself or greeting someone',
              'Only when leaving a room',
              'Never in polite conversation',
              'Only in written letters',
            ],
            correctAnswerIndex: 0,
          },
        ];

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [resultData, setResultData] = useState(null);

  const currentQ = questions[currentQIndex];
  const userChoice = selectedAnswers[currentQIndex];

  const handleSelectOption = (idx) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQIndex]: idx }));
  };

  const handleCheckAnswer = () => {
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setIsAnswerSubmitted(false);
    } else {
      // Calculate final score
      let correctCount = 0;
      const answersArray = questions.map((q, idx) => {
        const isRight = selectedAnswers[idx] === q.correctAnswerIndex;
        if (isRight) correctCount++;
        return {
          questionIndex: idx,
          selected: selectedAnswers[idx],
          correct: q.correctAnswerIndex,
          isRight,
        };
      });

      const scorePercent = Math.round((correctCount / questions.length) * 100);
      setQuizFinished(true);
      setResultData({
        answers: answersArray,
        score: scorePercent,
        totalQuestions: questions.length,
      });

      if (onComplete) {
        onComplete({
          answers: answersArray,
          score: scorePercent,
          totalQuestions: questions.length,
        });
      }
    }
  };

  return (
    <div className="quiz-activity-card">
      <div className="quiz-header">
        <div className="quiz-badge">
          <HelpCircle size={16} />
          <span>Activity 3: Recall Quiz</span>
        </div>
        <span className="quiz-progress-indicator">
          Question {currentQIndex + 1} of {questions.length}
        </span>
      </div>

      {!quizFinished ? (
        <div className="quiz-body">
          <h3 className="quiz-question-text">{currentQ.question}</h3>

          <div className="options-list">
            {currentQ.options.map((opt, idx) => {
              const isSelected = userChoice === idx;
              const isCorrectOption = idx === currentQ.correctAnswerIndex;
              let optionClass = 'option-item';

              if (isSelected) optionClass += ' selected';
              if (isAnswerSubmitted) {
                if (isCorrectOption) optionClass += ' correct';
                else if (isSelected && !isCorrectOption) optionClass += ' incorrect';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  className={optionClass}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerSubmitted}
                >
                  <span className="option-marker">{String.fromCharCode(65 + idx)}</span>
                  <span className="option-text">{opt}</span>
                  {isAnswerSubmitted && isCorrectOption && (
                    <CheckCircle2 size={18} className="status-icon success" />
                  )}
                  {isAnswerSubmitted && isSelected && !isCorrectOption && (
                    <XCircle size={18} className="status-icon error" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="quiz-actions">
            {!isAnswerSubmitted ? (
              <button
                type="button"
                className="btn-quiz-check"
                onClick={handleCheckAnswer}
                disabled={userChoice === undefined}
              >
                <span>Submit Answer</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-quiz-next"
                onClick={handleNextQuestion}
                disabled={isSubmitting}
              >
                <span>
                  {currentQIndex < questions.length - 1 ? 'Next Question' : 'Complete Session'}
                </span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="quiz-completion-view">
          <div className="celebration-icon-wrapper">
            <Award size={48} className="celebration-icon" />
          </div>
          <h2>Session Completed!</h2>
          <p className="congrats-text">
            You scored <strong>{resultData?.score}%</strong> on the recall quiz and unlocked the next day!
          </p>

          <div className="streak-callout">
            <Flame size={24} className="flame-icon animate-pulse" />
            <div className="streak-info">
              <span className="streak-title">Daily Streak Active</span>
              <span className="streak-sub">Keep practicing daily to grow your streak!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

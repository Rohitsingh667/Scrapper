import React, { useEffect, useState } from 'react';
import Timer from './Timer';
import Question from './Question';

const Exam = ({ questions, onTerminate, onEnd }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    enterFullScreen();
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  const enterFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    }
  };

  const handleFullScreenChange = () => {
    if (!document.fullscreenElement) {
      handleViolation();
    }
  };

  const handleViolation = () => {
    if (violations === 0) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      setViolations(1);
      enterFullScreen();
    } else {
      onTerminate();
    }
  };

  const handleExitFullScreen = () => {
    handleViolation();
  };

  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
        onEnd(score + (isCorrect ? 1 : 0));
    }
  };

  return (
    <div>
      {showWarning && (
        <div className="warning" style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          justifyContent:'center',
          backgroundColor: 'yellow',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          Violation Warning! Please stay in full-screen mode.
        </div>
      )}
      <Timer duration={30} onTimeUp={() => onEnd(score)} />
      <Question
        question={questions[currentQuestion]}
        onAnswer={handleAnswer}
      />
      <button onClick={() => onEnd(score)}>Submit Exam</button>
      <button onClick={handleExitFullScreen}>
        <span role="img" aria-label="exit-fullscreen">
          🔲
        </span>
        Exit Fullscreen
      </button>
    </div>
  );
};

export default Exam;
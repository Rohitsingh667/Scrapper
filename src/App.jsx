import React, { useState } from 'react';
import Exam from './components/Exam';
import Result from './components/Result';
import questionsData from './data/questions';
import shuffle from './components/shuffle';

const App = () => {
  const [examStarted, setExamStarted] = useState(false);
  const [examTerminated, setExamTerminated] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(0);

  const startExam = () => {
    setQuestions(shuffle(questionsData).slice(0, 5)); // Randomize and select questions
    setExamStarted(true);
    setExamTerminated(false);
  };

  const terminateExam = () => {
    setExamTerminated(true);
    setExamStarted(false);
  };

  const endExam = (finalScore) => {
    setScore(finalScore);
    setExamStarted(false);
  };

  return (
    <div>
      {!examStarted && !examTerminated && (
        <button onClick={startExam}>Start Exam</button>
      )}
      {examStarted && (
        <Exam
          questions={questions}
          onTerminate={terminateExam}
          onEnd={endExam}
        />
      )}
      {examTerminated && <Result score={score} terminated />}
      {!examStarted && !examTerminated && score !== 0 && (
        <Result score={score} />
      )}
    </div>
  )

}

export default App
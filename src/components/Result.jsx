import React from 'react';

const Result = ({ score, terminated }) => {
  return (
    <div className="result">
      {terminated ? (
        <h2>Exam Terminated Due to Violations</h2>
      ) : (
        <h2>Exam Completed</h2>
      )}
      <p>Your Score: {score}</p>
      <button onClick={() => window.location.reload()}>Restart Exam</button>
    </div>
  );
};

export default Result;
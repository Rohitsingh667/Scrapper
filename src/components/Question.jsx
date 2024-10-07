import React from 'react';

const Question = ({ question, onAnswer }) => {
  const handleAnswerClick = (isCorrect) => {
    onAnswer(isCorrect);
  };

  return (
    <div className="question">
      <h3>{question.text}</h3>
      <div className="options">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerClick(option.isCorrect)}
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Question;
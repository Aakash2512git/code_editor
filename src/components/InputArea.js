import React, { useState } from 'react';

const InputArea = () => {
  const [inputText, setInputText] = useState('');

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  return (
    <div>
      <textarea value={inputText} onChange={handleInputChange} rows="4" cols="50" className='inp' />
    </div>
  );
};

export default InputArea;

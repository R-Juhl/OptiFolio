// App.js
import React, { useState } from 'react';
import './App.css';
import Welcome from './components/Welcome';
import StockSelect from './components/StockSelect';

function App() {
  const [showStockSelect, setShowStockSelect] = useState(false);

  const handleGetStartedClick = () => {
    setShowStockSelect(true);
  };

  return (
    <div className="App">
      <Welcome onGetStartedClick={handleGetStartedClick} />
      {showStockSelect && <StockSelect />}
    </div>
  );
}

export default App;
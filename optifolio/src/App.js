import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import Welcome from './components/Welcome';
import StockSelect from './components/StockSelect';
import InvestPlan from './components/InvestPlan';

function App() {
  const [showStockSelect, setShowStockSelect] = useState(false);
  const [showInvestPlan, setShowInvestPlan] = useState(false);

  const [selectedStocks, setSelectedStocks] = useState([]);
  const [tangencyPortfolio, setTangencyPortfolio] = useState(null);
  const [portfolioWeights, setPortfolioWeights] = useState(null);

  // References for smooth scrolling
  const stockSelectRef = useRef(null);
  const investPlanRef = useRef(null);
  
  const handleGetStartedClick = () => {
    setShowStockSelect(true);
  };

  const handleGenerateInvestPlanClick = () => {
    setShowInvestPlan(true);
  };
  
  useEffect(() => {
    // Scroll to StockSelect component when it's shown
    if (showStockSelect && stockSelectRef.current) {
        stockSelectRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // Scroll to InvestPlan component when it's shown
    if (showInvestPlan && investPlanRef.current) {
        investPlanRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showStockSelect, showInvestPlan]);

  return (
    <div className="App">
      <Welcome onGetStartedClick={handleGetStartedClick} />
      {showStockSelect && <div ref={stockSelectRef}>
        <StockSelect
          onGenerateInvestPlanClick={handleGenerateInvestPlanClick}
          selectedStocks={selectedStocks} 
          setSelectedStocks={setSelectedStocks}
          tangencyPortfolio={tangencyPortfolio}
          setTangencyPortfolio={setTangencyPortfolio}
          portfolioWeights={portfolioWeights}
          setPortfolioWeights={setPortfolioWeights}
        />
      </div>}
      {showInvestPlan && <div ref={investPlanRef}>
        <InvestPlan
          optimalPortfolio={tangencyPortfolio} 
          selectedStocks={selectedStocks} 
          portfolioWeights={portfolioWeights}
        />
      </div>}
    </div>
  );
}

export default App;
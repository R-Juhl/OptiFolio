import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell } from 'recharts';

function StockSelect() {
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [portfolioWeights, setPortfolioWeights] = useState(null);
  const [hasComputed, setHasComputed] = useState(false);
  const COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#FF5733', '#33FF57', 
    '#8533FF', '#33FFF5', '#FF33F5', '#F5FF33'
  ];

  const toggleStockSelection = (stock) => {
    if (selectedStocks.includes(stock)) {
      setSelectedStocks(selectedStocks.filter(s => s !== stock));
    } else {
      setSelectedStocks([...selectedStocks, stock]);
    }
  }

  const computeOptimalPortfolio = async () => {
    if (selectedStocks.length === 0) {
      setPortfolioWeights(null);
      return;
    }

    setHasComputed(true);
    const response = await fetch('http://localhost:5000/api/compute-portfolio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stocks: selectedStocks })
    });

    const data = await response.json();
    console.log(data);
    setPortfolioWeights(data.weights);
  }

  useEffect(() => {
    if (hasComputed) {
      // Reset weights to null every time stock selection changes
      setPortfolioWeights(null);
      
      // Compute the optimal portfolio
      computeOptimalPortfolio();
    }
  }, [selectedStocks]);

  return (
    <div className="App">
      <h2>Select Stocks</h2>
      <p>Based on your interest or current portfolio, select stocks below for portfolio optimization:</p>

      <div className="stock-container">
        {['TSLA', 'META', 'AAPL', 'AMZN'].map(stock => (
          <div 
            key={stock}
            className={`stock-box ${selectedStocks.includes(stock) ? 'selected' : ''}`}
            onClick={() => toggleStockSelection(stock)}
          >
            {stock}
          </div>
        ))}
      </div>

      <button id="getStarted" onClick={computeOptimalPortfolio}>CREATE MY PORTFOLIO ALREADY!</button>

      {
        portfolioWeights && portfolioWeights.length === selectedStocks.length && (
          <div className="pie-container">
            <PieChart width={400} height={400}>
              <Pie
                data={selectedStocks.map((stock, index) => ({ name: stock, value: portfolioWeights[index] }))}
                cx={200}
                cy={200}
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
              >
                {
                  selectedStocks.map((stock, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
                }
              </Pie>
            </PieChart>
            <div className="legend">
              {selectedStocks.map((stock, index) => (
                <div key={stock} className="legend-item">
                  <span 
                    className="color-box" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></span>
                  {stock}: {portfolioWeights[index].toFixed(2)}
                </div>
              ))}
            </div>
          </div>
        )
      }
    </div>
  );
}

export default StockSelect;

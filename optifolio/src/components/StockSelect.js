import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function StockSelect() {
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [portfolioWeights, setPortfolioWeights] = useState(null);
  const [efficientFrontier, setEfficientFrontier] = useState([]);
  const [tangencyPortfolio, setTangencyPortfolio] = useState(null);
  const [individualStocks, setIndividualStocks] = useState([]);
  const [minVariancePortfolio, setMinVariancePortfolio] = useState(null);
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
    setEfficientFrontier(data.frontier);
    setTangencyPortfolio(data.tangency);
    setIndividualStocks(data.stocks);
    setMinVariancePortfolio(data.min_variance);

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
          <div className="chart-container">
            {/* Container for Efficient Frontier */}
            <div className="frontier-container">
            <ScatterChart
                width={850}
                height={400}
                margin={{ top: 50, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid />
                <XAxis 
                  type="number" 
                  dataKey={entry => entry.volatility * Math.sqrt(252)}
                  name="Volatility"
                  unit="%"
                  tickFormatter={(value) => value.toFixed(2)}
                  label={{ value: 'Volatility', position: 'bottom' }} 
                />
                <YAxis 
                  type="number" 
                  dataKey={entry => entry.return * 100}
                  name="Expected Return" 
                  unit="%"
                  tickFormatter={(value) => value.toFixed(1)}
                  label={{ value: 'Expected Return', position: 'outsideLeft', angle: -90, dx: -40, dy: -0 }} 
                />

                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend align="right" verticalAlign="middle" layout="vertical" wrapperStyle={{ paddingLeft: '40px' }} />
                <Scatter name="Efficient Frontier" data={efficientFrontier} fill="#36A2EB" line shape="circle" />
                <Scatter name="Tangency Portfolio" data={[tangencyPortfolio]} fill="#FFCE56" shape="diamond" />
                <Scatter name="Individual Stocks" data={individualStocks} fill="#4BC0C0" shape="circle" />
                <Scatter name="Min Variance Portfolio" data={[minVariancePortfolio]} fill="#FF5733" shape="triangle" />
              </ScatterChart>
            </div>

            {/* Container for Pie Chart and Legend */}
            <div className="portfolio-container">
              <PieChart width={400} height={400}>
                <Pie
                  data={selectedStocks.map((stock, index) => ({ name: stock, value: portfolioWeights[index] }))}
                  cx={200}
                  cy={200}
                  labelLine={false}
                  outerRadius={150}
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
          </div>
        )
      }
    </div>
  );
}

export default StockSelect;

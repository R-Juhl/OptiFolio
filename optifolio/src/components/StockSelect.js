import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function StockSelect() {
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [portfolioWeights, setPortfolioWeights] = useState(null);
  const [efficientFrontier, setEfficientFrontier] = useState([]);
  const [tangencyPortfolio, setTangencyPortfolio] = useState(null);
  const [individualStocks, setIndividualStocks] = useState([]);
  const [minVariancePortfolio, setMinVariancePortfolio] = useState(null);
  const [hasClickedButton, setHasClickedButton] = useState(false);
  const [controller, setController] = useState(new AbortController()); // AbortController for fetch
  const [startDate, setStartDate] = useState("2015-01");
  const [endDate, setEndDate] = useState("2023-01");
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

  const computeOptimalPortfolio = async (currentController) => {
    // Reset weights to null every time before computing
    setPortfolioWeights(null);
    
    if (selectedStocks.length === 0) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/compute-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          stocks: selectedStocks,
          startDate: startDate + "-01",  // Format to YYYY-MM-DD
          endDate: endDate + "-01"
        }),
        signal: currentController.signal // Use the passed controller
      });

      const data = await response.json();
      console.log(data);
      setPortfolioWeights(data.weights);
      setEfficientFrontier(data.frontier);
      setTangencyPortfolio(data.tangency);
      setIndividualStocks(data.stocks);
      setMinVariancePortfolio(data.min_variance);
      setHasClickedButton(true);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        throw error;
      }
    }
  }

  useEffect(() => {
    console.log("useEffect triggered");
    
      // Only compute the portfolio if the button has been clicked at least once
      if (hasClickedButton) {
        if (selectedStocks.length > 0) {
          // If there's an existing controller, abort the previous fetch
          if (controller) {
            controller.abort();
        }

        // Create a new AbortController for the fetch
        const newController = new AbortController();
        setController(newController);

        // Compute the optimal portfolio with the new controller
        computeOptimalPortfolio(newController);
      } else {
        // Reset all states if no stocks are selected
        setPortfolioWeights(null);
        setEfficientFrontier([]);
        setTangencyPortfolio(null);
        setIndividualStocks([]);
        setMinVariancePortfolio(null);
      }
    }
  }, [selectedStocks, startDate, endDate]);
  

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

      <div className="date-container">
        <p>Choose date range for historical data:</p>
        <input 
          type="month"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        to
        <input 
          type="month"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
      </div>

      <button id="getStarted" className="main-button" onClick={computeOptimalPortfolio}>
        CREATE MY PORTFOLIO ALREADY!
      </button>

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
                  tickFormatter={(value) => value.toFixed(1)}
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

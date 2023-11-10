import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function StockSelect(props) {
  const { selectedStocks, setSelectedStocks, portfolioWeights, setPortfolioWeights, tangencyPortfolio, setTangencyPortfolio, optimalPortfolio, setOptimalPortfolio } = props;

  const [efficientFrontier, setEfficientFrontier] = useState([]);
  const [individualStocks, setIndividualStocks] = useState([]);
  const [minVariancePortfolio, setMinVariancePortfolio] = useState(null);
  const [hasClickedButton, setHasClickedButton] = useState(false);
  const [controller, setController] = useState(new AbortController()); // AbortController for fetch
  const [risk, setRisk] = useState(5);
  const [startDate, setStartDate] = useState("2015-01");
  const [endDate, setEndDate] = useState("2023-01");
  const [availableStocks, setAvailableStocks] = useState(['TSLA', 'META', 'AAPL', 'AMZN']);
  
  const [sortedSelectedStocks, setSortedSelectedStocks] = useState([]);
  
  const [newStock, setNewStock] = useState(''); // state to store user's inputted stock
  const [stockError, setStockError] = useState('');
  const [dateRangeError, setDateRangeError] = useState('');
  const [gptQuery, setGptQuery] = useState('');
  const [gptResponse, setGptResponse] = useState('');
  const [gptLoading, setGptLoading] = useState(false);
  const [gptErrorMessage, setGptErrorMessage] = useState('');
  const [cooldownTime, setCooldownTime] = useState(null);
  const [showMethod, setShowMethod] = useState(false);
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

  const checkDateRangeForStocks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/check-daterange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          stocks: selectedStocks,
          startDate: startDate + "-01",  // Format to YYYY-MM-DD
          endDate: endDate + "-01"
        })
      });
  
      const data = await response.json();
      if (!data.valid) {
        setDateRangeError(data.message);
        return false;
      } else {
        setDateRangeError('');
        return true;
      }
    } catch (error) {
      console.error("Error checking date range:", error);
      return false;
    }
  }  

  const computeOptimalPortfolio = async (currentController) => {
    // Reset weights to null every time before computing
    setPortfolioWeights(null);
    
    if (selectedStocks.length === 0) {
      return;
    }

    // Check if only one stock is selected
    if (selectedStocks.length === 1) {
      setStockError('Portfolio calculations require more than one stock.');
    } else {
      setStockError(''); // Clear the error if more than one stock is selected
    }

    const isDateRangeValid = await checkDateRangeForStocks();
    if (!isDateRangeValid) {
      return; // Return only if date range error exists
    }

    // If stockError exists, return after checking for dateRangeError
    if (stockError) {
      return;
    }

    try {
      const sortedSelectedStocks = [...selectedStocks].sort();
      const response = await fetch('http://localhost:5000/api/compute-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          stocks: sortedSelectedStocks,
          startDate: startDate + "-01",  // Format to YYYY-MM-DD
          endDate: endDate + "-01",
          riskLevel: risk // Send risk level to backend
        }),
        signal: currentController.signal // Use the passed controller
      });

      const data = await response.json();

      // Check if the backend returned an error:
      if (!response.ok) {
        throw new Error(data.error || "An error occurred while computing the portfolio.");
      }
    
      // Clear error messages if successful
      setDateRangeError('');

      console.log(data);

      const processedWeights = data.weights.map(weight => Math.abs(weight) < 1e-15 ? 0 : weight);

      // Assuming data.weights are returned in the order of sortedStocks
      const weightsMapping = sortedSelectedStocks.reduce((acc, stock, index) => {
        acc[stock] = processedWeights[index];
        return acc;
      }, {});

      setPortfolioWeights(weightsMapping);
      setEfficientFrontier(data.frontier);
      setTangencyPortfolio(data.tangency);
      setOptimalPortfolio(data.optimalPortfolio); // Set optimal portfolio for use in InvestPlan
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

  const askGptForSuggestions = async () => {
    setGptLoading(true);  // Start loading

    if (cooldownTime && cooldownTime > Date.now()) {
      const secondsLeft = Math.ceil((cooldownTime - Date.now()) / 1000);
      setGptErrorMessage(`Due to a rate limit on GPT requests, please wait ${secondsLeft} seconds before submitting a new request.`);
      setGptLoading(false);
      return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/chat-gpt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: gptQuery })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            setGptErrorMessage(data.error); // Display rate limiting error
            setCooldownTime(Date.now() + 30000);  // Set cooldown time to 30 seconds from now
        } else {
            setGptResponse(data.response);
        }
    } catch (error) {
        console.error("Error asking GPT:", error);
    } finally {
      setGptLoading(false);  // Stop loading
    }
  }

  const addStock = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/validate-stock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ stock: newStock })
        });

        const data = await response.json();

        if (data.valid) {
            setAvailableStocks(prevStocks => [...prevStocks, newStock]);
            console.log(availableStocks);
            setNewStock('');
        } else {
            console.error(data.message);
        }
    } catch (error) {
        // console.error("Error adding stock:", error);
    }
  }

  function PortfolioTable({ tangencyPortfolio, individualStocks }) {
    return (
      <div className="portfolio-table-container">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>Stock/Portfolio</th>
              <th>Expected Return</th>
              <th>Volatility</th>
            </tr>
          </thead>
          <tbody>
            {individualStocks.map(stock => (
              <tr key={stock.name}>
                <td>{stock.name}</td>
                <td>{(stock.return * 100).toFixed(2)}%</td>
                <td>{(stock.volatility * Math.sqrt(252)).toFixed(2)}%</td>
              </tr>
            ))}
            <tr>
              <td>Your Optimal Portfolio</td>
              <td>{(optimalPortfolio.return * 100).toFixed(2)}%</td>
              <td>{(optimalPortfolio.volatility * Math.sqrt(252)).toFixed(2)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  useEffect(() => {
      // Only compute the portfolio if the button has been clicked at least once
      if (hasClickedButton) {
        if (selectedStocks.length > 0) {
          // If there's an existing controller, abort the previous fetch
          if (controller) {
            controller.abort();
        }

        // Create AbortController for the fetch
        const newController = new AbortController();
        setController(newController);
        
        // Sort the selected stocks and update sortedSelectedStocks
        const sortedStocks = [...selectedStocks].sort();
        setSortedSelectedStocks(sortedStocks);

        // Compute the optimal portfolio with the controller
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
  

  //*** Rendering Code ***// 
  return (
    <div className="Sec">
      <h2>Ask GPT for Inspiration</h2>
      <p>Need stock suggestions? Let GPT inspire you!</p>
      <p>GPT can help with both straightforward and imaginative requests, whether they're broad or specific. <br />Here are some sample queries:</p>
      
      <ul className="gpt-examples-list">
        <li>"Car companies"</li>
        <li>"Blue Chip companies"</li>
        <li>"Companies investing heavily in X"</li>
        <li>"Companies that have a monopoly in their respective business niche"</li>
        <li>"Companies that will succeed if X comes true"</li>
      </ul>

      <div className="query-container">
        <input 
          id="gptQueryInput"
          type="text" 
          value={gptQuery}
          onChange={e => setGptQuery(e.target.value)}
          placeholder="Enter your query for stock suggestions..."
        />
        <button id="askGpt" className="main-button" onClick={askGptForSuggestions}>Ask GPT</button>
      </div>
      {gptLoading && <p className="loading-text"></p>}
      {gptResponse && <p className="gpt-response">{gptResponse}</p>}

      <hr className="custom-hr" />

      <h2>Select Stocks</h2>
      <p>Type a stock ticker and add to available stocks:</p>
      <div className="query-container">
        <input
          id="stockInput"
          type="text" 
          value={newStock}
          onChange={e => setNewStock(e.target.value.toUpperCase())}
          placeholder="Enter stock ticker..."
        />
        <button id="addStock" className="main-button" onClick={addStock}>Add</button>
      </div>

      <p>Select and deselect any stock to create new optimal portfolios:</p>
      <div className="stock-container">
        {availableStocks.map(stock => (
            <div 
              key={stock}
              className={`stock-box ${selectedStocks.includes(stock) ? 'selected' : ''}`}
              onClick={() => toggleStockSelection(stock)}
            >
              {stock}
            </div>
        ))}
      </div>
      {stockError && <p className="error-message">{stockError}</p>}
      {dateRangeError && <p className="error-message">{dateRangeError}</p>}
      {gptErrorMessage && <p className="error-message">{gptErrorMessage}</p>}
      
      <div className="slider-container">
        <label htmlFor="risk" className="risk-title">Risk Level:</label>
        <div className="slider-wrapper">
          <span className="risk-label">Low</span>
          <input 
            type="range" 
            id="risk" 
            name="risk" 
            min="1" 
            max="10"
            value={risk}
            onChange={e => setRisk(e.target.value)}
          />
          <span className="risk-label">High</span>
        </div>
        <span id="riskDisplay">{risk}</span>
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
        CREATE PORTFOLIO
      </button>
      
    
      {
        //portfolioWeights && portfolioWeights.length === selectedStocks.length && (
        portfolioWeights && Object.keys(portfolioWeights).length === selectedStocks.length && (
          <div className="chart-container">

            <hr className="custom-hr" />
            <h2>Your Portfolio</h2>

            <button className="popup-button" onClick={() => setShowMethod(true)}>
              How does this work?
            </button>

            {showMethod && (
              <div className="method-popup">
                <button className="close-button" onClick={() => setShowMethod(false)}>X</button>
                <h3>How Does This Work?</h3>
                <p>When you select a set of stocks, this app dives into their historical data to understand how they have performed in the past. Using this information, it then calculates the "best mix" of these stocks to create a portfolio that offers the highest return for a given level of risk.</p>
                <p>It does this by employing the principles of Modern Portfolio Theory (MPT). Specifically, it uses Mean-Variance Optimization to derive the Efficient Frontier. Risk levels are incorporated using Relative Risk Aversion (RRA) levels.</p>
                <p>Imagine you're assembling a musical band with a mix of instruments like guitars, drums, and keyboards. You want the right balance, so every song they play strikes the perfect chord and harmony. Similarly, this app ensures that your portfolio has the right balance of stocks, so your investments work together in harmony, each complementing the other.</p>
                <p>The curve you see is the Efficient Frontier. It represents the optimal portfolios that offer the highest expected return for a given level of risk. But how do you translate this into actionable investment decisions? The Pie Chart below it breaks down the optimal portfolio for the specified risk-level by displaying the proportion, or weight, of each selected stock. In essence, it visualizes how you might distribute your investments among these stocks for the best risk-return trade-off.</p>
                <p>Lastly, the table beneath provides a detailed look at the expected annual return and volatility of each individual stock and the optimal portfolio. It's a way to quantify the potential performance of each asset and the combined portfolio.</p>
              </div>
            )}

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
                  tickFormatter={(value) => value.toFixed(0)}
                  tick={{ fill: 'white', fontWeight: 'regular' }}
                  label={{ 
                    value: 'Exp. Volatility (Risk)', 
                    position: 'bottom',
                    style: { fill: 'white', fontWeight: 'regular' }
                  }} 
                />
                <YAxis 
                  type="number" 
                  dataKey={entry => entry.return * 100}
                  name="Return" 
                  unit="%"
                  tickFormatter={(value) => value.toFixed(0)}
                  tick={{ fill: 'white', fontWeight: 'regular' }}
                  label={{ 
                    value: 'Exp. Return', 
                    position: 'outsideLeft', 
                    angle: -90, 
                    dx: -40, 
                    dy: -0,
                    style: { fill: 'white', fontWeight: 'regular' }
                  }} 
                />

                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend align="right" verticalAlign="middle" layout="vertical" wrapperStyle={{ paddingLeft: '30px' }} />
                <Scatter name="Efficient Frontier" data={efficientFrontier} fill="#36A2EB" line shape="circle" />
                <Scatter name="Tangency Portfolio" data={[tangencyPortfolio]} fill="#FFCE56" shape="diamond" />
                <Scatter name="Individual Stocks" data={individualStocks} fill="#4BC0C0" shape="circle" />
                <Scatter name="Min Variance Portfolio" data={[minVariancePortfolio]} fill="#FF5733" shape="triangle" />
                <Scatter name="Your Optimal Portfolio" data={[optimalPortfolio]} fill="#33FF57" shape="star" />
              </ScatterChart>
            </div>

            {/* Container for Pie Chart and Legend */}
            <div className="portfolio-container">
              <div className="pie-chart-wrapper">
                <PieChart width={400} height={400}>
                <Pie
                  data={sortedSelectedStocks.map(stock => ({
                    name: stock,
                    value: portfolioWeights[stock]
                  }))}
                  cx={200}
                  cy={200}
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {
                    sortedSelectedStocks.map((stock) => (
                      <Cell key={`cell-${stock}`} fill={COLORS[sortedSelectedStocks.indexOf(stock) % COLORS.length]} />
                    ))
                  }
                </Pie>
                </PieChart>
              </div>
              <div className="legend">
                <div className="pie-chart-title">Weights:</div>
                {sortedSelectedStocks.map((stock, index) => (
                  <div key={stock} className="legend-item">
                    <span 
                      className="color-box" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    {stock}: {portfolioWeights[stock].toFixed(3)}
                  </div>
                ))}
              </div>
            </div>
            {/* PortfolioTable */}
            {
              tangencyPortfolio && individualStocks.length > 0 && (
                <PortfolioTable 
                  optimalPortfolio={optimalPortfolio} 
                  individualStocks={individualStocks} 
                />
              )
            }
          </div>
        )
      }
      <br/>
      {
        hasClickedButton && (
          <>
            <p>When you are done constructing a portfolio, click the button below to generate an investment plan:</p>
            {
              <button className="main-button" onClick={props.onGenerateInvestPlanClick}>
                GENERATE INVESTMENT PLAN
              </button>
            }
            <br/><br/>
          </>
        )
      }
    </div>
  );
}

export default StockSelect;
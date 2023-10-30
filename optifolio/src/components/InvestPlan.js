import React, { useState, useContext } from 'react';

function InvestPlan({ optimalPortfolio, selectedStocks, portfolioWeights }) {
  const [capital, setCapital] = useState('');
  const [monthlySurplus, setMonthlySurplus] = useState('');
  const [transFee, setTransFee] = useState('');
  const [shareCounts, setShareCounts] = useState({});

  const handleSubmit = () => {
    // Here you can handle the logic after user submits their monthly surplus
    console.log('Monthly Surplus Submitted:', monthlySurplus);
  }

  // Function to handle share count input change
  const handleShareChange = (stock, value) => {
    setShareCounts(prevCounts => ({ ...prevCounts, [stock]: value }));
  }

  return (
    <div className="Sec">
        <h3>Investment Plan</h3>
        <br/><label htmlFor="capital">Total Capital (USD): </label>
        <input 
          type="number" 
          id="capital" 
          name="capital" 
          placeholder="Enter your total capital"
          value={capital}
          onChange={e => setCapital(e.target.value)}
        /><br/>
        <p>Please specify how much surplus you have available each month that you wish to invest:</p>
        <input
            type="number"
            placeholder="Enter monthly surplus"
            value={monthlySurplus}
            onChange={e => setMonthlySurplus(e.target.value)}
        />
        <button id="submitButton" className="main-button" onClick={handleSubmit}>Submit</button>

        <p>For a more accurate stock purchase plan, please specify transaction/broker fees per stock order (optional):</p>
        <input
            type="number"
            placeholder="Enter fee"
            value={transFee}
            onChange={e => setTransFee(e.target.value)}
        />
        <button id="submitButton" className="main-button" onClick={handleSubmit}>Submit</button>

        <h3>Your Existing Shares</h3>
        <p>Enter the number of shares you already own for each stock (if any):</p>
        <div className="portfolio-table-container">
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Existing Shares</th>
              </tr>
            </thead>
            <tbody>
            { optimalPortfolio && 
              selectedStocks
                .filter((stock, index) => portfolioWeights[index] > 0)
                .map((stock, index) => (
                <tr key={stock}>
                  <td>{stock}</td>
                  <td>
                    <input
                      type="number"
                      value={shareCounts[stock] || 0}
                      onChange={e => handleShareChange(stock, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
}

export default InvestPlan;

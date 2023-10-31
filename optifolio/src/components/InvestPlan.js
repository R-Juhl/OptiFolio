import React, { useState, useContext } from 'react';

function InvestPlan({ optimalPortfolio, selectedStocks, portfolioWeights }) {
  const [capital, setCapital] = useState('');
  const [monthlySurplus, setMonthlySurplus] = useState('');
  const [transFee, setTransFee] = useState('');
  const [shareCounts, setShareCounts] = useState({});

  // Function to handle share count input change
  const handleShareChange = (stock, value) => {
    setShareCounts(prevCounts => ({ ...prevCounts, [stock]: value }));
  }

  return (
    <div className="Sec">
        <h2>Investment Plan</h2>
        <p>Total Capital (in USD):</p>
        <div className="query-container">
          <input 
            type="number" 
            id="capital" 
            name="capital" 
            placeholder="Enter your total capital"
            value={capital}
            onChange={e => setCapital(e.target.value)}
          />
        </div>

        <p>Please specify how much surplus you have available each month that you intend to invest:</p>
        <input
            type="number"
            placeholder="Enter monthly surplus"
            value={monthlySurplus}
            onChange={e => setMonthlySurplus(e.target.value)}
        />

        <p>For a more accurate stock purchase plan, please specify transaction/broker fees per stock order (optional):</p>
        <input
            type="number"
            placeholder="Enter fee"
            value={transFee}
            onChange={e => setTransFee(e.target.value)}
        />

        <br/>
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

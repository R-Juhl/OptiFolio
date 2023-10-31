import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InvestPlan({ optimalPortfolio, selectedStocks, portfolioWeights }) {
  const [capital, setCapital] = useState('');
  const [monthlySurplus, setMonthlySurplus] = useState('');
  const [transFee, setTransFee] = useState('');
  const [shareCounts, setShareCounts] = useState({});

  const [stockPrices, setStockPrices] = useState({});
  const [stocksToBuy, setStocksToBuy] = useState([]);

  // Function to handle share count input change
  const handleShareChange = (stock, value) => {
    setShareCounts(prevCounts => ({ ...prevCounts, [stock]: value }));
  }

  const downloadExcel = () => {
    const payload = {
      stocks: selectedStocks,
      targetPercentages: stocksToBuy.map(s => s.targetPercentage),
      targetShares: stocksToBuy.map(s => s.shares),  // You might need to calculate this
      currentShares: selectedStocks.map(stock => shareCounts[stock] || 0),
      sharesToBuy: stocksToBuy.map(s => s.shares)
    };

    axios.post('http://localhost:5000/api/generate-excel', payload, {
      responseType: 'blob'
    }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Optifolio Investment Plan.xlsx');
      document.body.appendChild(link);
      link.click();
    });
  }

  useEffect(() => {
    if (selectedStocks.length > 0) {
      axios.post('http://localhost:5000/api/get-stock-prices', { stocks: selectedStocks })
        .then(response => {
          setStockPrices(response.data.prices);
        }).catch(error => {
          console.error("Error fetching stock prices:", error);
          if (error.response) {
            console.log("Server responded with:", error.response.data);
          }
        });
    }
  }, [selectedStocks]);

  useEffect(() => {
    let remainingCapital = parseFloat(capital || 0);
    let stocksBuyList = [];

    selectedStocks.forEach((stock, index) => {
      const targetWeight = portfolioWeights[index];
      if (targetWeight > 0) {
        if (stockPrices[stock] === undefined || stockPrices[stock] === 0) {
          console.error(`Price for stock ${stock} is not available or is zero.`);
          return;
        }
        const targetValue = remainingCapital * targetWeight;
        const shares = Math.floor((targetValue - (shareCounts[stock] || 0) * stockPrices[stock]) / stockPrices[stock]);
        stocksBuyList.push({ stock, targetPercentage: targetWeight * 100, shares });
        remainingCapital -= shares * stockPrices[stock];
      }
    });

    // Allocate remaining capital
    while (remainingCapital > 0) {
      let allocated = false;
      for (let i = 0; i < stocksBuyList.length; i++) {
        if (remainingCapital >= stockPrices[stocksBuyList[i].stock]) {
          stocksBuyList[i].shares += 1;
          remainingCapital -= stockPrices[stocksBuyList[i].stock];
          allocated = true;
        }
      }
      if (!allocated) break;  // If no shares can be bought with the remaining capital
    }

    setStocksToBuy(stocksBuyList);
  }, [capital, shareCounts, stockPrices]);

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
          min="0"
        />
      </div>

      <p>Please specify how much surplus you have available each month that you intend to invest:</p>
      <input
        type="number"
        placeholder="Enter monthly surplus"
        value={monthlySurplus}
        onChange={e => setMonthlySurplus(e.target.value)}
        min="0"
      />

      <p>For a more accurate stock purchase plan, please specify transaction/broker fees per stock order (optional):</p>
      <input
        type="number"
        placeholder="Enter fee"
        value={transFee}
        onChange={e => setTransFee(e.target.value)}
        min="0"
      />

      <br/>
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
      <div className="portfolio-table-container">
        <h3>Stocks to Buy</h3>
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>Stock</th>
              <th>Target Allocation (%)</th>
              <th>Shares to Buy</th>
            </tr>
          </thead>
          <tbody>
            {stocksToBuy.map(entry => (
              <tr key={entry.stock}>
                <td>{entry.stock}</td>
                <td>{entry.targetPercentage.toFixed(2)}</td>
                <td>{entry.shares}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="main-button" onClick={downloadExcel}>Download Investment Plan (Excel)</button>
    </div>
  );
}

export default InvestPlan;

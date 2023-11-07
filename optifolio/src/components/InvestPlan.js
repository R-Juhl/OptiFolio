import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InvestPlan({ optimalPortfolio, filteredStocks, filteredWeights }) {
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

  const computeMonthlyInvestment = () => {
    let monthlyInvestment = [];
    let surplus = parseFloat(monthlySurplus);
    let transactionCosts = parseFloat(transFee || 0);

    for (let period = 0; period < 10; period++) {
      let monthlyBuyList = prioritizeStocksLogic(filteredStocks, filteredWeights, stockPrices, shareCounts, surplus, transactionCosts);
      monthlyInvestment.push(monthlyBuyList);
    }
    return monthlyInvestment;
  };
  
  const prioritizeStocksLogic = (stocks, weights, prices, currentShares, surplus, fee) => {
    let currentPortfolioValue = 0;
    let totalTargetValue = 0;
    let monthlyBuyList = [];
  
    // Calculate current portfolio value
    stocks.forEach((stock, i) => {
      currentPortfolioValue += (currentShares[stock] || 0) * (prices[stock] || 0);
    });
  
    // Calculate total target value including surplus
    totalTargetValue = currentPortfolioValue + surplus - (fee * stocks.length);
  
    // Calculate shares to buy based on target weights
    stocks.forEach((stock, i) => {
      const targetValue = weights[i] * totalTargetValue;
      const currentValue = (currentShares[stock] || 0) * (prices[stock] || 0);
      const valueToBuy = Math.max(0, targetValue - currentValue - fee);
      const sharesToBuy = Math.floor(valueToBuy / prices[stock]);
  
      monthlyBuyList.push({
        stock: stock,
        sharesToBuy: sharesToBuy,
        currentPrice: prices[stock],
      });
    });
  
    return monthlyBuyList;
  };

  const downloadExcel = () => {
    const monthlyInvestmentPlan = computeMonthlyInvestment();
    const payload = {
      stocks: filteredStocks,
      currentPrices: filteredStocks.map(stock => stockPrices[stock] || 0),
      surplus: monthlySurplus,
      fee: transFee,
      targetPercentages: stocksToBuy.map(s => s.targetPercentage),
      targetShares: stocksToBuy.map(s => s.shares),
      currentShares: filteredStocks.map(stock => shareCounts[stock] || 0),
      sharesToBuy: stocksToBuy.map(s => s.shares),
      monthlyInvestmentPlan: monthlyInvestmentPlan,
    };

    axios.post('http://localhost:5000/api/generate-excel', payload, {
      responseType: 'blob'
    }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Optifolio Investment Plan.xlsm');
      document.body.appendChild(link);
      link.click();
    });
  }

  useEffect(() => {
    if (filteredStocks.length > 0) {
      axios.post('http://localhost:5000/api/get-stock-prices', { stocks: filteredStocks })
        .then(response => {
          setStockPrices(response.data.prices);
        }).catch(error => {
          console.error("Error fetching stock prices:", error);
          if (error.response) {
            console.log("Server responded with:", error.response.data);
          }
        });
    }
  }, [filteredStocks]);

  useEffect(() => {
    let remainingCapital = parseFloat(capital || 0) - filteredStocks.length * parseFloat(transFee || 0);
    let stocksBuyList = [];
    let totalPortfolioTargetValue = remainingCapital;
  
    // First calculate the total value for the target allocation
    filteredStocks.forEach((stock, index) => {
      const targetWeight = filteredWeights[index];
      totalPortfolioTargetValue += (shareCounts[stock] || 0) * stockPrices[stock];
    });
  
    // Now calculate the target shares based on the target allocation
    filteredStocks.forEach((stock, index) => {
      const targetWeight = filteredWeights[index];
      const targetValue = totalPortfolioTargetValue * targetWeight;
      const targetShares = Math.floor(targetValue / (stockPrices[stock] + parseFloat(transFee || 0)));
      const currentSharesOwned = shareCounts[stock] || 0;
      const sharesToBuy = Math.max(0, targetShares - currentSharesOwned); // Cannot buy negative shares
  
      stocksBuyList.push({
        stock,
        targetPercentage: targetWeight * 100,
        shares: targetShares, // This is the target allocation in shares
        sharesToBuy: sharesToBuy // This is the number of shares to buy to reach the target
      });
  
      // The remaining capital is reduced by the cost of shares to buy, not target shares
      remainingCapital -= sharesToBuy * (stockPrices[stock] + parseFloat(transFee || 0));
    });
  
    // Allocate remaining capital
    while (remainingCapital > 0) {
      let allocated = false;
      for (let i = 0; i < stocksBuyList.length; i++) {
        if (remainingCapital >= (stockPrices[stocksBuyList[i].stock] + parseFloat(transFee || 0))) {
          stocksBuyList[i].sharesToBuy += 1;
          remainingCapital -= (stockPrices[stocksBuyList[i].stock] + parseFloat(transFee || 0));
          allocated = true;
        }
      }
      if (!allocated) break; // If no shares can be bought with the remaining capital
    }
  
    setStocksToBuy(stocksBuyList);
  }, [capital, shareCounts, stockPrices, filteredStocks, filteredWeights, transFee]);

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
            filteredStocks.map((stock, index) => (
              <tr key={stock}>
                <td>{stock}</td>
                <td>
                  <input
                    type="number"
                    value={shareCounts[stock] || 0}
                    onChange={e => handleShareChange(stock, e.target.value)}
                    min="0"
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
      <p>This is a macro-enabled Excel Workbook. You will need to enable macros for it to work.</p>
        <p>I assure you that it does not present any security risks. Trust be bro.</p>
    </div>
  );
}

export default InvestPlan;

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
    totalTargetValue = currentPortfolioValue + surplus;
  
    // Calculate initial shares to buy without considering transaction fees
    stocks.forEach((stock, i) => {
      const targetValue = weights[i] * totalTargetValue;
      const currentValue = (currentShares[stock] || 0) * (prices[stock] || 0);
      const valueToBuy = Math.max(0, targetValue - currentValue);
      const sharesToBuyWithoutFees = Math.floor(valueToBuy / prices[stock]);

      monthlyBuyList.push({
        stock: stock,
        sharesToBuy: sharesToBuyWithoutFees,
        currentPrice: prices[stock],
      });
    });

    // Calculate total transaction fees based on the number of stocks with shares to buy > 0
    let transactionFees = monthlyBuyList.filter(item => item.sharesToBuy > 0).length * fee;

    // Deduct transaction fees from surplus
    surplus -= transactionFees;

    // Adjust total target value considering the surplus after transaction fees
    totalTargetValue = currentPortfolioValue + surplus;

    // Recalculate shares to buy with the adjusted surplus
    monthlyBuyList = monthlyBuyList.map(item => {
      const targetValue = weights[stocks.indexOf(item.stock)] * totalTargetValue;
      const currentValue = (currentShares[item.stock] || 0) * (prices[item.stock] || 0);
      const valueToBuy = Math.max(0, targetValue - currentValue);
      // Recalculate considering the fee deduction, ensuring not to buy if insufficient funds for fees
      const maxAffordableShares = Math.floor((surplus + currentValue) / (prices[item.stock] + (item.sharesToBuy > 0 ? fee : 0)));
      const sharesToBuy = Math.min(maxAffordableShares, Math.floor(valueToBuy / prices[item.stock]));
      
      return {
        ...item,
        sharesToBuy: sharesToBuy
      };
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
    let remainingCapital = parseFloat(capital || 0);
    let stocksBuyList = [];
    let totalPortfolioTargetValue = 0;
  
    // First calculate the total value for the target allocation
    filteredStocks.forEach((stock, index) => {
      totalPortfolioTargetValue += (shareCounts[stock] || 0) * stockPrices[stock];
    });

    totalPortfolioTargetValue += remainingCapital; // Include initial capital in the target portfolio value
    
    // Calculate the target shares based on the target allocation
    filteredStocks.forEach((stock, index) => {
      const targetWeight = filteredWeights[index];
      const targetValue = totalPortfolioTargetValue * targetWeight;
      const currentSharesOwned = shareCounts[stock] || 0;
      const targetShares = Math.floor(targetValue / stockPrices[stock]);
      const sharesToBuy = Math.max(0, targetShares - currentSharesOwned); // Cannot buy negative shares
  
      stocksBuyList.push({
        stock,
        targetPercentage: targetWeight * 100,
        shares: sharesToBuy
      });
    });

    // Deduct the transaction fees from the remaining capital
    let transactionFees = stocksBuyList.filter(item => item.shares > 0).length * parseFloat(transFee || 0);
    remainingCapital -= transactionFees;
  
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

import React, { useState } from 'react';

function InvestPlan() {
  const [monthlySurplus, setMonthlySurplus] = useState('');

  const handleSubmit = () => {
    // Here you can handle the logic after user submits their monthly surplus
    console.log('Monthly Surplus Submitted:', monthlySurplus);
  }

  return (
    <div className="invest-plan-container">
        <br/><hr className="custom-hr" />

        <h3>Investment Plan</h3>
        <p>Please specify how much surplus you have available each month that you wish to invest:</p>
        <input
            type="number"
            placeholder="Enter monthly surplus"
            value={monthlySurplus}
            onChange={e => setMonthlySurplus(e.target.value)}
        />
        <button id="submitButton" onClick={handleSubmit}>Submit</button>
        </div>
    );
}

export default InvestPlan;

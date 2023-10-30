import React, { useState } from 'react';
import logo from '../images/logo.svg';

function Welcome(props) {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  //const [experience, setExperience] = useState('');

  return (
    <div className="Sec">
      <h2 className="title">Welcome to OptiFolio</h2>
      <img src={logo} className="App-logo" alt="logo" />
      <p>Your go-to solution for creating an optimal stock portfolio</p>
      
      <button className="disclaimer-button" onClick={() => setShowDisclaimer(true)}>
        NFA: Read Disclaimer
      </button>

      <p>!!! THIS APP IS STILL IN DEMO AND IS MISSING FUNCTIONALITY !!!</p>

      <ul className="numbered-list">
        <li>Add and select any stocks you want included in your portfolio</li>
        <li>Generate optimal portfolios</li>
        <li>Adjust risk levels and other parameters to tailor the portfolio to your individual needs</li>
        <li>Generate and download your stock purchase plan</li>
      </ul>

      {showDisclaimer && (
        <div className="disclaimer-popup">
          <button className="close-button" onClick={() => setShowDisclaimer(false)}>X</button>
          <p>Nothing in this application is financial advice. Always conduct your own research
            and/or consult with a financial advisor before making any investment decisions.</p>
          <p>Think of this application as the "magic 8-ball" of stock portfolios!
            While it might provide some interesting insights and inspiration, remember that
            building a portfolio is a bit more complex than shaking a toy for answers.
            This tool is designed to spark ideas and offer valuable insights, but it's not
            the "end-all-be-all" of investment strategies. So, before you go all-in based
            on our suggestions, make sure to double-check your own research.</p>
        </div>
      )}

      <button className="main-button" onClick={props.onGetStartedClick}>
        GET STARTED
      </button>

    </div>
  );
}

export default Welcome;

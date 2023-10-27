import React, { useState } from 'react';
import logo from '../images/logo.svg';

function Welcome(props) {
  const [capital, setCapital] = useState('');
  const [risk, setRisk] = useState(5);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  //const [experience, setExperience] = useState('');

  return (
    <div className="App">
      <h2 className="title">Welcome to OptiFolio</h2>
      <img src={logo} className="App-logo" alt="logo" />
      <p>Your go-to solution for creating an optimal stock portfolio</p>
      
      <button className="disclaimer-button" onClick={() => setShowDisclaimer(true)}>
        NFA: Read Disclaimer
      </button>

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

      <br/><label htmlFor="capital">Total Capital (USD): </label>
      <input 
        type="number" 
        id="capital" 
        name="capital" 
        placeholder="Enter your total capital"
        value={capital}
        onChange={e => setCapital(e.target.value)}
      /><br/>

      <br/><label htmlFor="risk">Risk Level: </label>
      <input 
        type="range" 
        id="risk" 
        name="risk" 
        min="1" 
        max="10"
        value={risk}
        onChange={e => setRisk(e.target.value)}
      />
      <span id="riskDisplay">{risk}</span><br/><br/>
      
      {/*
      <br/><br/><h3>Select your experience level:</h3>
      <input 
        type="radio" 
        id="beginner" 
        name="experience" 
        value="beginner"
        checked={experience === 'beginner'}
        onChange={e => setExperience(e.target.value)}
      />
      <label htmlFor="beginner">Beginner</label><br/>
      <input 
        type="radio" 
        id="intermediate" 
        name="experience" 
        value="intermediate"
        checked={experience === 'intermediate'}
        onChange={e => setExperience(e.target.value)}
      />
      <label htmlFor="intermediate">Intermediate</label><br/>
      <input 
        type="radio" 
        id="expert" 
        name="experience" 
        value="expert"
        checked={experience === 'expert'}
        onChange={e => setExperience(e.target.value)}
      />
      <label htmlFor="expert">Expert</label><br/><br/>
      */}

      <button className="main-button" onClick={props.onGetStartedClick}>
        GET STARTED
      </button>

    </div>
  );
}

export default Welcome;

// Welcome.js
import React, { useState } from 'react';
import logo from '../images/logo.svg';

function Welcome(props) {
  const [capital, setCapital] = useState('');
  const [risk, setRisk] = useState(5);
  const [experience, setExperience] = useState('');

  return (
    <div className="App">
      <h2 className="title">Welcome to OptiFolio</h2>
      <img src={logo} className="App-logo" alt="logo" />
      <p>Your go-to solution for creating a stock portfolio</p>
      
      <label htmlFor="capital">Total Capital:</label>
      <input 
        type="number" 
        id="capital" 
        name="capital" 
        placeholder="Enter your total capital"
        value={capital}
        onChange={e => setCapital(e.target.value)}
      />

      <label htmlFor="risk">Risk Level:</label>
      <input 
        type="range" 
        id="risk" 
        name="risk" 
        min="1" 
        max="10"
        value={risk}
        onChange={e => setRisk(e.target.value)}
      />
      <span id="riskDisplay">{risk}</span>

      <h3>Select your experience level:</h3>
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
      <label htmlFor="expert">Expert</label><br/>

      <button onClick={props.onGetStartedClick}>
        Get Started
      </button>

    </div>
  );
}

export default Welcome;

import React, { useState } from 'react';
import logo from '../images/logo.png';
import { popupTextDisclaimer } from './PopupText';

function Welcome(props) {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <div className="Sec">
      <h2 className="title">Welcome to OptiFolio</h2>
      <img src={logo} className="App-logo" alt="logo" />
      <p>Your go-to solution for creating a (theoretical) optimal stock portfolio</p>
      
      <button className="popup-button" onClick={() => setShowDisclaimer(true)}>
        NFA: Read Disclaimer
      </button>

      <ul className="numbered-list">
        <li>Add and select any stocks you want included in your portfolio</li>
        <li>Adjust risk levels and other parameters to tailor the portfolio to your individual preferences</li>
        <li>Generate optimal portfolios</li>
        <li>Generate and download your stock purchase plan</li>
      </ul>

      {showDisclaimer && (
        <div className="disclaimer-popup">
          <button className="close-button" onClick={() => setShowDisclaimer(false)}>X</button>
          <h3>{popupTextDisclaimer.title}</h3>
          {popupTextDisclaimer.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}

      <button className="main-button" onClick={props.onGetStartedClick}>
        GET STARTED
      </button>

    </div>
  );
}

export default Welcome;

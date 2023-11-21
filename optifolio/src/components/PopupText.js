// PopupText.js

export const popupTextHow = {
    title: "How Does This Work?",
    content: [
        "When you select a set of stocks, this app dives into their historical data to understand how they have performed in the past. Using this information, it then calculates the 'best mix' of these stocks to create a portfolio that offers the highest return for a given level of risk.",
        "It does this by employing the principles of Modern Portfolio Theory (MPT). Specifically, it uses Mean-Variance Optimization to derive the Efficient Frontier. Risk levels are incorporated using Relative Risk Aversion (RRA) levels.",
        "Imagine you're assembling a musical band with a mix of instruments like guitars, drums, and keyboards. You want the right balance, so every song they play strikes the perfect chord and harmony. Similarly, this app ensures that your portfolio has the right balance of stocks, so your investments work together in harmony, each complementing the other.",
        "The curve you see is the Efficient Frontier. It represents the optimal portfolios that offer the highest expected return for a given level of risk. But how do you translate this into actionable investment decisions? The Pie Chart below it breaks down the optimal portfolio for the specified risk-level by displaying the proportion, or weight, of each selected stock. In essence, it visualizes how you might distribute your investments among these stocks for the best risk-return trade-off.",
        "Lastly, the table beneath provides a detailed look at the expected annual return and volatility of each individual stock and the optimal portfolio. It's a way to quantify the potential performance of each asset and the combined portfolio.",
    ]
};

export const popupTextDisclaimer = {
    title: "Disclaimer:",
    content: [
        "Nothing in this application is financial advice. Always conduct your own research and/or consult with a financial advisor before making any investment decisions.",
        "Think of this application as the 'magic 8-ball' of stock portfolios! While it might provide some interesting insights and inspiration, remember that building a portfolio is a bit more complex than shaking a toy for answers. This tool is designed to spark ideas and offer valuable insights, but it's not the 'end-all-be-all' of investment strategies. So, before you go all-in based on our suggestions, make sure to double-check your own research.",
    ]
};
  
from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf # for historical stock data
import numpy as np # for numerical operations
import pandas as pd # for data manipulation
from scipy.optimize import minimize # for optimization

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return jsonify({"message": "Welcome to OptiFolio API!"})

def fetch_stock_data(stocks):
    data = yf.download(stocks, start="2020-01-01", end="2023-01-01")['Adj Close']
    return data

def compute_portfolio_metrics(data):
    returns = data.pct_change().dropna()
    expected_returns = returns.mean()
    covariance_matrix = returns.cov()
    correlation_matrix = returns.corr()
    return expected_returns, covariance_matrix, correlation_matrix

def compute_optimal_portfolio(expected_returns, covariance_matrix, short=False):
    num_assets = len(expected_returns)
    args = (expected_returns, covariance_matrix)
    constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
    bound = (1 if short else 0, 1)
    bounds = tuple(bound for asset in range(num_assets))
    
    result = minimize(portfolio_volatility, num_assets*[1./num_assets,], args=args, method='SLSQP', bounds=bounds, constraints=constraints)
    return result.x

def portfolio_volatility(weights, expected_returns, covariance_matrix):
    return np.sqrt(np.dot(weights.T, np.dot(covariance_matrix, weights)))

@app.route('/api/compute-portfolio', methods=['POST'])
def compute_portfolio():
    stocks = request.json['stocks']
    if len(stocks) == 1:
        # If only one stock is selected, simply return a weight of 1 for it
        return jsonify({"weights": [1.0]})
    
    data = fetch_stock_data(stocks)
    expected_returns, covariance_matrix, _ = compute_portfolio_metrics(data)
    optimal_weights = compute_optimal_portfolio(expected_returns, covariance_matrix)
    return jsonify({"weights": optimal_weights.tolist()})

if __name__ == '__main__':
    app.run(debug=True)


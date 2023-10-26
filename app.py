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

def fetch_stock_data(stocks, start_date, end_date):
    # data = yf.download(stocks, start="2015-01-01", end="2023-01-01")['Adj Close']
    data = yf.download(stocks, start=start_date, end=end_date)['Adj Close']
    return data

def compute_portfolio_metrics(data):
    returns = data.pct_change().dropna()
    expected_returns = returns.mean() * 252
    covariance_matrix = returns.cov() * 252
    correlation_matrix = returns.corr()
    return expected_returns, covariance_matrix, correlation_matrix

def compute_optimal_portfolio(expected_returns, covariance_matrix, target_return=None, short=False):
    num_assets = len(expected_returns)
    args = (expected_returns, covariance_matrix)
    constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
    
    if target_return:
        constraints = (
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
            {'type': 'eq', 'fun': lambda x: target_return - np.dot(x, expected_returns)}
        )
    
    bound = (1 if short else 0, 1)
    bounds = tuple(bound for asset in range(num_assets))
    
    result = minimize(portfolio_performance, num_assets*[1./num_assets,], args=args, method='SLSQP', bounds=bounds, constraints=constraints)
    return result.x

def portfolio_performance(weights, expected_returns, covariance_matrix):
    port_return = np.dot(weights, expected_returns)
    port_volatility = np.sqrt(np.dot(weights.T, np.dot(covariance_matrix, weights)))
    sharpe_ratio = port_return / port_volatility
    return -sharpe_ratio  # negative for maximization

@app.route('/api/compute-portfolio', methods=['POST'])
def compute_portfolio():
    stocks = request.json['stocks']
    start_date = request.json['startDate']
    end_date = request.json['endDate']
    if len(stocks) == 1:
        return jsonify({"weights": [1.0], "frontier": []})

    data = fetch_stock_data(stocks, start_date, end_date)
    expected_returns, covariance_matrix, _ = compute_portfolio_metrics(data)
    
    min_return = min(expected_returns)
    max_return = max(expected_returns)
    target_returns = np.linspace(min_return, max_return, 12)  # 12 points on the frontier

    frontier = []
    for target in target_returns:
        weights = compute_optimal_portfolio(expected_returns, covariance_matrix, target)
        port_return = np.dot(weights, expected_returns)
        port_volatility = np.sqrt(np.dot(weights.T, np.dot(covariance_matrix, weights)))
        frontier.append({"return": port_return, "volatility": port_volatility})

    # Return weights for optimal (tangency) portfolio
    optimal_weights = compute_optimal_portfolio(expected_returns, covariance_matrix)

    # Tangency Portfolio (highest Sharpe ratio)
    tangency_portfolio = max(frontier, key=lambda x: x["return"] / x["volatility"])

    # Individual Stock Data
    individual_stocks = [{"name": stock, "return": expected_returns[stock], "volatility": (covariance_matrix[stock][stock])**0.5} for stock in stocks]

    # Minimum Variance Portfolio
    min_variance_portfolio = min(frontier, key=lambda x: x["volatility"])

    
    return jsonify({
        "weights": optimal_weights.tolist(), 
        "frontier": frontier, 
        "tangency": tangency_portfolio,
        "stocks": individual_stocks,
        "min_variance": min_variance_portfolio
    })

@app.route('/api/validate-stock', methods=['POST'])
def validate_stock():
    stock = request.json['stock']
    try:
        # Try fetching data for the last 7 days as validity check (because shortName did not work for some reason)
        data = yf.download(stock, period="7d")
        if data.empty:
            raise ValueError(f"No data available for {stock}")
        return jsonify({"valid": True, "message": f"{stock} is a valid stock."})
    except Exception as e:
        print(f"Error validating stock {stock}: {e}")
        return jsonify({"valid": False, "message": f"{stock} is not a valid stock."})

if __name__ == '__main__':
    app.run(debug=True)

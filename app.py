from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import yfinance as yf # for historical stock data
import numpy as np # for numerical operations
from scipy.optimize import minimize # for optimization
from datetime import datetime, timedelta
import xlsxwriter
from io import BytesIO
import openai
import os
api_key = os.environ.get("OPENAI_API_KEY")

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

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

    # If only one stock is selected, return a message
    if len(stocks) == 1:
        return jsonify({
            "message": "Portfolio calculations require more than one stock.",
        }), 400  # Return an error status

    try:
        data = fetch_stock_data(stocks, start_date, end_date)
    except Exception as e:
        return jsonify({
            "message": f"Error fetching data for stocks: {e}",
            "error": "Failed to retrieve historical data."
        }), 400  # Return an error status

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

from datetime import datetime, timedelta

@app.route('/api/check-daterange', methods=['POST'])
def check_date_range():
    stocks = request.json['stocks']
    start_date = datetime.strptime(request.json['startDate'], '%Y-%m-%d')
    end_date = datetime.strptime(request.json['endDate'], '%Y-%m-%d')
    missing_data_stocks = []
    
    for stock in stocks:
        data = yf.download(stock, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'), progress=False)
        data_start_date = data.index[0]
        data_end_date = data.index[-1]
        
        if abs((data_start_date - start_date).days) > 7 or abs((data_end_date - end_date).days) > 7:
            missing_data_stocks.append(stock)
            
    if missing_data_stocks:
        message = f"Stocks {', '.join(missing_data_stocks)} do not have continuous historical data for the entire specified date range."
        return jsonify({"valid": False, "message": message})
    else:
        return jsonify({"valid": True, "message": ""})

last_call_time = None  # To keep track of the last time the API was called

@app.route('/api/chat-gpt', methods=['POST'])
def chat_gpt():
    global last_call_time
    query = request.json['query']
    
    # Check rate limiting
    now = datetime.now()
    if last_call_time and (now - last_call_time).total_seconds() < 30:
        return jsonify({"error": "You can only make a request every 30 seconds."}), 429
    
    # Your OpenAI API Key
    openai.api_key = api_key
    
    # Create a detailed prompt here:
    user_message = request.json['query']
    context = "I want you to recommend/suggest publicly traded companies based on the message below. I want you to recommend/suggest multiple companies when relevant or requested and send them in a list, and always with the companies tickers following their respective names in parenthesis. The context is that the user is looking for suggestions of industries and/or companies to research further for possible investment purposes. This is the user message:"
    
    # Make the API call
    messages = [{"role": "system", "content": context}, {"role": "user", "content": user_message}]
    response = openai.ChatCompletion.create(model="gpt-4", messages=messages)
    
    last_call_time = datetime.now()
    return jsonify({"response": response.choices[0].message["content"].strip()})

@app.route('/api/get-stock-prices', methods=['POST'])
def get_stock_prices():
    print("Endpoint hit!")
    stocks = request.json['stocks']
    print("Fetching data for stocks:", stocks)
    try:
        data = yf.download(stocks, period="1d")['Adj Close'].iloc[-1]  # Last row for current prices
        print("Data fetched:", data.to_dict())
        return jsonify({"prices": data.to_dict()})
    except Exception as e:
        print("Error:", e)
        return jsonify({
            "message": f"Error fetching data for stocks: {e}",
            "error": "Failed to retrieve stock prices."
        }), 400

@app.route('/api/generate-excel', methods=['POST'])
def generate_excel():
    stocks = request.json['stocks']
    target_percentages = request.json['targetPercentages']
    target_shares = request.json['targetShares']
    current_shares = request.json['currentShares']
    shares_to_buy = request.json['sharesToBuy']

    # Create a workbook and add a worksheet.
    output = BytesIO()
    workbook = xlsxwriter.Workbook(output)
    worksheet = workbook.add_worksheet("Investment Plan")

    # Add table headers
    worksheet.write("A1", "Stocks")
    worksheet.write("B1", "Target Allocation (%)")
    worksheet.write("C1", "Target Allocation (shares)")
    worksheet.write("D1", "Current shares")
    worksheet.write("E1", "Shares to Buy")

    # Write data
    for i, stock in enumerate(stocks):
        print(len(stocks))
        print(len(target_percentages))
        print(len(target_shares))
        print(len(current_shares))
        print(len(shares_to_buy))

        if not all(len(lst) == len(stocks) for lst in [target_percentages, target_shares, current_shares, shares_to_buy]):
            return jsonify({"error": "Mismatch in input data lengths."}), 400

        worksheet.write(i + 1, 0, stock)
        worksheet.write(i + 1, 1, target_percentages[i])
        worksheet.write(i + 1, 2, target_shares[i])
        worksheet.write(i + 1, 3, current_shares[i])
        worksheet.write(i + 1, 4, shares_to_buy[i])

    workbook.close()
    output.seek(0)

    response = app.response_class(output.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response.headers['Content-Disposition'] = 'attachment; filename=OptiFolio Investment Plan.xlsx'
    return response

if __name__ == '__main__':
    app.run(debug=True)

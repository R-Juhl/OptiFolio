from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    # Instead of rendering an HTML template, you return JSON data.
    # For demonstration purposes, I'm just returning a simple message. 
    # In real-world scenarios, you might return relevant data.
    return jsonify({"message": "Welcome to OptiFolio API!"})

# API endpoint to compute optimal portfolio given a list of stock tickers
@app.route('/api/compute-portfolio', methods=['POST'])
def compute_portfolio():
    stocks = request.json['stocks']
    expected_returns, _, correlation_matrix = compute_portfolio_metrics(fetch_stock_data(stocks))
    optimal_weights = compute_optimal_portfolio(expected_returns, correlation_matrix, False)
    return jsonify({"weights": optimal_weights.tolist()})

if __name__ == '__main__':
    app.run(debug=True)

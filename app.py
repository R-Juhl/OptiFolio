
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/stock-selection')
def stock_selection():
    return render_template('stock_selection.html')

@app.route('/portfolio-optimization')
def portfolio_optimization():
    return render_template('portfolio_optimization.html')

@app.route('/report-generation')
def report_generation():
    return render_template('report_generation.html')

if __name__ == '__main__':
    app.run(debug=True)

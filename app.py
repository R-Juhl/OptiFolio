from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    # Instead of rendering an HTML template, you return JSON data.
    # For demonstration purposes, I'm just returning a simple message. 
    # In real-world scenarios, you might return relevant data.
    return jsonify({"message": "Welcome to OptiFolio API!"})

if __name__ == '__main__':
    app.run(debug=True)

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from transformers import pipeline
import google.generativeai as genai
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from googletrans import Translator
import re
import os
from datetime import timedelta
from waitress import serve  # Import Waitress

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Use environment variable for secret key (More secure in production)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "your_secret_key_here")

# Set session lifetime to 30 minutes
app.permanent_session_lifetime = timedelta(minutes=30)

# Initialize translator
translator = Translator()

# Load models with error handling
def load_model(pipeline_type, model_path):
    try:
        return pipeline(pipeline_type, model=model_path)
    except Exception as e:
        print(f"Error loading {pipeline_type} model from {model_path}: {e}")
        return None

sentiment_model = load_model("sentiment-analysis", "distilbert-base-uncased-finetuned-sst-2-english")
classifier_model = load_model("zero-shot-classification", "facebook/bart-large-mnli")

vader_classifier = SentimentIntensityAnalyzer()

# Configure Gemini Pro API securely
genai_api_key = os.getenv("GENAI_API_KEY","AIzaSyCA4-Pmug1UNb85sJrLN3xlXLNbPCIHIvc")
if not genai_api_key:
    raise ValueError("GENAI_API_KEY is not set. Please set it as an environment variable.")
    
genai.configure(api_key=genai_api_key)
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

# Helper Functions
def preprocess_text(text):
    """Clean and preprocess text for analysis."""
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def scale_sentiment(score, category):
    """Scale sentiment score to a star-based scale."""
    if category == "positive":
        return 5 if score >= 0.8 else 4 if score >= 0.6 else 3 if score >= 0.4 else 2 if score >= 0.2 else 1
    elif category == "negative":
        return 5 if score <= -0.8 else 4 if score <= -0.6 else 3 if score <= -0.4 else 2 if score <= -0.2 else 1
    return 3

def ensemble_sentiment_analysis(text):
    """Perform sentiment analysis using multiple models."""
    cleaned_text = preprocess_text(text)
    if sentiment_model is None:
        return {"sentiment": "unknown", "scale": 0}
    
    transformer_result = sentiment_model(cleaned_text)[0]
    transformer_compound = {"5 stars": 1.0, "4 stars": 0.7, "3 stars": 0.0, "2 stars": -0.7, "1 star": -1.0}.get(transformer_result['label'], 0.0)

    vader_result = vader_classifier.polarity_scores(cleaned_text)
    combined_score = 0.7 * transformer_compound + 0.3 * vader_result['compound']

    sentiment_class = "positive" if combined_score > 0.2 else "negative" if combined_score < -0.2 else "neutral"
    sentiment_scale = scale_sentiment(combined_score, sentiment_class)
    return {"sentiment": sentiment_class, "scale": sentiment_scale}

def classify_industry(text):
    """Classify the industry of the text using a pre-trained model."""
    if classifier_model is None:
        return "unknown"
    candidate_labels = ["finance", "medical", "e-commerce"]
    result = classifier_model(text, candidate_labels)
    return result["labels"][0]  # Return the top label

def translate_to_english(text, source_lang):
    """Translate text from a source language to English."""
    try:
        return translator.translate(text, src=source_lang, dest='en').text
    except Exception as e:
        print(f"Error in translation to English: {e}")
        return text

def translate_back_to_original(english_text, target_lang):
    """Translate text from English back to the original language."""
    try:
        return translator.translate(english_text, src='en', dest=target_lang).text
    except Exception as e:
        print(f"Error in translation to original language: {e}")
        return english_text

# Initialize escalation tracking
escalation_score = 0

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle incoming chat requests and provide responses."""
    global escalation_score

    # Initialize session for the user's chat history if not already set
    if 'chat_history' not in session:
        session['chat_history'] = []

    data = request.get_json()
    user_message = data.get('message', '')
    source_lang = data.get('sourceLang', 'en')  # Default to English if not provided

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        # Translate user message to English if necessary
        if source_lang != 'en':
            user_message = translate_to_english(user_message, source_lang)

        # Perform sentiment analysis and classification
        sentiment_result = ensemble_sentiment_analysis(user_message)
        classification_result = classify_industry(user_message)

        # Check for escalation
        if sentiment_result["sentiment"] == "negative":
            escalation_score += sentiment_result["scale"]
        
        if escalation_score > 10:
            return jsonify({"message": "Our telecaller will contact you shortly."})

        # Generate support context with additional restriction for phone calls
        support_context = f"""
        This is a customer support inquiry with {sentiment_result['sentiment']} sentiment.
        The primary category is {classification_result}.
        Please respond in a {sentiment_result['sentiment']} and professional tone.
        Do not request any PDF or file upload. Provide steps that are commonly followed across all platforms in the {classification_result} industry.
        If the customer asks for a phone number or to talk with someone on a call, do not promise a phone number. Simply respond with: "Our telecaller will connect with you soon."
        Chat history: {session['chat_history']}
        """

        # Prepare prompt for Gemini model
        prompt = f"""Context: {support_context}
        Customer message: {user_message}
        Response:"""

        # Generate response using Gemini model
        response = gemini_model.generate_content(prompt)

        # Translate response back to the original language if necessary
        response_text = response.text
        if source_lang != 'en':
            response_text = translate_back_to_original(response_text, source_lang)

        # Store the response in the chat history (session)
        session['chat_history'].append({"bot": response_text})

        return jsonify({"message": response_text})

    except Exception as e:
        return jsonify({"error": "An error occurred", "details": str(e)}), 500

@app.route('/api/end_chat', methods=['POST'])
def end_chat():
    """End the chat session, remove chat history, but keep escalation score."""
    session.pop('chat_history', None)  # Clear chat history from session
    return jsonify({"message": "Chat session ended and history cleared."})

# Use Waitress to serve the app in production
if __name__ == "__main__":
    try:
        port = int(os.environ.get("PORT", 8080))  # Render uses port 8080
        print(f"Starting Flask server on port {port}...")
        serve(app, host='0.0.0.0', port=port)
    except Exception as e:
        print(f"Error running the Flask app: {e}")

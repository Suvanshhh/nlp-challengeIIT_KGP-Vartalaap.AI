from transformers import pipeline
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import re
import nltk

# Download VADER lexicon
nltk.download('vader_lexicon')

class CustomerSupportSentiment:
    def __init__(self):
        try:
            # Replace with valid Hugging Face model or local path
            self.transformer_classifier = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
            print("Pipeline working")
        except Exception as e:
            raise ValueError(f"Error loading transformer model: {e}")
        
        # Initialize VADER
        self.vader_classifier = SentimentIntensityAnalyzer()
        
        # Customer support-specific patterns
        self.urgent_patterns = [
            r"urgent",
            r"emergency",
            r"asap",
            r"immediately",
            r"right now",
            r"critical"
        ]
        self.escalation_patterns = [
            r"speak.*manager",
            r"supervisor",
            r"complaint",
            r"unacceptable",
            r"frustrated",
            r"disappointed"
        ]

    def preprocess_text(self, text):
        """Clean and normalize input text."""
        text = text.lower()
        text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def needs_escalation(self, text, sentiment_score):
        """Determine if the issue needs escalation based on patterns and sentiment."""
        text = text.lower()
        is_urgent = any(re.search(pattern, text) for pattern in self.urgent_patterns)
        has_escalation_words = any(re.search(pattern, text) for pattern in self.escalation_patterns)
        return (sentiment_score <= -0.6) or has_escalation_words or is_urgent

    def analyze_support_query(self, text):
        """Analyze customer support query for sentiment and escalation needs."""
        cleaned_text = self.preprocess_text(text)
        try:
            transformer_result = self.transformer_classifier(cleaned_text)[0]
        except Exception as e:
            raise ValueError(f"Error during transformer sentiment analysis: {e}")

        transformer_score = {
            "POSITIVE": 1.0,
            "NEGATIVE": -1.0,
        }.get(transformer_result['label'], 0.0)

        vader_scores = self.vader_classifier.polarity_scores(cleaned_text)
        combined_score = (0.7 * transformer_score) + (0.3 * vader_scores['compound'])

        if combined_score > 0.2:
            sentiment = "positive"
            priority = "low"
        elif combined_score < -0.2:
            sentiment = "negative"
            priority = "high" if combined_score < -0.6 else "medium"
        else:
            sentiment = "neutral"
            priority = "medium"

        needs_escalation = self.needs_escalation(text, combined_score)

        return {
            "sentiment": sentiment,
            "priority": priority,
            "score": round(combined_score, 2),
            "needs_escalation": needs_escalation,
            "is_urgent": any(re.search(pattern, text.lower()) for pattern in self.urgent_patterns)
        }

# Initialize sentiment analyzer
try:
    sentiment_analyzer = CustomerSupportSentiment()
except ValueError as e:
    print(e)

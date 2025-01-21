from transformers import pipeline

class CustomerSupportClassifier:
    def __init__(self):
        try:
            # Replace with valid Hugging Face model or local path
            self.classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
            print("pipeline working")
        except Exception as e:
            raise ValueError(f"Error loading classifier model: {e}")
        
        # Define support categories and their descriptions
        self.categories = {
            "account": "Account-related issues, login problems, security",
            "billing": "Payment issues, refunds, charges, invoices",
            "technical": "Technical problems, errors, functionality issues",
            "product": "Product information, features, availability",
            "shipping": "Delivery status, shipping methods, tracking",
            "general": "General inquiries, information requests",
            "complaint": "Customer complaints, negative feedback",
            "urgent": "Emergency or time-sensitive issues"
        }

    def classify_support_query(self, text):
        """Classify customer support query into relevant categories"""
        try:
            # Get primary classification
            result = self.classifier(
                text,
                list(self.categories.keys()),
                multi_label=True
            )
            
            # Get top 2 categories
            top_categories = []
            for label, score in zip(result['labels'], result['scores']):
                if score > 0.3:  # Only include if confidence is above 30%
                    top_categories.append({
                        'category': label,
                        'description': self.categories[label],
                        'confidence': round(score * 100, 2)
                    })

            return {
                'primary_category': top_categories[0] if top_categories else None,
                'secondary_category': top_categories[1] if len(top_categories) > 1 else None,
                'all_categories': top_categories
            }
        except Exception as e:
            raise ValueError(f"Error during classification: {e}")

# Initialize classifier
support_classifier = CustomerSupportClassifier()

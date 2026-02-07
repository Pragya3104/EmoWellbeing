import os
import requests

HF_API_KEY = os.getenv("HF_API_KEY")
HF_URL = "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest"

headers = {
    "Authorization": f"Bearer {HF_API_KEY}",
    "Content-Type": "application/json"
}

def analyze_sentiment(text: str):
    try:
        payload = {"inputs": text}
        res = requests.post(HF_URL, headers=headers, json=payload, timeout=10)

        print("🚀 Status Code:", res.status_code)
        print("📩 Raw Response Text:", res.text)

        # If response is not JSON
        if not res.headers.get("content-type", "").startswith("application/json"):
            print("❌ Not a JSON response from HF!")
            return "NEUTRAL", 0.0

        data = res.json()

        # Handle HF errors
        if isinstance(data, dict) and data.get("error"):
            print("⚠ HF Error:", data["error"])
            return "NEUTRAL", 0.0

        # Expected format: [[{label, score}]]
        if isinstance(data, list) and len(data) > 0:
            result = data[0][0]
            label = result.get("label", "NEUTRAL")
            score = round(result.get("score", 0.0), 4)
            sentiment = "POSITIVE" if label.upper() == "POSITIVE" else "NEGATIVE"
            return sentiment, score

        return "NEUTRAL", 0.0

    except Exception as e:
        print("❌ Sentiment API Error:", e)
        return "NEUTRAL", 0.0

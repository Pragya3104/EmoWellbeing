import os
from .prompt import DETAILED_SYSTEM_PROMPT

try:
    from groq import Groq
except:
    Groq = None


# ----------- SELF-HARM CHECK -------------
def contains_self_harm(text: str) -> bool:
    text = text.lower()
    keywords = [
        "suicide", "kill myself", "self harm", "harm myself",
        "hurt myself", "end my life", "i want to die",
        "i don't want to live", "give up", "end it all"
    ]
    return any(kw in text for kw in keywords)


# ----------- INDIA CRISIS RESPONSE --------
CRISIS_RESPONSE_INDIA = (
    "It sounds like you're going through something very difficult.\n\n"
    "If you're thinking about harming yourself, please reach out immediately:\n"
    "📞 National Suicide Helpline India*: 14416\n"
    "📞 Aasra: +91 9820466726**\n"
    "📞 Snehi: +91 9582208181**\n\n"
    "You're not alone — help is available right now. ❤️"
)


# ----------- MAIN AI FUNCTION -------------
def generate_ai_reply(user_message: str):
    # 1) Self-harm immediate override
    if contains_self_harm(user_message):
        return CRISIS_RESPONSE_INDIA

    # 2) If Groq unavailable → fallback message
    if Groq is None or not os.getenv("GROQ_API_KEY"):
        return "I'm here with you. Tell me what’s on your mind."

    # 3) Call Groq LLM
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": DETAILED_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            max_tokens=300,
            temperature=0.7,
        )

        return res.choices[0].message.content

    except Exception as e:
        print("LLM ERROR:", e)
        return "I'm here for you. Tell me more about what you're feeling."

import google.generativeai as genai
from app.config import settings
import os

# Configure Gemini API
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

async def get_ai_response(prompt: str) -> str:
    """
    Generates a response from Gemini AI based on the user's prompt.
    """
    if not settings.GEMINI_API_KEY:
        return "AI is not configured. Please set GEMINI_API_KEY in the environment variables."

    try:
        # Use the Gemini Pro model
        model = genai.GenerativeModel('gemini-pro')
        
        # Generate content
        # We run this in a synchronous way because the library is sync, 
        # but in a real async app we might want to run this in a threadpool.
        # For now, since it's a simple call, it's acceptable.
        response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "I'm having trouble thinking right now. Please try again later."

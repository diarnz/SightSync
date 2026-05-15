import logging
import base64
from typing import Optional
from camb.client import AsyncCambAI
from camb.types import StreamTtsOutputConfiguration
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize the CambAI client
try:
    client = AsyncCambAI(api_key=settings.CAMBAI_API_KEY)
except Exception as e:
    logger.error(f"Failed to initialize Camb AI client: {e}")
    client = None

async def generate_speech_base64(text: str, voice_id: int = 147320) -> Optional[str]:
    """
    Generates speech for the given text using Camb AI API and returns a base64 encoded string.
    voice_id: default voice (you can pick one from Camb AI Studio)
    """
    if not client:
        logger.warning("Camb AI client is not initialized.")
        return None
        
    try:
        audio_generator = client.text_to_speech.tts(
            text=text,
            language="en-us",
            voice_id=voice_id,
            output_configuration=StreamTtsOutputConfiguration(format="wav")
        )
        
        # Accumulate the audio chunks
        audio_bytes = bytearray()
        async for chunk in audio_generator:
            audio_bytes.extend(chunk)
            
        return base64.b64encode(audio_bytes).decode('utf-8')
    except Exception as e:
        logger.error(f"Camb AI TTS failed: {e}")
        return None

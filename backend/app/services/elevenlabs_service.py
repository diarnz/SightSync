import logging
import base64
from elevenlabs.client import AsyncElevenLabs
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize the ElevenLabs client
try:
    client = AsyncElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
except Exception as e:
    logger.error(f"Failed to initialize ElevenLabs client: {e}")
    client = None

from typing import Optional

async def generate_speech_base64(text: str, voice_id: str = "JBFqnCBsd6RMkjVDRZzb") -> Optional[str]:
    """
    Generates speech for the given text using ElevenLabs API and returns a base64 encoded string.
    voice_id: default voice (you can pick one from ElevenLabs)
    """
    if not client:
        logger.warning("ElevenLabs client is not initialized.")
        return None
        
    try:
        # We use a fast model suitable for quick reads
        audio_generator = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_turbo_v2_5"
        )
        
        # Accumulate the audio chunks
        audio_bytes = bytearray()
        async for chunk in audio_generator:
            audio_bytes.extend(chunk)
            
        return base64.b64encode(audio_bytes).decode('utf-8')
    except Exception as e:
        logger.error(f"ElevenLabs TTS failed: {e}")
        return None

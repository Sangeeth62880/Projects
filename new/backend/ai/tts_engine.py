import os
import io
from typing import Optional

# Using gTTS (Google Text-to-Speech) - free and no API key required
# Install: pip install gTTS


class TTSEngine:
    """Text-to-speech synthesis engine using free Google TTS."""
    
    def __init__(self):
        self.gtts_available = False
        self._check_gtts()
    
    def _check_gtts(self):
        """Check if gTTS is available."""
        try:
            from gtts import gTTS
            self.gtts_available = True
        except ImportError:
            print("gTTS not installed. Run: pip install gTTS")
            self.gtts_available = False
    
    async def synthesize(
        self,
        text: str,
        voice: str = "child-friendly"
    ) -> bytes:
        """
        Convert text to speech audio using Google TTS (free).
        
        The text is preprocessed to add natural pauses for better speech flow.
        """
        
        # Preprocess text for more natural speech
        processed_text = self._add_natural_pauses(text)
        
        if self.gtts_available:
            try:
                from gtts import gTTS
                
                # Create TTS with slower speed for children
                tts = gTTS(
                    text=processed_text,
                    lang='en',
                    slow=True  # Slower pace for children
                )
                
                # Save to bytes buffer
                audio_buffer = io.BytesIO()
                tts.write_to_fp(audio_buffer)
                audio_buffer.seek(0)
                
                return audio_buffer.read()
                
            except Exception as e:
                print(f"gTTS error: {e}")
        
        # Fallback: signal frontend to use Web Speech API
        return self._create_fallback_signal()
    
    def _add_natural_pauses(self, text: str) -> str:
        """
        Add natural pauses to text for more pleasant speech.
        
        - Adds pauses after sentences
        - Adds pauses around emoji characters
        - Slows down numbers
        """
        import re
        
        # Add pause after periods, question marks, exclamation marks
        text = re.sub(r'([.!?])\s+', r'\1 ... ', text)
        
        # Add pause before and after emoji (represented by common patterns)
        # This helps the TTS not rush through visual elements
        text = re.sub(r'(\s)([🦖🐼🐰🦊🐶🐱🐻🦁🐯🐘🐵🦋🍎🥕🦴💰🥜🎈🍪🌟🌙☀️🌈🔴🔵🟢🟡🔢])', r'\1... \2 ...', text)
        
        # Add pauses around numbers for clarity
        text = re.sub(r'(\d+)', r'... \1 ...', text)
        
        # Clean up excessive pauses
        text = re.sub(r'(\.\.\.\s*)+', '... ', text)
        
        return text.strip()
    
    def _create_fallback_signal(self) -> bytes:
        """
        Return a special signal that tells the frontend to use 
        browser's Web Speech API instead.
        """
        # Return a minimal marker that frontend can detect
        return b'USE_WEB_SPEECH_API'

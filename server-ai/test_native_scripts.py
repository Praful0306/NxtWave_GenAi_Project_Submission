import httpx
import asyncio
import base64
import json
import sys
from app.providers.sarvam_stt import transcribe_sarvam

KEY = 'sk_vfbktqly_Pm47RhVLVNGr2VmQPUEZCqED'
TTS_URL = 'https://api.sarvam.ai/text-to-speech'


async def test_native():
    results = {}

    # 1. Hindi Speech Synthesis & STT
    tts_payload_hi = {
        'inputs': ['नमस्ते, मैं आज हिंदी सीख रहा हूँ'],
        'target_language_code': 'hi-IN',
        'speaker': 'aditya',
        'model': 'bulbul:v3'
    }
    async with httpx.AsyncClient() as client:
        r_hi = await client.post(TTS_URL, json=tts_payload_hi, headers={'api-subscription-key': KEY})
        audio_hi = base64.b64decode(r_hi.json()['audios'][0])
        res_hi = await transcribe_sarvam(audio_hi, 'hi.wav', 'hi-IN')
        results['hindi'] = res_hi

        # 2. Kannada Speech Synthesis & STT
        tts_payload_kn = {
            'inputs': ['ನಮಸ್ಕಾರ, ನಾನು ಕನ್ನಡ ಕಲಿಯುತ್ತಿದ್ದೇನೆ'],
            'target_language_code': 'kn-IN',
            'speaker': 'kavya',
            'model': 'bulbul:v3'
        }
        r_kn = await client.post(TTS_URL, json=tts_payload_kn, headers={'api-subscription-key': KEY})
        audio_kn = base64.b64decode(r_kn.json()['audios'][0])
        res_kn = await transcribe_sarvam(audio_kn, 'kn.wav', 'kn-IN')
        results['kannada'] = res_kn

    sys.stdout.buffer.write(json.dumps(results, ensure_ascii=False).encode('utf-8'))


if __name__ == '__main__':
    asyncio.run(test_native())

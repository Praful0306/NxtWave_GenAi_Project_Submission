"""
VaaniTutor — Tier 1 TTS: Sarvam AI Bulbul v3 WebSocket Streaming (server-ai).
Spec Section 6.2 & 6.3 (Tier 1: Primary Indic TTS).
Official Endpoint: wss://api.sarvam.ai/text-to-speech/ws
Headers: api-subscription-key: <key>
Latency design: Sub-250ms first-chunk WebSocket streaming across 10 Indian languages.
"""

import asyncio
import websockets
import json
import base64
from typing import Optional, Tuple, AsyncGenerator
from ..config import settings

PROVIDER_NAME = "sarvam-bulbul-v3-ws"
SARVAM_WS_URL = "wss://api.sarvam.ai/text-to-speech/ws"
DEFAULT_SPEAKER = "kavya"
TIER_TIMEOUT = 5.5  # 5-6s timeout per Spec Section 6.4


async def stream_sarvam_tts_chunks(
    text: str,
    language_code: str,
    speaker: str = DEFAULT_SPEAKER,
) -> AsyncGenerator[bytes, None]:
    """
    Stream audio chunks in real-time from Sarvam Bulbul v3 WebSocket endpoint.
    Yields decoded raw audio bytes per incoming frame.
    """
    keys = settings.sarvam_keys
    if not keys or not text.strip():
        return

    lang = language_code
    if "-" not in lang:
        lang = f"{lang}-IN"

    for key in keys:
        headers = {"api-subscription-key": key}
        try:
            async with websockets.connect(
                SARVAM_WS_URL,
                additional_headers=headers,
                open_timeout=3.0,
            ) as ws:
                # 1. Send configuration frame
                config_msg = {
                    "type": "config",
                    "data": {
                        "target_language_code": lang,
                        "speaker": speaker,
                        "model": "bulbul:v3",
                    },
                }
                await ws.send(json.dumps(config_msg))

                # 2. Send text frame
                text_msg = {
                    "type": "text",
                    "data": {
                        "text": text.strip(),
                    },
                }
                await ws.send(json.dumps(text_msg))

                # 3. Flush signal to finalize stream
                await ws.send(json.dumps({"type": "flush"}))

                # 4. Stream incoming audio chunks progressively
                stream_started = False
                while True:
                    try:
                        timeout = 0.35 if stream_started else TIER_TIMEOUT
                        raw_msg = await asyncio.wait_for(ws.recv(), timeout=timeout)
                        msg = json.loads(raw_msg)
                        msg_type = msg.get("type")

                        if msg_type == "audio":
                            audio_b64 = msg.get("data", {}).get("audio", "")
                            if audio_b64:
                                chunk = base64.b64decode(audio_b64)
                                stream_started = True
                                yield chunk
                        elif msg_type in ("done", "error", "close"):
                            break
                    except asyncio.TimeoutError:
                        if stream_started:
                            # Stream finished cleanly after all frames delivered
                            break
                        else:
                            # Timeout before first frame
                            break
                return

        except Exception as e:
            print(f"[WARN] Sarvam WebSocket TTS stream failed with key: {e}")

    return


async def synthesize_sarvam_tts(
    text: str,
    language_code: str,
    speaker: str = DEFAULT_SPEAKER,
) -> Optional[Tuple[bytes, str, str]]:
    """
    Synthesize complete speech via Sarvam Bulbul v3 WebSocket streaming.
    Aggregates streamed frames and returns (audio_bytes, content_type, provider_name).
    """
    chunks = []
    async for chunk in stream_sarvam_tts_chunks(text, language_code, speaker=speaker):
        chunks.append(chunk)

    if chunks:
        full_audio = b"".join(chunks)
        return (full_audio, "audio/wav", PROVIDER_NAME)

    return None

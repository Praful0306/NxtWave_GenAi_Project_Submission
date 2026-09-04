import asyncio
import struct
import math
import json
from app.providers.groq_stt import transcribe_groq
from app.providers import sarvam_stt
from app.providers.stt_router import transcribe_audio_chain


def make_wav_bytes(duration_sec=2, sample_rate=16000):
    num_samples = sample_rate * duration_sec
    wav = bytearray(
        b'RIFF' + struct.pack('<I', 36 + num_samples * 2) +
        b'WAVEfmt ' + struct.pack('<IHHIIHH', 16, 1, 1, sample_rate, sample_rate * 2, 2, 16) +
        b'data' + struct.pack('<I', num_samples * 2)
    )
    for i in range(num_samples):
        s = int(math.sin(2 * math.pi * 440 * (i / sample_rate)) * 16000)
        wav.extend(struct.pack('<h', s))
    return bytes(wav)


async def main():
    wav = make_wav_bytes()

    # 1. Direct Groq Whisper test
    groq_res = await transcribe_groq(wav, "sample.wav", "en-IN")

    # 2. Primary test: Sarvam is tried FIRST and succeeds
    primary_res = await transcribe_audio_chain(wav, "sample.wav", "audio/wav", "kn-IN")

    # 3. Fallback test 1: When Sarvam fails, router cascades to Zoho Zia (Tier 1)
    async def mock_fail_sarvam(*args, **kwargs):
        return None

    sarvam_stt.transcribe_sarvam = mock_fail_sarvam
    fallback_zia_res = await transcribe_audio_chain(wav, "sample.wav", "audio/wav", "en-IN")

    # 4. Fallback test 2: When Sarvam & Zia both fail, router cascades to Groq Whisper
    from app.providers import zoho_zia_stt
    async def mock_fail_zia(*args, **kwargs):
        return None

    zoho_zia_stt.transcribe_zoho_zia = mock_fail_zia
    fallback_groq_res = await transcribe_audio_chain(wav, "sample.wav", "audio/wav", "en-IN")

    output = {
        "groq_direct": groq_res,
        "primary_sarvam": primary_res,
        "fallback_zia": fallback_zia_res,
        "fallback_groq": fallback_groq_res,
    }
    print(json.dumps(output))


if __name__ == "__main__":
    asyncio.run(main())

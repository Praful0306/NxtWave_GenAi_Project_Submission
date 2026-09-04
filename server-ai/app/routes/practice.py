"""
VaaniTutor server-ai — Practice routes (frontend → server-ai).
Protected by user JWT (verify-only).
Spec Section 6.2, 6.4, 8.2 & 12.
"""

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Request
from ..auth import verify_user_jwt
from ..providers.stt_router import transcribe_audio_chain
from ..limiter import limiter

router = APIRouter(prefix="/api/practice", tags=["practice"])

MAX_AUDIO_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB cap (Spec Section 12)
ALLOWED_AUDIO_MIMES = {
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/ogg",
    "audio/mpeg",
    "audio/mp3",
    "application/octet-stream", # for certain browser blob uploads
}


@router.post("/transcribe")
@limiter.limit("30/minute")
async def transcribe_audio(
    request: Request,
    audio: UploadFile = File(..., description="Audio recording file (<= 15MB)"),
    languageCode: str = Form(..., description="Language code e.g. kn-IN, hi-IN, en-IN"),
    user: dict = Depends(verify_user_jwt),
):
    """
    Audio → transcript via the STT cascading chain (Spec Section 6.2 & 6.4).
    Validates 15MB file size cap and MIME type per Spec Section 12.
    Rate limited to 30 requests/minute.
    """
    # 1. MIME type validation
    content_type = audio.content_type or "audio/webm"
    base_mime = content_type.split(";")[0].strip().lower()

    if not base_mime.startswith("audio/") and base_mime not in ALLOWED_AUDIO_MIMES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported audio MIME type: {content_type}. Must be a valid audio format.",
        )

    # 2. Read audio payload and enforce 15MB size limit
    audio_bytes = await audio.read()
    if len(audio_bytes) > MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio file exceeds maximum 15MB size limit ({len(audio_bytes)} bytes).",
        )

    if len(audio_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty audio recording submitted.",
        )

    # 3. Transcribe using cascading STT provider chain
    result = await transcribe_audio_chain(
        audio_bytes=audio_bytes,
        filename=audio.filename or "recording.webm",
        mime_type=content_type,
        language_code=languageCode.strip(),
    )

    return result


from pydantic import BaseModel, Field
from ..providers.llm_router import evaluate_practice_utterance


class FeedbackRequest(BaseModel):
    targetSentence: str = Field(default="", description="Target practice sentence or prompt context")
    userTranscript: str = Field(..., description="Transcribed text spoken by the user")
    languageCode: str = Field(..., description="Target language code e.g. kn-IN, hi-IN, en-IN")
    userLevel: str = Field(default="beginner", description="User proficiency level")


@router.post("/feedback")
@limiter.limit("30/minute")
async def get_feedback(
    request: Request,
    payload: FeedbackRequest,
    user: dict = Depends(verify_user_jwt),
):
    """
    Transcript → structured assessment via the 7-tier LLM chain (Spec Section 6.5 & 6.9b).
    Strict 6-type Error Taxonomy: grammar, vocabulary, word_order, register, pronunciation_note, other.
    Returns: correctedText, errors, fluencyScore, encouragement, aiReply, providerUsed.
    Rate limited to 30 requests/minute.
    """
    if not payload.userTranscript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="userTranscript cannot be empty.",
        )

    assessment = await evaluate_practice_utterance(
        target_sentence=payload.targetSentence.strip(),
        user_transcript=payload.userTranscript.strip(),
        language_code=payload.languageCode.strip(),
        user_level=payload.userLevel.strip(),
    )

    return assessment


from fastapi.responses import StreamingResponse, Response
from ..providers.tts_router import synthesize_speech, stream_speech
import base64


class SpeakRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize to speech")
    languageCode: str = Field(..., description="Language code e.g. kn-IN, hi-IN, en-IN")
    speaker: str = Field(default="kavya", description="Voice speaker name for Sarvam Bulbul")
    pace: float = Field(default=1.0, description="Pace/speed modifier (0.5 to 2.0)")


@router.post("/speak")
@limiter.limit("30/minute")
async def text_to_speech(
    request: Request,
    payload: SpeakRequest,
    user: dict = Depends(verify_user_jwt),
):
    """
    Text → streamed audio via the TTS chain (Spec Section 6.2, 6.3, 6.7 & 8.2).
    Primary: Sarvam Bulbul v3 WebSocket stream (all Indian languages + English).
    Fallback: OpenAI TTS (strictly for English / en-IN only).
    Returns: Binary chunked audio stream (audio/wav or audio/mpeg) with custom X-Provider-Used header.
    Rate limited to 30 requests/minute.
    """
    if not payload.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="text cannot be empty.",
        )

    stream_res = await stream_speech(
        text=payload.text.strip(),
        language_code=payload.languageCode.strip(),
        speaker=payload.speaker,
    )

    if not stream_res:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Voice synthesis unavailable for language: {payload.languageCode}",
        )

    chunk_generator, content_type, provider = stream_res

    return StreamingResponse(
        chunk_generator,
        media_type=content_type,
        headers={
            "X-Provider-Used": provider,
            "Transfer-Encoding": "chunked",
            "Content-Disposition": f'inline; filename="speech.{content_type.split("/")[-1]}"',
        },
    )



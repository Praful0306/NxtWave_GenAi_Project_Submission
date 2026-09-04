import asyncio
import time
import websockets
import json
import os
from dotenv import load_dotenv

load_dotenv('.env')
key = os.getenv('SARVAM_API_KEYS', '').split(',')[0].strip()

async def probe():
    async with websockets.connect(
        'wss://api.sarvam.ai/text-to-speech/ws',
        additional_headers={'api-subscription-key': key}
    ) as ws:
        await ws.send(json.dumps({'type': 'config', 'data': {'target_language_code': 'hi-IN', 'speaker': 'kavya', 'model': 'bulbul:v3'}}))
        await ws.send(json.dumps({'type': 'text', 'data': {'text': 'नमस्ते, आप कैसे हैं?'}}))
        await ws.send(json.dumps({'type': 'flush'}))
        for i in range(15):
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=0.8)
                msg = json.loads(raw)
                data = msg.get('data', {})
                print(f"Msg {i+1}: type={msg.get('type')}, data_keys={list(data.keys()) if isinstance(data, dict) else type(data)}")
                if isinstance(data, dict):
                    for k, v in data.items():
                        if k != 'audio':
                            print(f"   {k}: {v}")
            except asyncio.TimeoutError:
                print('Stream finished (idle)')
                break

asyncio.run(probe())

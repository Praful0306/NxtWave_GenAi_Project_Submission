/**
 * VaaniTutor — Streaming Audio Latency Benchmarking Script
 * Measures wall-clock time to first audio chunk vs. total stream completion time.
 */

const axios = require('axios');
const http = require('http');
const https = require('https');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'vaanitutor-development-jwt-secret-key-32chars';
const AI_URL = 'http://127.0.0.1:8000';

// Generate a valid test JWT
const testUser = {
  userId: '67c7123456789abcdef01234',
  id: '67c7123456789abcdef01234',
  name: 'Latency Benchmark User',
  email: 'benchmark@vaanitutor.test',
  isVerified: true,
};


const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

async function measureStreamingLatency(text, languageCode) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text,
      languageCode,
      speaker: 'kavya',
    });

    const options = {
      hostname: '127.0.0.1',
      port: 8000,
      path: '/api/practice/speak',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const tStart = performance.now();
    let tFirstChunk = null;
    let tLastChunk = null;
    let chunkCount = 0;
    let totalBytes = 0;
    const chunkTimings = [];

    const req = http.request(options, (res) => {
      const provider = res.headers['x-provider-used'];

      res.on('data', (chunk) => {
        const now = performance.now();
        if (chunkCount === 0) {
          tFirstChunk = now;
        }
        chunkCount++;
        totalBytes += chunk.length;
        chunkTimings.push({
          chunkIndex: chunkCount,
          bytes: chunk.length,
          timeMs: (now - tStart).toFixed(1),
        });
      });

      res.on('end', () => {
        tLastChunk = performance.now();
        const firstChunkLatency = (tFirstChunk - tStart).toFixed(1);
        const totalDuration = (tLastChunk - tStart).toFixed(1);

        resolve({
          languageCode,
          provider,
          statusCode: res.statusCode,
          totalBytes,
          chunkCount,
          firstChunkLatencyMs: parseFloat(firstChunkLatency),
          totalDurationMs: parseFloat(totalDuration),
          leadTimeAdvantageMs: parseFloat((tLastChunk - tFirstChunk).toFixed(1)),
          chunkTimings,
        });
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function runBenchmark() {
  console.log('================================================================');
  console.log('    VAANITUTOR TTS STREAMING LATENCY & PLAYBACK BENCHMARK       ');
  console.log('================================================================\n');

  try {
    // 1. Hindi Utterance Benchmark
    console.log('Testing Hindi ("नमस्ते, आप कैसे हैं?"):');
    const hiResult = await measureStreamingLatency('नमस्ते, आप कैसे हैं?', 'hi-IN');
    console.log(`- Status: ${hiResult.statusCode}`);
    console.log(`- Provider: ${hiResult.provider}`);
    console.log(`- Total Chunks: ${hiResult.chunkCount} (${hiResult.totalBytes} bytes total)`);
    console.log(`- First Audio Frame Arrived: ${hiResult.firstChunkLatencyMs} ms from request dispatch`);
    console.log(`- Full Stream Completed: ${hiResult.totalDurationMs} ms`);
    console.log(`- User Playback Lead Time: Playback begins ${hiResult.leadTimeAdvantageMs} ms BEFORE download finishes!\n`);
    console.log('  Chunk Arrival Timeline:');
    hiResult.chunkTimings.forEach((c) => {
      console.log(`    Chunk ${c.chunkIndex}: ${c.bytes}B at +${c.timeMs}ms`);
    });

    console.log('\n----------------------------------------------------------------\n');

    // 2. Kannada Utterance Benchmark
    console.log('Testing Kannada ("ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ವಾಸಿಸುತ್ತೇನೆ ಮತ್ತು ಕನ್ನಡ ಕಲಿಯುತ್ತಿದ್ದೇನೆ."):');
    const knResult = await measureStreamingLatency('ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ವಾಸಿಸುತ್ತೇನೆ ಮತ್ತು ಕನ್ನಡ ಕಲಿಯುತ್ತಿದ್ದೇನೆ.', 'kn-IN');
    console.log(`- Status: ${knResult.statusCode}`);
    console.log(`- Provider: ${knResult.provider}`);
    console.log(`- Total Chunks: ${knResult.chunkCount} (${knResult.totalBytes} bytes total)`);
    console.log(`- First Audio Frame Arrived: ${knResult.firstChunkLatencyMs} ms from request dispatch`);
    console.log(`- Full Stream Completed: ${knResult.totalDurationMs} ms`);
    console.log(`- User Playback Lead Time: Playback begins ${knResult.leadTimeAdvantageMs} ms BEFORE download finishes!\n`);
    console.log('  Chunk Arrival Timeline:');
    knResult.chunkTimings.forEach((c) => {
      console.log(`    Chunk ${c.chunkIndex}: ${c.bytes}B at +${c.timeMs}ms`);
    });

    console.log('\n================================================================');
    console.log('    LATENCY BENCHMARK COMPLETED SUCCESSFULLY                    ');
    console.log('================================================================');
  } catch (err) {
    console.error('Benchmark error:', err);
  }
}

runBenchmark();

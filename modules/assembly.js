import dotenv from 'dotenv';
import { AssemblyAI } from 'assemblyai';

dotenv.config();

const client = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY
});

export async function transcribeAudio(fileUrl) {
    const data = {
        audio: fileUrl,
        language_code: 'de'
    };

    const transcript = await client.transcripts.transcribe(data);

    return transcript.text;
}
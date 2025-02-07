import ElevenLabs from "elevenlabs-node";
import dotenv from 'dotenv';
dotenv.config()

const voice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY
})

export async function convertTextToSpeech(text) {
    const fileName = "audio/output.mp3"

    try {
        const response = await voice.textToSpeech({ fileName, textInput: text });
        return response.status === "ok" ? fileName : null;
      } catch (error) {
        console.error("Error with text-to-speech conversion:", error);
        return null;
      }
}
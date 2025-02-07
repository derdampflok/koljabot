import dotenv from 'dotenv';
dotenv.config();
import { GatewayIntentBits } from 'discord-api-types/v10';
import { Events, Client } from 'discord.js';
import { joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import {
    createAudioResource,
    StreamType,
    AudioPlayerStatus,
    createAudioPlayer,
    EndBehaviorType,
} from '@discordjs/voice';
import prism from 'prism-media';
import { transcribeAudio } from './modules/assembly.js';
import fs from 'fs';

dotenv.config();

const INPUT_AUDIO_FILE_NAME = "./audio/input.wav"
const OUTPUT_AUDIO_FILE_NAME = "./audio/output.mp3"

const client = new Client({
  intents: [
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
  ],
});

client.on(Events.ClientReady, () => console.log("Ready!"));

client.on(Events.MessageCreate, async (message) => {
  console.log(`New message; ${message.content}`);
});

client.on(Events.Error, console.warn);

void client.login(process.env.DISCORD_TOKEN);

client.on(Events.MessageCreate, async (message) => {
  // Check if the message is the join command
  if (message.content.toLowerCase() === "!kolja") {
    // Check if user is in a voice channel
    const channel = message.member.voice.channel;
    if (channel) {
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      const receiver = connection.receiver;

      connection.on(VoiceConnectionStatus.Ready, () => {
        message.reply(`Joined voice channel: ${channel.name}!`);
        // Call a function that handles listening and responding to the user
        listenAndRespond(connection, receiver, message.author.id);
      });
    } else {
      message.reply("You need to join a voice channel first!");
    }
  }
});

async function listenAndRespond(connection, receiver, userId) {
    const audioStream = receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: 1000,
      },
    });

    const opusDecoder = new prism.opus.Decoder({
        rate: 48000,
        channels: 1
    })

    const outputStream = fs.createWriteStream("./audio/input.pcm");

    audioStream.pipe(opusDecoder).pipe(outputStream);

    audioStream.on('end', async () => {
        console.log("Stopped recording");
        outputStream.end()
        const inputText = await transcribeAudio(INPUT_AUDIO_FILE_NAME);
        console.log("transcribed audio", inputText);
    })

  }

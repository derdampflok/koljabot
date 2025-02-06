require("dotenv").config();
const { GatewayIntentBits } = require("discord-api-types/v10");
const { Events, Client } = require("discord.js");
const { joinVoiceChannel, VoiceConnectionStatus } = require("@discordjs/voice");
const {
    createAudioResource,
    StreamType,
    AudioPlayerStatus,
    createAudioPlayer,
    EndBehaviorType,
  } = require("@discordjs/voice");
const { AssemblyAI } = require("assemblyai");
const assemblyAi = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY })
const prism = require("prism-media")

const client = new Client({
  intents: [
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
  ],
});

const transcriber = assemblyAi.realtime.transcriber({
    sampleRate: 48000 //Match sample rate of discord audio
})

client.on(Events.ClientReady, () => console.log("Ready!"));

client.on(Events.MessageCreate, async (message) => {
  console.log(`New message; ${message.content}`);
});

client.on(Events.Error, console.warn);

void client.login(process.env.DISCORD_TOKEN);

client.on(Events.MessageCreate, async (message) => {
  // Check if the message is the join command
  if (message.content.toLowerCase() === "!kommran") {
    // Check if user is in a voice channel
    channel = message.member.voice.channel;
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
        listenAndRespond(connection, receiver, message);
      });
    } else {
      message.reply("You need to join a voice channel first!");
    }
  }
});

async function listenAndRespond(connection, receiver, message) {
    const audioStream = receiver.subscribe(message.author.id, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: 1000,
      },
    });

    transcriber.on("open", ({ sessionId }) => {
        console.log(`Real-time session opened with ID: ${sessionId}`);
      });
      
      transcriber.on("error", (error) => {
        console.error("Real-time transcription error:", error);
      });
      
      transcriber.on("close", (code, reason) => {
        console.log("Real-time session closed:", code, reason);
        // Process the final accumulated transcript here
      });
      
      var transcription = "";
      transcriber.on("transcript", (transcript) => {
        if (transcript.message_type === "FinalTranscript") {
          console.log("Final:", transcript.text);
          transcription += transcript.text + " "; // Append to the full message
        }
      });
      
      // Connect to the real-time transcription service
      await transcriber.connect();

      const opusDecoder = new prism.opus.Decoder({ reate: 48000, channels: 1 });
      audioStream.pipe(opusDecoder).on("data", (chunk) => {
        transcriber.sendAudio(chunk);
      })

      //Handle disconnection
      audioStream.on("end", async () => {
        await transcriber.close();
        console.log("Final text:", transcription);
      })
  }

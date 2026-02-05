import fs from "fs";
import path from "path";
import { Client, GatewayIntentBits, Collection, Partials } from "discord.js";
import "dotenv/config";

// === CONFIGURATION DU CLIENT ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,  // nécessaire pour lire le contenu
    GatewayIntentBits.DirectMessages   // nécessaire pour les DM
  ],
  partials: [Partials.Channel] // nécessaire pour collecter les messages en DM
});

client.commands = new Collection();

// === CHEMIN DU DOSSIER DES COMMANDES ===
const commandsPath = path.join(process.cwd(), "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

// === CHARGEMENT DES COMMANDES ===
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  client.commands.set(command.default.data.name, command.default);
  console.log(`✅ Commande chargée : ${command.default.data.name}`);
}

// === LOGIN ET READY ===
client.once("clientReady", () => {  // attention, l'événement correct est 'ready', pas 'clientReady'
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// === GESTION DES INTERACTIONS ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    if (!interaction.replied) {
      await interaction.reply({ content: "❌ Une erreur est survenue.", ephemeral: true });
    }
  }
});

// === LOGIN DU BOT ===
if (!process.env.DISCORD_TOKEN) {
  console.log("❌ DISCORD_TOKEN manquant dans .env");
  process.exit(1);
}
client.login(process.env.DISCORD_TOKEN);
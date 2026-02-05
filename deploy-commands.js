import fs from "fs";
import path from "path";
import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import "dotenv/config";

// === CONFIG ===
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // L'ID de ton bot
const GUILD_ID = process.env.GUILD_ID;   // L'ID du serveur de test (si tu veux tester juste sur un serveur)

// === Chargement des commandes ===
const commands = [];
const commandsPath = path.join(process.cwd(), "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  commands.push(command.default.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

// === Enregistrement des commandes sur ton serveur ===
(async () => {
  try {
    console.log(`⏳ Enregistrement de ${commands.length} commandes...`);
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), 
      { body: commands }
    );
    console.log("✅ Commandes enregistrées avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de l'enregistrement :", error);
  }
})();
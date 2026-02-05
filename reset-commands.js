import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import process from 'process';

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔍 Récupération de toutes les commandes globales...');
    const globalCommands = await rest.get(Routes.applicationCommands(CLIENT_ID));

    for (const cmd of globalCommands) {
      if (cmd.name === 'app' || cmd.name === 'commands') {
        console.log(`⚠️ Commande "${cmd.name}" ignorée (Entry Point Discord).`);
        continue;
      }
      console.log(`🗑️ Suppression de la commande globale "${cmd.name}"...`);
      await rest.delete(`${Routes.applicationCommands(CLIENT_ID)}/${cmd.id}`);
    }

    console.log('✅ Toutes les commandes globales supprimées (sauf Entry Point).');

    console.log('🧹 Suppression des commandes du serveur...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
    console.log('✅ Commandes du serveur supprimées !');

  } catch (err) {
    console.error('❌ Erreur :', err);
  }
})();
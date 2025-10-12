import fs from "fs";
import path from "path";
import {
  Client,
  GatewayIntentBits,
  Partials,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { REST } from "@discordjs/rest";
import "dotenv/config";

// === CONFIGURATION BOT ===
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN) {
  console.error("❌ Le token Discord n'est pas défini dans le .env !");
  process.exit(1);
}

if (!GUILD_ID) {
  console.error("❌ Le GUILD_ID n'est pas défini dans le .env !");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const rest = new REST({ version: "10" }).setToken(TOKEN);

// === DONNÉES ===
const dataFile = path.resolve("data.json");
let data = { tournois: [] };

function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, "utf8");
      data = JSON.parse(raw || "{}");
    }
  } catch (e) {
    console.error("Erreur lecture data.json :", e);
  }
}

function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// === EMOJIS DE NIVEAUX ===
const emojiLevels = {
  starter: ":starter:",
  "starter+": ":starter:",
  bronze: ":bronze:",
  argent: ":argent:",
  or: ":or:",
};

// === RÔLES AUTORISÉS ===
const rolesAutorises = [
  "MODÉRATEUR APTE",
  "MODÉRATEUR",
  "GERANT",
  "Assistance",
  "🛠STAFF🛠",
];

// === COMMANDES SLASH ===
const commands = [
  new SlashCommandBuilder()
    .setName("ajoutertournoi")
    .setDescription("➕ Ajouter un tournoi / Add a tournament")
    .addStringOption((opt) =>
      opt.setName("nom").setDescription("Nom du tournoi").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("categorie")
        .setDescription("Niveau du tournoi")
        .addChoices(
          { name: "Starter", value: "starter" },
          { name: "Starter +", value: "starter+" },
          { name: "Bronze", value: "bronze" },
          { name: "Argent", value: "argent" },
          { name: "Or", value: "or" }
        )
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("lien").setDescription("Lien du tournoi").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("joueurs_par_equipe")
        .setDescription("Nombre de joueurs par équipe")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("supprimertournoi")
    .setDescription("🗑️ Supprimer un tournoi / Delete a tournament")
    .addStringOption((opt) =>
      opt.setName("nom").setDescription("Nom du tournoi").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("listetournois")
    .setDescription("📋 Voir la liste des tournois / List all tournaments"),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("📘 Liste des commandes disponibles / List all available commands"),
];

// === ENREGISTREMENT DES COMMANDES ===
client.once("clientReady", async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
  loadData();

  try {
    console.log("⏳ Enregistrement des commandes slash...");
    await rest.put(Routes.applicationGuildCommands(client.application.id, GUILD_ID), {
      body: commands,
    });
    console.log("✅ Commandes enregistrées !");
  } catch (err) {
    console.error("❌ Erreur enregistrement commandes :", err);
  }
});

// === GESTION DES INTERACTIONS ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  const membre = interaction.member;
  const estStaff = membre.roles.cache.some((r) => rolesAutorises.includes(r.name));

  switch (commandName) {
    case "ajoutertournoi": {
      if (!estStaff)
        return interaction.reply({
          content: "❌ Vous n’avez pas la permission.",
          ephemeral: true,
        });

      const nom = interaction.options.getString("nom");
      const categorie = interaction.options.getString("categorie");
      const lien = interaction.options.getString("lien");
      const joueurs = interaction.options.getInteger("joueurs_par_equipe");

      data.tournois.push({ nom, categorie, lien, joueurs, equipes: [] });
      saveData();

      await interaction.reply({
        content: `✅ Tournoi **${nom}** ajouté (${emojiLevels[categorie]} ${categorie}) avec ${joueurs} joueurs par équipe.\n🔗 ${lien}`,
      });
      break;
    }

    case "supprimertournoi": {
      if (!estStaff)
        return interaction.reply({
          content: "❌ Seul le staff peut supprimer un tournoi.",
          ephemeral: true,
        });

      const nom = interaction.options.getString("nom");
      const index = data.tournois.findIndex((t) => t.nom.toLowerCase() === nom.toLowerCase());

      if (index === -1)
        return interaction.reply({ content: `❌ Aucun tournoi trouvé : ${nom}` });

      data.tournois.splice(index, 1);
      saveData();

      await interaction.reply(`🗑️ Tournoi **${nom}** supprimé.`);
      break;
    }

    case "listetournois": {
      if (data.tournois.length === 0)
        return interaction.reply("📭 Aucun tournoi enregistré.");

      const list = data.tournois
        .map((t) => `• ${t.nom} — ${emojiLevels[t.categorie]} ${t.categorie} — 🔗 ${t.lien}`)
        .join("\n");

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("📋 Liste des tournois / Tournament List")
        .setDescription(list);

      await interaction.reply({ embeds: [embed] });
      break;
    }

    case "help": {
      const embed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle("📘 Aide / Help")
        .setDescription(
          `🇫🇷 **Commandes principales :**\n- /ajoutertournoi\n- /supprimertournoi\n- /listetournois\n\n` +
            `🇬🇧 **Main commands:**\n- /addtournament\n- /deletetournament\n- /listtournaments`
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
      break;
    }
  }
});

// === LOGIN BOT ===
client.login(TOKEN);
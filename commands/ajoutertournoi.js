import fs from "fs";
import path from "path";
import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";

// 📁 Chemin absolu pour éviter les bugs de lecture/écriture
const DATA_PATH = path.join(process.cwd(), "data.json");

// 📊 Fonction pour charger les données
function loadData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, JSON.stringify({ tournois: {} }, null, 2));
    }
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ Erreur de lecture du fichier data.json :", err);
    return { tournois: {} };
  }
}

// 💾 Fonction pour sauvegarder les données
function saveData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
    console.log("✅ data.json mis à jour avec succès !");
    return true;
  } catch (err) {
    console.error("❌ Erreur d’écriture dans data.json :", err);
    return false;
  }
}

// ⚔️ Émojis de niveau personnalisés
const levelEmojis = {
  Starter: "<:starter:1394812812555194438>",
  "Starter +": "<:starter:1394812812555194438>",
  Bronze: "<:bronze:1394812856293261512>",
  Argent: "<:argent:1394812879458406420>",
  Or: "<:or:1394812904393543740>",
};

export default {
  data: new SlashCommandBuilder()
    .setName("ajoutertournoi")
    .setDescription("➕ Ajoute un tournoi dans la base de données / Add a tournament")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName("nom").setDescription("Nom du tournoi / Tournament name").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("date").setDescription("Date du tournoi / Tournament date").setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("lien")
        .setDescription("Lien du tournoi (doit être un lien https://)")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("joueurs")
        .setDescription("Nombre de joueurs par équipe / Players per team")
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("niveau")
        .setDescription("Niveau du tournoi / Tournament level")
        .setRequired(true)
        .addChoices(
          { name: "Starter", value: "Starter" },
          { name: "Starter +", value: "Starter +" },
          { name: "Bronze", value: "Bronze" },
          { name: "Argent", value: "Argent" },
          { name: "Or", value: "Or" }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const nom = interaction.options.getString("nom");
    const date = interaction.options.getString("date");
    const lien = interaction.options.getString("lien");
    const joueurs = interaction.options.getInteger("joueurs");
    const niveau = interaction.options.getString("niveau");

    // Validation du lien (doit commencer par http)
    if (!/^https?:\/\//i.test(lien)) {
      return interaction.editReply("❌ Le lien doit commencer par `http://` ou `https://`.");
    }

    // Chargement du fichier
    const data = loadData();

    if (!data.tournois) data.tournois = {};

    if (data.tournois[nom]) {
      return interaction.editReply(`⚠️ Le tournoi **${nom}** existe déjà !`);
    }

    // Création du tournoi
    data.tournois[nom] = {
      nom,
      date,
      lien,
      maxJoueurs: joueurs,
      niveau,
      equipes: {},
    };

    const success = saveData(data);
    if (!success) {
      return interaction.editReply("❌ Erreur lors de la sauvegarde du tournoi !");
    }

    const emoji = levelEmojis[niveau] || "⚔️";

    // 🇫🇷 Embed FR
    const embedFR = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`✅ Tournoi ajouté : ${nom}`)
      .setDescription(
        `${emoji} **${nom}** a été ajouté avec succès !\n\n` +
        `📅 **Date :** ${date}\n` +
        `👥 **Joueurs par équipe :** ${joueurs}\n` +
        `🔗 **Lien :** [Clique ici](${lien})`
      )
      .setFooter({ text: "Ajouté par " + interaction.user.username })
      .setTimestamp();

    // 🇬🇧 Embed EN
    const embedEN = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`✅ Tournament added: ${nom}`)
      .setDescription(
        `${emoji} **${nom}** has been successfully added!\n\n` +
        `📅 **Date:** ${date}\n` +
        `👥 **Players per team:** ${joueurs}\n` +
        `🔗 **Link:** [${lien}](${lien})`
      )
      .setFooter({ text: "Added by " + interaction.user.username })
      .setTimestamp();

    // Réponses
    await interaction.editReply({ embeds: [embedFR] });
    await interaction.channel.send({ embeds: [embedEN] });
  },
};
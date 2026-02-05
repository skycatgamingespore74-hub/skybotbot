import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import fs from "fs";

// Chargement des données
function loadData() {
  try {
    const data = fs.readFileSync("data.json", "utf8");
    return JSON.parse(data);
  } catch {
    return { tournois: {} };
  }
}

// Dictionnaire des émojis personnalisés
const emojisNiveaux = {
  "Starter": "<:starter:1394812812555194438>",
  "Bronze": "<:bronze:1394812856293261512>",
  "Argent": "<:argent:1394812879458406420>",
  "Or": "<:or:1394812904393543740>"
};

export default {
  data: new SlashCommandBuilder()
    .setName("listetournoi")
    .setDescription("📜 Affiche la liste complète des tournois / Show all tournaments"),

  async execute(interaction) {
    const data = loadData();
    const tournois = data.tournois;

    if (!tournois || Object.keys(tournois).length === 0) {
      return interaction.reply({
        content: "❌ Aucun tournoi n’a encore été créé.",
        ephemeral: true
      });
    }

    // Création de l’embed français
    const embedFR = new EmbedBuilder()
      .setColor(0x00aeff)
      .setTitle("📋 Liste des tournois")
      .setDescription("Voici tous les tournois actuellement disponibles :")
      .setTimestamp();

    // Création de l’embed anglais
    const embedEN = new EmbedBuilder()
      .setColor(0x00aeff)
      .setTitle("📋 Tournament List")
      .setDescription("Here are all the tournaments currently available:")
      .setTimestamp();

    // Ajout de chaque tournoi
    for (const [nom, tournoi] of Object.entries(tournois)) {
      const emoji = emojisNiveaux[tournoi.niveau] || "⚔️";
      const valueFR = `📅 **Date :** ${tournoi.date}\n👥 **Joueurs/équipe :** ${tournoi.maxJoueurs}\n🔗 [Lien du tournoi](${tournoi.lien})`;
      const valueEN = `📅 **Date:** ${tournoi.date}\n👥 **Players/team:** ${tournoi.maxJoueurs}\n🔗 [${tournoi.lien}](${tournoi.lien})`;

      embedFR.addFields({ name: `${emoji} ${nom}`, value: valueFR });
      embedEN.addFields({ name: `${emoji} ${nom}`, value: valueEN });
    }

    // Envoi des deux messages (FR + EN)
    await interaction.reply({ embeds: [embedFR] });
    await interaction.channel.send({ embeds: [embedEN] });
  }
};
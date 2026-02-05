import fs from 'fs';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// Emojis de niveau
const levelEmojis = {
  "Starter": "<:starter:1394812812555194438>",
  "Starter +": "<:starter:1394812812555194438>",
  "Bronze": "<:bronze:1394812856293261512>",
  "Argent": "<:argent:1394812879458406420>",
  "Or": "<:or:1394812904393543740>"
};

export default {
  data: new SlashCommandBuilder()
    .setName('detailtournoi')
    .setDescription('🔍 Affiche les détails d’un tournoi')
    .addStringOption(opt =>
      opt
        .setName('nom')
        .setDescription('Nom du tournoi')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!fs.existsSync('./data.json')) {
      return interaction.reply({ content: '❌ Aucun tournoi trouvé.', ephemeral: true });
    }

    const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
    const nom = interaction.options.getString('nom');
    const tournoi = data.tournois?.[nom];

    if (!tournoi) {
      return interaction.reply({ content: '⚠️ Tournoi introuvable.', ephemeral: true });
    }

    const emojiNiveau = levelEmojis[tournoi.niveau] || '❔';

    // Infos équipes
    const equipes = tournoi.equipes || {};
    const nbEquipes = Object.keys(equipes).length;

    let equipesText = 'Aucune équipe';
    if (nbEquipes > 0) {
      equipesText = Object.entries(equipes)
        .map(([nomEquipe, equipe]) => 
          `• **${nomEquipe}** (${equipe.joueurs.length}/${equipe.maxJoueurs})`
        )
        .join('\n');
    }

    const embed = new EmbedBuilder()
      .setTitle('🎯 Détails du tournoi')
      .setColor('#32CD32')
      .addFields(
        { name: ' Nom', value: tournoi.nom, inline: true },
        { name: '📅 Date', value: tournoi.date || 'Non définie', inline: true },
        { name: '🏆 Niveau', value: `${emojiNiveau} ${tournoi.niveau}`, inline: true },
        { name: '👥 Équipes', value: `${nbEquipes}`, inline: true },
        { name: '🔗 Lien', value: tournoi.lien || 'Aucun', inline: false },
        { name: '📋 Liste des équipes', value: equipesText, inline: false }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
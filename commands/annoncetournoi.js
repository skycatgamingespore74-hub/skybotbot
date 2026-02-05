import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from "discord.js";
import fs from "fs";

export default {
  data: new SlashCommandBuilder()
    .setName("annoncetournoi")
    .setDescription("📣 Publier une annonce de tournoi / Announce a tournament")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option
        .setName("nom")
        .setDescription("Nom du tournoi / Tournament name")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("niveau")
        .setDescription("Niveau du tournoi / Tournament level")
        .setRequired(true)
        .addChoices(
          { name: "Starter <:starter:1394812812555194438>", value: "starter" },
          { name: "Bronze <:bronze:1394812856293261512>", value: "bronze" },
          { name: "Argent <:argent:1394812879458406420>", value: "argent" },
          { name: "Or <:or:1394812904393543740>", value: "or" }
        )
    )
    .addStringOption(option =>
      option
        .setName("date")
        .setDescription("Date du tournoi / Tournament date")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("heure")
        .setDescription("Heure du tournoi / Tournament time")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("inscription")
        .setDescription("Date d’ouverture des inscriptions / Registration opening")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("format")
        .setDescription("Format du tournoi (ex: BO3 Power League)")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("lien")
        .setDescription("Lien du tournoi / Tournament link")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const nom = interaction.options.getString("nom");
    const niveau = interaction.options.getString("niveau");
    const date = interaction.options.getString("date");
    const heure = interaction.options.getString("heure");
    const inscription = interaction.options.getString("inscription");
    const format = interaction.options.getString("format");
    const lien = interaction.options.getString("lien");

    // Attribution des emojis selon le niveau
    const niveauEmoji = {
      starter: "<:starter:1394812812555194438>",
      bronze: "<:bronze:1394812856293261512>",
      argent: "<:argent:1394812879458406420>",
      or: "<:or:1394812904393543740>"
    }[niveau] || "🎮";

    // 🇫🇷 Embed français
    const embedFR = new EmbedBuilder()
      .setColor(0x00AEFF)
      .setTitle(`📣 ${nom} Tournament ${niveauEmoji}`)
      .setDescription(
        `🗓️ **Détails :**\n` +
          `- 📅 **Date :** ${date}\n` +
          `- ⏰ **Heure :** ${heure}\n` +
          `- 📝 **Inscriptions :** ${inscription}\n` +
          `- ⚔️ **Format :** ${format}\n\n` +
          `🏆 *Les tournois de niveau ${niveauEmoji} ne comportent pas de récompenses.*\n\n` +
          `🔗 **Tournoi :** ${lien}\n` +
          `💬 **Discord :** https://discord.gg/RskYTaMRAh`
      )
      .setFooter({ text: "Annonce FR 🇫🇷" })
      .setTimestamp();

    // 🇬🇧 Embed anglais
    const embedEN = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(`📣 ${nom} Tournament ${niveauEmoji}`)
      .setDescription(
        `OPEN TO EVERYONE!\n\n` +
          `📅 **Date:** ${date}\n` +
          `⏰ **Time:** ${heure} (UTC+2)\n` +
          `📝 **Registration:** ${inscription}\n` +
          `⚔️ **Format:** ${format}\n\n` +
          `🏆 *Unfortunately, beginner-level tournaments do not offer prizes.*\n\n` +
          `Tournament: ${lien}\n` +
          `Discord: https://discord.gg/RskYTaMRAh`
      )
      .setFooter({ text: "Announcement EN 🇬🇧" })
      .setTimestamp();

    // Canaux cibles
    const channelAnnonce = interaction.guild.channels.cache.find(
      c => c.name === "📣annonce-tournoi"
    );
    const channelPlanning = interaction.guild.channels.cache.find(
      c => c.name === "🗓️planning-tournois"
    );

    // Vérification
    if (!channelAnnonce || !channelPlanning) {
      return interaction.editReply(
        "❌ Impossible de trouver les salons #📣annonce-tournoi ou #🗓️planning-tournois."
      );
    }

    // Envoi dans #📣annonce-tournoi
    await channelAnnonce.send({
      content: "@Annonce tournoi",
      embeds: [embedFR, embedEN],
    });

    // Envoi dans #🗓️planning-tournois
    await channelPlanning.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00FF88)
          .setTitle(`📅 ${nom} — ${niveauEmoji}`)
          .setDescription(
            `**Date :** ${date}\n**Heure :** ${heure}\n**Niveau :** ${niveauEmoji}\n**Lien :** ${lien}`
          )
          .setFooter({ text: "Planning des tournois / Tournament Schedule" }),
      ],
    });

    await interaction.editReply(`✅ L'annonce du tournoi **${nom}** a été publiée !`);
  },
};
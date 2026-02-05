import fs from "fs";
import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("supprimertournoi")
    .setDescription("❌ Supprime un tournoi existant / Delete an existing tournament")
    .addStringOption(option =>
      option
        .setName("nom")
        .setDescription("Nom du tournoi à supprimer / Tournament name to delete")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const nomTournoi = interaction.options.getString("nom");
    let data = { tournois: {} };

    try {
      const raw = fs.readFileSync("data.json", "utf8");
      data = raw ? JSON.parse(raw) : { tournois: {} };
    } catch (error) {
      console.warn("⚠️ Erreur de lecture data.json. Nouveau fichier créé.");
    }

    if (!data.tournois[nomTournoi]) {
      const embedErreur = new EmbedBuilder()
        .setColor("Red")
        .setTitle("❌ Tournoi introuvable / Tournament not found")
        .setDescription(`🇫🇷 Aucun tournoi nommé **${nomTournoi}** trouvé.\n🇬🇧 No tournament named **${nomTournoi}** found.`);
      return interaction.reply({ embeds: [embedErreur], ephemeral: true });
    }

    delete data.tournois[nomTournoi];
    fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

    const embedSucces = new EmbedBuilder()
      .setColor("Red")
      .setTitle("🗑️ Tournoi supprimé / Tournament deleted")
      .setDescription(`🇫🇷 Le tournoi **${nomTournoi}** a été supprimé.\n🇬🇧 Tournament **${nomTournoi}** has been deleted.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embedSucces] });
  },
};
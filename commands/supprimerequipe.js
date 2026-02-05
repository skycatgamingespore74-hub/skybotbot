import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import fs from "fs";

const DATA_FILE = "data.json";

// 🔹 Fonctions pour gérer le fichier data.json
function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return raw ? JSON.parse(raw) : { tournois: {} };
  } catch {
    return { tournois: {} };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export default {
  data: new SlashCommandBuilder()
    .setName("supprimerequipe")
    .setDescription("🗑️ Supprime une équipe avec mot de passe / Delete a team with password")
    .addStringOption(option =>
      option.setName("tournoi").setDescription("Nom du tournoi / Tournament name").setRequired(true)
    ),

  async execute(interaction) {
    const tournoiNom = interaction.options.getString("tournoi");
    const user = interaction.user;
    const data = loadData();
    const tournoi = data.tournois[tournoiNom];

    if (!tournoi) {
      return interaction.reply({ content: `❌ Tournoi introuvable / Tournament not found: ${tournoiNom}`, ephemeral: true });
    }

    // ✅ Déférer l'interaction pour éviter Unknown Interaction
    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    try {
      const dm = await user.createDM();
      const filter = m => m.author.id === user.id;

      // 1️⃣ Demander le nom de l'équipe
      await dm.send(
        `🇫🇷 **Suppression d’équipe pour le tournoi ${tournoiNom}**\nEntre le **nom de ton équipe** :\n` +
        `🇬🇧 **Team deletion for tournament ${tournoiNom}**\nEnter your **team name**:`
      );

      const teamNameMsg = await dm.awaitMessages({ filter, max: 1, time: 120000, errors: ["time"] }).catch(() => null);
      const teamName = teamNameMsg?.first()?.content?.trim();

      if (!teamName) return dm.send("❌ Temps écoulé ou aucun nom fourni / Time expired or no team name provided.");

      // 2️⃣ Demander le mot de passe
      await dm.send("🔐 Entre maintenant le **mot de passe de ton équipe** / Enter your **team password**:");
      const passMsg = await dm.awaitMessages({ filter, max: 1, time: 120000, errors: ["time"] }).catch(() => null);
      const password = passMsg?.first()?.content?.trim();

      if (!password) return dm.send("❌ Temps écoulé ou aucun mot de passe fourni / Time expired or no password provided.");

      // 3️⃣ Vérifier que l'équipe existe et que le mot de passe correspond
      if (!tournoi.equipes || !tournoi.equipes[teamName]) {
        return dm.send("❌ Aucune équipe trouvée avec ce nom / No team found with that name.");
      }

      if (tournoi.equipes[teamName].password !== password) {
        return dm.send("❌ Mot de passe incorrect / Wrong password.");
      }

      // 4️⃣ Supprimer l'équipe
      delete tournoi.equipes[teamName];
      saveData(data);

      const confirmEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("✅ Équipe supprimée / Team deleted")
        .setDescription(
          `🇫🇷 L’équipe **${teamName}** a été supprimée du tournoi **${tournoiNom}**.\n` +
          `🇬🇧 Team **${teamName}** has been deleted from tournament **${tournoiNom}**.`
        )
        .setTimestamp();

      await dm.send({ embeds: [confirmEmbed] });
      await interaction.editReply({ content: "✅ Suppression confirmée en DM / Deletion confirmed in DM." });
    } catch (err) {
      console.error("Erreur lors de la suppression d'équipe :", err);
      try { await interaction.editReply({ content: "❌ Une erreur est survenue. Vérifie tes DM / An error occurred." }); } catch {}
    }
  },
};
import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } from "discord.js";
import fs from "fs";

const DATA_FILE = "./data.json";

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ tournois: {} }, null, 2));
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return raw ? JSON.parse(raw) : { tournois: {} };
  } catch {
    return { tournois: {} };
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName("annoncegagnant")
    .setDescription("📢 Annonce l'équipe gagnante d'un tournoi"),

  async execute(interaction) {
    const data = loadData();
    const tournois = Object.keys(data.tournois);

    if (tournois.length === 0) {
      return interaction.reply({ content: "❌ Aucun tournoi trouvé.", ephemeral: true });
    }

    // Menu pour choisir le tournoi
    const menuTournoi = new StringSelectMenuBuilder()
      .setCustomId("select_tournoi")
      .setPlaceholder("Sélectionne un tournoi")
      .addOptions(tournois.map(t => ({ label: t, value: t })));

    await interaction.reply({ content: "Choisis le tournoi :", components: [new ActionRowBuilder().addComponents(menuTournoi)], ephemeral: true });

    const collectorTournoi = interaction.channel.createMessageComponentCollector({ componentType: 3, time: 60000 });

    collectorTournoi.on("collect", async i => {
      try {
        if (i.user.id !== interaction.user.id) return i.reply({ content: "❌ Ce menu n'est pas pour toi.", ephemeral: true });

        await i.deferUpdate(); // ACK immédiat

        const tournoiNom = i.values[0];
        const tournoi = data.tournois[tournoiNom];
        if (!tournoi || !tournoi.equipes || Object.keys(tournoi.equipes).length === 0) {
          return interaction.followUp({ content: "❌ Aucune équipe dans ce tournoi.", ephemeral: true });
        }

        // Menu pour choisir l'équipe gagnante
        const menuEquipe = new StringSelectMenuBuilder()
          .setCustomId("select_equipe")
          .setPlaceholder("Sélectionne l'équipe gagnante")
          .addOptions(Object.keys(tournoi.equipes).map(eq => ({ label: eq, value: eq })));

        await interaction.followUp({ content: `Tournoi sélectionné : **${tournoiNom}**. Choisis l'équipe gagnante :`, components: [new ActionRowBuilder().addComponents(menuEquipe)], ephemeral: true });

        const collectorEquipe = interaction.channel.createMessageComponentCollector({ componentType: 3, time: 60000 });

        collectorEquipe.on("collect", async i2 => {
          try {
            if (i2.user.id !== interaction.user.id) return i2.reply({ content: "❌ Ce menu n'est pas pour toi.", ephemeral: true });

            await i2.deferUpdate(); // ACK immédiat

            const teamName = i2.values[0];
            const team = tournoi.equipes[teamName];

            const joueurs = team.joueurs?.length
              ? team.joueurs.map(j => j || "Aucun")
              : ["Aucun"];

            const messageFR = `🇫🇷 @FR
L'équipe gagnante du tournoi est **${teamName}**.
Avec les joueurs :
- ${joueurs.join("\n- ")}
N'hésitez pas à les applaudir 👏`;

            const messageEN = `🇬🇧 @EN
The winning team of the tournament is **${teamName}**.
With the players:
- ${joueurs.join("\n- ")}
@everyone`;

            await interaction.channel.send(`${messageFR}\n\n${messageEN}`);
          } catch (err) {
            console.error("Erreur lors de l'annonce de l'équipe gagnante:", err);
          }
        });

      } catch (err) {
        console.error("Erreur lors de la sélection du tournoi:", err);
      }
    });
  },
};

// =================== Protection anti-crash globale ===================
process.on("unhandledRejection", err => console.error("Unhandled Rejection:", err));
process.on("uncaughtException", err => console.error("Uncaught Exception:", err));
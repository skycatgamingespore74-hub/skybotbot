import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from "discord.js";
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
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function findTournament(data, name) {
  if (!data || !data.tournois) return null;
  if (data.tournois[name]) return { key: name, tournoi: data.tournois[name] };
  const lower = name.toLowerCase();
  for (const k of Object.keys(data.tournois)) if (k.toLowerCase() === lower) return { key: k, tournoi: data.tournois[k] };
  return null;
}

export default {
  data: new SlashCommandBuilder()
    .setName("inscriptionjoueur")
    .setDescription("🎮 Envoie l'embed Rejoindre équipe (admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt => opt.setName("tournoi").setDescription("Nom du tournoi").setRequired(true)),

  async execute(interaction) {
    const tournoiNomInput = interaction.options.getString("tournoi");
    const data = loadData();
    const found = findTournament(data, tournoiNomInput);
    if (!found) return interaction.reply({ content: `❌ Le tournoi ${tournoiNomInput} n'existe pas.`, ephemeral: true });
    const tournoiKey = found.key;
    const tournoiObj = found.tournoi;

    const embed = new EmbedBuilder()
      .setColor(0x7bd389)
      .setTitle(`🎮 Rejoindre une équipe — ${tournoiKey}`)
      .setDescription("🇫🇷 Clique sur **Rejoindre équipe** pour recevoir un DM et t'inscrire.\n\n🇬🇧 Click **Join Team** to get a DM and register.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`rejoindre_equipe::${tournoiKey}`).setLabel("Rejoindre équipe / Join Team").setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ content: `✅ Embed Rejoindre équipe envoyé pour ${tournoiKey}`, ephemeral: true });
    const message = await interaction.channel.send({ embeds: [embed], components: [row] });

    const collector = message.createMessageComponentCollector({ time: 0 });
    collector.on("collect", async i => {
      await i.deferUpdate().catch(() => {});
      const custom = i.customId;
      const [action, tournoiKeyFromId] = custom.split("::");
      if (action !== "rejoindre_equipe") return;

      const user = i.user;
      const freshData = loadData();
      const foundT = findTournament(freshData, tournoiKeyFromId);
      if (!foundT) {
        try { await user.send("❌ Le tournoi n'existe plus."); } catch {}
        return;
      }
      const tournoiObj2 = foundT.tournoi;

      try {
        const dm = await user.createDM();
        await dm.send(`🎮 Inscription pour **${tournoiKeyFromId}**.\n🇫🇷 Entre le nom de l'équipe :\n🇬🇧 Enter the team name:`);
        const collectedName = await dm.awaitMessages({ max: 1, time: 60000 });
        const teamName = collectedName.first()?.content?.trim();
        if (!teamName) return dm.send("⏰ Temps écoulé. Recommence.");

        if (!tournoiObj2.equipes) return dm.send("❌ Aucune équipe n'existe pour ce tournoi.");

        let teamKey = null;
        for (const k of Object.keys(tournoiObj2.equipes)) if (k.toLowerCase() === teamName.toLowerCase()) { teamKey = k; break; }
        if (!teamKey) return dm.send("❌ Cette équipe n'existe pas.");

        await dm.send("🔐 Entre le mot de passe de l'équipe / Enter the team password:");
        const collectedPass = await dm.awaitMessages({ max: 1, time: 60000 });
        const pass = collectedPass.first()?.content?.trim();
        if (!pass) return dm.send("⏰ Temps écoulé. Recommence.");

        const teamObj = tournoiObj2.equipes[teamKey];
        if (teamObj.password !== pass) return dm.send("❌ Mot de passe incorrect / Wrong password.");

        const playerTag = `${user.username}#${user.discriminator}`;
        if (!teamObj.joueurs) teamObj.joueurs = [];
        const maxJ = teamObj.maxJoueurs || tournoiObj2.maxJoueurs || 3;
        if (teamObj.joueurs.includes(playerTag)) return dm.send("⚠️ Tu es déjà inscrit dans cette équipe !");
        if (teamObj.joueurs.length >= maxJ) return dm.send("🚫 Cette équipe est complète !");

        teamObj.joueurs.push(playerTag);
        saveData(freshData);

        await dm.send(`✅ Tu as rejoint **${teamKey}** pour **${tournoiKeyFromId}** !`);
        await message.channel.send(`🎉 ${playerTag} a rejoint **${teamKey}** dans **${tournoiKeyFromId}** !`);

        // DM to chef
        if (teamObj.chefId) {
          try {
            const chef = await i.client.users.fetch(teamObj.chefId);
            await chef.send(`📢 ${playerTag} vient de rejoindre ton équipe **${teamKey}** pour **${tournoiKeyFromId}** !`);
          } catch (err) {
            console.warn("Impossible d'envoyer un DM au chef:", err);
          }
        }
      } catch (err) {
        console.error("inscriptionjoueur DM flow:", err);
        try { await i.user.send("❌ Erreur lors de l'inscription. Vérifie tes DM."); } catch {}
      }
    });
  },
};
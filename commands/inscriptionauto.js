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
  for (const k of Object.keys(data.tournois)) {
    if (k.toLowerCase() === lower) return { key: k, tournoi: data.tournois[k] };
  }
  return null;
}

export default {
  data: new SlashCommandBuilder()
    .setName("inscriptionauto")
    .setDescription("📋 Envoie les deux embeds : créer équipe + rejoindre équipe (admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt => opt.setName("tournoi").setDescription("Nom du tournoi").setRequired(true)),

  async execute(interaction) {
    const tournoiNomInput = interaction.options.getString("tournoi");
    const data = loadData();
    const found = findTournament(data, tournoiNomInput);
    if (!found) {
      return interaction.reply({ content: `❌ Le tournoi **${tournoiNomInput}** n'existe pas.`, ephemeral: true });
    }
    const tournoiKey = found.key;
    const tournoi = found.tournoi;

    const embedChef = new EmbedBuilder()
      .setColor(0xffd166)
      .setTitle(`👑 Créer une équipe — ${tournoiKey}`)
      .setDescription(
        "🇫🇷 Si tu veux créer une équipe, clique sur **Créer équipe**. Le bot te contactera en DM pour le nom et le mot de passe.\n\n" +
        "🇬🇧 If you want to create a team, click **Create Team**. The bot will DM you asking for the team name and password."
      );

    const embedJoueur = new EmbedBuilder()
      .setColor(0x7bd389)
      .setTitle(`🎮 Rejoindre une équipe — ${tournoiKey}`)
      .setDescription(
        "🇫🇷 Si tu veux rejoindre une équipe, clique sur **Rejoindre équipe**. Le bot te contactera en DM pour le nom de l'équipe et le mot de passe.\n\n" +
        "🇬🇧 If you want to join a team, click **Join Team**. The bot will DM you asking for the team name and password."
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`creer_equipe::${tournoiKey}`).setLabel("Créer équipe / Create Team").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`rejoindre_equipe::${tournoiKey}`).setLabel("Rejoindre équipe / Join Team").setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ content: `✅ Message d’inscription pour **${tournoiKey}** publié.`, ephemeral: true });
    const message = await interaction.channel.send({ embeds: [embedChef, embedJoueur], components: [row] });

    const collector = message.createMessageComponentCollector({ time: 0 });

    collector.on("collect", async i => {
      // acknowledge quickly to avoid "Échec de l'interaction"
      await i.deferUpdate().catch(() => {});

      const custom = i.customId;
      const [action, tournoiKeyFromId] = custom.split("::");
      const user = i.user;

      // reload data fresh each interaction
      const freshData = loadData();
      const foundT = findTournament(freshData, tournoiKeyFromId);
      if (!foundT) {
        try { await user.send("❌ Le tournoi n'existe plus ou a été supprimé."); } catch {}
        return;
      }
      const tournoiObj = foundT.tournoi;

      // DM flow for creating team
      if (action === "creer_equipe") {
        try {
          const dm = await user.createDM();
          await dm.send(`👑 Tu as choisi de créer une équipe pour **${tournoiKeyFromId}**.\n🇫🇷 Entre le nom de ton équipe :\n🇬🇧 Enter your team name:`);
          const collectedName = await dm.awaitMessages({ max: 1, time: 60000 });
          const teamName = collectedName.first()?.content?.trim();
          if (!teamName) return dm.send("⏰ Temps écoulé. Recommence en cliquant sur Créer équipe.");

          // check team existence (case-insensitive)
          if (!tournoiObj.equipes) tournoiObj.equipes = {};
          const exists = Object.keys(tournoiObj.equipes).some(k => k.toLowerCase() === teamName.toLowerCase());
          if (exists) return dm.send("❌ Une équipe avec ce nom existe déjà. Choisis un autre nom.");

          await dm.send("🔐 Maintenant choisis un mot de passe pour ton équipe / Now choose a password for your team:");
          const collectedPass = await dm.awaitMessages({ max: 1, time: 60000 });
          const pass = collectedPass.first()?.content?.trim();
          if (!pass) return dm.send("⏰ Temps écoulé. Recommence en cliquant sur Créer équipe.");

          // create team: store both chefId (for DM) and chefTag for display, store joueurs as tags
          const chefId = user.id;
          const chefTag = `${user.username}#${user.discriminator}`;

          const maxJ = tournoiObj.maxJoueurs || 3;
          tournoiObj.equipes[teamName] = {
            password: pass,
            chefId,
            chefTag,
            joueurs: [chefTag],
            maxJoueurs: maxJ
          };

          saveData(freshData);

          await dm.send(`✅ Équipe **${teamName}** créée pour **${tournoiKeyFromId}** !\nChef : ${chefTag}\nMax joueurs : ${maxJ}`);
          // public announcement of team creation
          await message.channel.send(`🆕 Équipe **${teamName}** créée par **${chefTag}** pour **${tournoiKeyFromId}** !`);
        } catch (err) {
          console.error("creer_equipe DM error:", err);
          try { await user.send("❌ Une erreur est survenue. Vérifie que tes DM sont ouverts."); } catch {}
        }
      }

      // DM flow for joining team
      if (action === "rejoindre_equipe") {
        try {
          const dm = await user.createDM();
          await dm.send(`🎮 Tu veux rejoindre une équipe pour **${tournoiKeyFromId}**.\n🇫🇷 Entre le nom de l'équipe :\n🇬🇧 Enter the team name:`);
          const collectedName = await dm.awaitMessages({ max: 1, time: 60000 });
          const teamName = collectedName.first()?.content?.trim();
          if (!teamName) return dm.send("⏰ Temps écoulé. Recommence en cliquant sur Rejoindre équipe.");

          if (!tournoiObj.equipes) return dm.send("❌ Aucune équipe n'a encore été créée pour ce tournoi.");

          // find team case-insensitive
          let teamKey = null;
          for (const k of Object.keys(tournoiObj.equipes)) { if (k.toLowerCase() === teamName.toLowerCase()) { teamKey = k; break; } }
          if (!teamKey) return dm.send("❌ Cette équipe n'existe pas. Vérifie le nom exact.");

          await dm.send("🔐 Entre le mot de passe de l'équipe / Enter the team password:");
          const collectedPass = await dm.awaitMessages({ max: 1, time: 60000 });
          const pass = collectedPass.first()?.content?.trim();
          if (!pass) return dm.send("⏰ Temps écoulé. Recommence en cliquant sur Rejoindre équipe.");

          const teamObj = tournoiObj.equipes[teamKey];
          if (teamObj.password !== pass) return dm.send("❌ Mot de passe incorrect / Wrong password.");

          // players are stored as tags
          const playerTag = `${user.username}#${user.discriminator}`;
          if (!teamObj.joueurs) teamObj.joueurs = [];
          const maxJ = teamObj.maxJoueurs || tournoiObj.maxJoueurs || 3;
          if (teamObj.joueurs.includes(playerTag)) return dm.send("⚠️ Tu es déjà inscrit dans cette équipe !");
          if (teamObj.joueurs.length >= maxJ) return dm.send("🚫 Cette équipe est déjà complète !");

          teamObj.joueurs.push(playerTag);
          saveData(freshData);

          await dm.send(`✅ Tu as été ajouté à **${teamKey}** pour **${tournoiKeyFromId}** !`);
          await message.channel.send(`🎉 ${playerTag} vient de rejoindre **${teamKey}** dans **${tournoiKeyFromId}** !`);

          // notify chef by DM (if chefId exists)
          if (teamObj.chefId) {
            try {
              const chefUser = await i.client.users.fetch(teamObj.chefId);
              await chefUser.send(`📢 Un joueur (${playerTag}) a rejoint ton équipe **${teamKey}** pour le tournoi **${tournoiKeyFromId}** !`);
            } catch (err) {
              console.warn("Could not DM chef:", err);
            }
          }
        } catch (err) {
          console.error("rejoindre_equipe DM error:", err);
          try { await user.send("❌ Une erreur est survenue. Vérifie que tes DM sont ouverts."); } catch {}
        }
      }
    });
  },
};
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
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ tournois: {} }, null, 2));
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return raw ? JSON.parse(raw) : { tournois: {} };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function findTournament(data, name) {
  if (!data || !data.tournois) return null;
  const lower = name.toLowerCase();
  for (const k of Object.keys(data.tournois)) {
    if (k.toLowerCase() === lower) return { key: k, tournoi: data.tournois[k] };
  }
  return null;
}

export default {
  data: new SlashCommandBuilder()
    .setName("inscriptionchef")
    .setDescription("👑 Envoie l'embed Créer équipe (admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt => opt.setName("tournoi").setDescription("Nom du tournoi").setRequired(true)),

  async execute(interaction) {
    const tournoiNomInput = interaction.options.getString("tournoi");
    const data = loadData();
    const found = findTournament(data, tournoiNomInput);
    if (!found) return interaction.reply({ content: `❌ Le tournoi "${tournoiNomInput}" n'existe pas.`, ephemeral: true });

    const tournoiKey = found.key;
    const tournoiObj = found.tournoi;

    const embed = new EmbedBuilder()
      .setColor(0xffd166)
      .setTitle(`👑 Créer une équipe — ${tournoiKey}`)
      .setDescription(
        "🇫🇷 Si tu es chef d’équipe, clique sur **Créer équipe**. Le bot te contactera en DM.\n" +
        "🇬🇧 If you are the team leader, click **Create Team**. The bot will DM you."
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`creer_equipe::${tournoiKey}`)
        .setLabel("Créer équipe / Create Team")
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ content: `✅ Embed Créer équipe envoyé pour ${tournoiKey}`, flags: 64 });
    const message = await interaction.channel.send({ embeds: [embed], components: [row] });

    const collector = message.createMessageComponentCollector({ time: 0 });

    collector.on("collect", async i => {
      if (i.customId.split("::")[0] !== "creer_equipe") return;
      await i.deferUpdate().catch(() => {});

      const user = i.user;

      try {
        const dm = await user.createDM();

        if (!tournoiObj.equipes) tournoiObj.equipes = {};

        // Vérifier si l'utilisateur est déjà chef
        const alreadyLeader = Object.values(tournoiObj.equipes).some(e => e.chefId === user.id);
        if (alreadyLeader) return dm.send("❌ Vous êtes déjà chef d’une équipe dans ce tournoi / You already lead a team.");

        // --- DEMANDER NOM D'ÉQUIPE ---
        await dm.send(`👑 Création d'équipe pour **${tournoiKey}**.\n🇫🇷 Entre le nom de ton équipe :\n🇬🇧 Enter your team name:`);
        const teamNameCollector = dm.createMessageCollector({ filter: m => m.author.id === user.id, max: 1, time: 60000 });

        teamNameCollector.on("collect", async mName => {
          const teamName = mName.content.trim();
          if (!teamName) return dm.send("⏰ Temps écoulé. Recommence.");

          // Vérifier doublon
          const exists = Object.keys(tournoiObj.equipes).some(k => k.toLowerCase() === teamName.toLowerCase());
          if (exists) return dm.send("❌ Une équipe avec ce nom existe déjà.");

          // --- DEMANDER MOT DE PASSE ---
          await dm.send("🔐 Choisis un mot de passe pour ton équipe / Choose a team password:");
          const passCollector = dm.createMessageCollector({ filter: m => m.author.id === user.id, max: 1, time: 60000 });

          passCollector.on("collect", async mPass => {
            const pass = mPass.content.trim();
            if (!pass) return dm.send("⏰ Temps écoulé. Recommence.");

            // --- CREATION ---
            tournoiObj.equipes[teamName] = {
              password: pass,
              chefId: user.id,
              joueurs: [user.id],
              maxJoueurs: tournoiObj.maxJoueurs || 3
            };

            saveData(data);

            const confirmEmbed = new EmbedBuilder()
              .setColor("Green")
              .setTitle("✅ Équipe créée / Team created")
              .setDescription(`🇫🇷 L'équipe **${teamName}** a été créée pour le tournoi **${tournoiKey}**.\n` +
                              `🇬🇧 Team **${teamName}** has been created for **${tournoiKey}**.`)
              .setTimestamp();

            await dm.send({ embeds: [confirmEmbed] });
            await message.channel.send(`🆕 <@${user.id}> a créé l'équipe **${teamName}** pour **${tournoiKey}**.`);
          });

          passCollector.on("end", collected => {
            if (collected.size === 0) dm.send("⏰ Temps écoulé pour le mot de passe. Recommence.");
          });
        });

        teamNameCollector.on("end", collected => {
          if (collected.size === 0) dm.send("⏰ Temps écoulé pour le nom d'équipe. Recommence.");
        });

      } catch (err) {
        console.error("Erreur DM inscriptionchef:", err);
        user.send("❌ Erreur lors de la création de l’équipe. Vérifie tes DM.");
      }
    });
  },
};
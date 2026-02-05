import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
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
    .setName("ajouterequipe")
    .setDescription("➕ Ajouter une équipe manuellement (admin)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt => opt.setName("tournoi").setDescription("Nom du tournoi").setRequired(true))
    .addStringOption(opt => opt.setName("equipe").setDescription("Nom de l'équipe").setRequired(true))
    .addUserOption(opt => opt.setName("chef").setDescription("Mention du chef").setRequired(true))
    .addStringOption(opt => opt.setName("motdepasse").setDescription("Mot de passe de l'équipe").setRequired(true)),

  async execute(interaction) {
    const tournoiNom = interaction.options.getString("tournoi");
    const equipeNom = interaction.options.getString("equipe");
    const chefUser = interaction.options.getUser("chef");
    const motdepasse = interaction.options.getString("motdepasse");

    const data = loadData();
    const found = findTournament(data, tournoiNom);
    if (!found) return interaction.reply({ content: `❌ Le tournoi ${tournoiNom} n'existe pas.`, ephemeral: true });
    const tournoiKey = found.key;
    const tournoi = found.tournoi;

    if (!tournoi.equipes) tournoi.equipes = {};

    const exists = Object.keys(tournoi.equipes).some(k => k.toLowerCase() === equipeNom.toLowerCase());
    if (exists) return interaction.reply({ content: `⚠️ L'équipe ${equipeNom} existe déjà.`, ephemeral: true });

    const chefTag = `${chefUser.username}#${chefUser.discriminator}`;
    const chefId = chefUser.id;
    const maxJ = tournoi.maxJoueurs || 3;

    tournoi.equipes[equipeNom] = { password: motdepasse, chefId, chefTag, joueurs: [chefTag], maxJoueurs: maxJ };
    saveData(data);

    try {
      await chefUser.send(`✅ Ton équipe **${equipeNom}** a été ajoutée manuellement pour ${tournoiKey}.\nMot de passe: ${motdepasse}\nMax joueurs: ${maxJ}`);
    } catch {
      // DM could fail if closed; not critical
    }

    return interaction.reply({ content: `✅ Équipe ${equipeNom} ajoutée pour ${tournoiKey}.`, ephemeral: false });
  },
};
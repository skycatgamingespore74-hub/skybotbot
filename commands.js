import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("ajoutertournoi")
    .setDescription("➕ Ajouter un tournoi / Add a tournament")
    .addStringOption(opt =>
      opt.setName("nom").setDescription("Nom du tournoi / Tournament name").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("categorie").setDescription("Niveau du tournoi / Tournament level")
        .addChoices(
          { name: "Starter", value: "starter" },
          { name: "Starter +", value: "starter+" },
          { name: "Bronze", value: "bronze" },
          { name: "Argent", value: "argent" },
          { name: "Or", value: "or" }
        ).setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("lien").setDescription("Lien du tournoi / Tournament link").setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("joueurs_par_equipe").setDescription("Nombre de joueurs par équipe / Players per team").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("supprimertournoi")
    .setDescription("🗑️ Supprimer un tournoi / Delete a tournament")
    .addStringOption(opt =>
      opt.setName("nom").setDescription("Nom du tournoi / Tournament name").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("listetournois")
    .setDescription("📋 Voir la liste des tournois / List all tournaments"),

  new SlashCommandBuilder()
    .setName("detailtournoi")
    .setDescription("🔍 Voir les détails d’un tournoi / Show tournament details")
    .addStringOption(opt =>
      opt.setName("nom").setDescription("Nom du tournoi / Tournament name").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ajouterequipe")
    .setDescription("👥 Ajouter une équipe / Add a team")
    .addStringOption(opt => opt.setName("tournoi").setDescription("Nom du tournoi / Tournament name").setRequired(true))
    .addStringOption(opt => opt.setName("equipe").setDescription("Nom de l’équipe / Team name").setRequired(true))
    .addStringOption(opt => opt.setName("joueurs").setDescription("Joueurs séparés par des virgules / Players separated by commas").setRequired(true))
    .addStringOption(opt => opt.setName("motdepasse").setDescription("Mot de passe de l’équipe / Team password").setRequired(true)),

  new SlashCommandBuilder()
    .setName("supprimerequipe")
    .setDescription("🗑️ Supprimer une équipe / Delete a team")
    .addStringOption(opt => opt.setName("tournoi").setDescription("Nom du tournoi / Tournament name").setRequired(true))
    .addStringOption(opt => opt.setName("equipe").setDescription("Nom de l’équipe / Team name").setRequired(true))
    .addStringOption(opt => opt.setName("motdepasse").setDescription("Mot de passe de l’équipe / Team password").setRequired(true)),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("📘 Liste des commandes disponibles / List all available commands"),

  new SlashCommandBuilder()
    .setName("inscriptionauto")
    .setDescription("📝 Activer les inscriptions automatiques / Auto registration setup")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("annoncetournoi")
    .setDescription("📣 Envoyer une annonce de tournoi / Post a tournament announcement")
    .addStringOption(opt => opt.setName("nom").setDescription("Nom du tournoi / Tournament name").setRequired(true))
    .addStringOption(opt => opt.setName("date").setDescription("Date et heure / Date and time").setRequired(true))
    .addStringOption(opt => opt.setName("inscriptions").setDescription("Date d’ouverture des inscriptions / Registration date").setRequired(true))
    .addStringOption(opt => opt.setName("format").setDescription("Format du tournoi (ex: BO3 Power League)").setRequired(true))
    .addStringOption(opt => opt.setName("maps").setDescription("Maps du tournoi / Maps used").setRequired(true))
    .addStringOption(opt => opt.setName("niveau").setDescription("Niveau du tournoi / Tournament level")
      .addChoices(
        { name: "Starter", value: "starter" },
        { name: "Starter +", value: "starter+" },
        { name: "Bronze", value: "bronze" },
        { name: "Argent", value: "argent" },
        { name: "Or", value: "or" }
      ).setRequired(true)
    )
    .addStringOption(opt => opt.setName("lien").setDescription("Lien du tournoi / Tournament link").setRequired(true)),
];
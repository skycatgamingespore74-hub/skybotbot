import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📜 Affiche la liste des commandes disponibles / Show all available commands'),

  async execute(interaction) {
    const memberRoles = interaction.member.roles.cache.map(r => r.name);
    const isStaff = memberRoles.some(role =>
      ['MODÉRATEUR APTE', 'MODÉRATEUR', 'GERANT', 'Assistance', '🛠STAFF🛠'].includes(role)
    );

    // 🇫🇷 Embed français
    const embedFR = new EmbedBuilder()
      .setTitle('🇫🇷 Commandes disponibles')
      .setColor('#00AEEF')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setDescription(isStaff
        ? `Voici toutes les commandes disponibles pour le staff :`
        : `Voici les commandes que tu peux utiliser :`)
      .addFields(
        { name: '🎮 Commandes Tournois', value: `
        • **/listetournois** → Affiche tous les tournois disponibles
        • **/detailtournoi** → Affiche les détails d’un tournoi
        • **/ajouterequipe** → Crée une équipe pour un tournoi
        • **/supprimerequipe** → Supprime ton équipe (via DM)
        • **/help** → Affiche cette aide
        ` },
        ...(isStaff
          ? [{
              name: '🛠️ Commandes Staff',
              value: `
              • **/ajoutertournoi** → Crée un nouveau tournoi
              • **/supprimertournoi** → Supprime un tournoi
              • **/inscriptionauto** → Active les inscriptions automatiques
              • **/annoncetournoi** → Publie une annonce officielle
              `
            }]
          : [])
      )
      .setFooter({ text: 'SKYTOURNROOM • Support disponible en DM 💬' });

    // 🇬🇧 Embed English
    const embedEN = new EmbedBuilder()
      .setTitle('🇬🇧 Available Commands')
      .setColor('#FFD700')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setDescription(isStaff
        ? `Here are all commands available for the staff:`
        : `Here are the commands you can use:`)
      .addFields(
        { name: '🎮 Tournament Commands', value: `
        • **/listetournois** → Show all available tournaments
        • **/detailtournoi** → Show details of a tournament
        • **/ajouterequipe** → Create a team for a tournament
        • **/supprimerequipe** → Delete your team (via DM)
        • **/help** → Display this help message
        ` },
        ...(isStaff
          ? [{
              name: '🛠️ Staff Commands',
              value: `
              • **/ajoutertournoi** → Create a new tournament
              • **/supprimertournoi** → Delete a tournament
              • **/inscriptionauto** → Enable automatic registration
              • **/annoncetournoi** → Post an official announcement
              `
            }]
          : [])
      )
      .setFooter({ text: 'SKYTOURNROOM • Support available in DM 💬' });

    await interaction.reply({ embeds: [embedFR, embedEN], ephemeral: true });
  },
};
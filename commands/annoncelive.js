import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('annoncelive')
    .setDescription('📢 Annonce que le tournoi est en live sur Twitch (FR + EN)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const annonceRole = interaction.guild.roles.cache.find(r => r.name === 'Annonce tournoi');
    if (!annonceRole) {
      return interaction.reply({
        content: "⚠️ Le rôle **@Annonce tournoi** est introuvable sur ce serveur.",
        ephemeral: true,
      });
    }

    // IDs des rôles français et anglais
    const frRoleId = '1394720481789349899';
    const enRoleId = '1394720597879029790';

    const twitchLink = 'https://www.twitch.tv/acesky_esport';

    const message = `
🇲🇫 <@&${frRoleId}>
Le tournoi est **en live sur Twitch** 🎥  
Venez nous rejoindre pour passer un bon moment !  
**Lien :** ${twitchLink}

🇬🇧 <@&${enRoleId}>
The tournament is **live on Twitch** 🎮  
Join us for some fun and action!  
**Link :** ${twitchLink}

${annonceRole}
    `;

    await interaction.reply({
      content: message,
      allowedMentions: { roles: [frRoleId, enRoleId, annonceRole.id] },
    });
  },
};
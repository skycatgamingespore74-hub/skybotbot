import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('annonceami')
    .setDescription('📢 Envoie le message rappelant d’ajouter les comptes amis (FR + EN)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const annonceRole = interaction.guild.roles.cache.find(r => r.name === 'Annonce tournoi');
    if (!annonceRole) {
      return interaction.reply({
        content: "⚠️ Le rôle **@Annonce tournoi** est introuvable sur ce serveur.",
        ephemeral: true,
      });
    }

    const salonComptes = '<#1399474034734927942>';

    const message = `
🇲🇫 @FR  
N'oubliez pas de **mettre en ami les comptes** dans le salon ${salonComptes} 🤝  

🇬🇧 @EN  
Don't forget to **friend the accounts** in the ${salonComptes} room 💬  

${annonceRole}
    `;

    await interaction.reply({
      content: message,
      allowedMentions: { roles: [annonceRole.id] },
    });
  },
};
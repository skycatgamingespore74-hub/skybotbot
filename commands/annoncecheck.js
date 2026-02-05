import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('annoncecheck')
    .setDescription('📣 Envoie le message de check-in (FR + EN)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // seuls les admins/modérateurs peuvent l'utiliser

  async execute(interaction) {
    const annonceRole = interaction.guild.roles.cache.find(r => r.name === 'Annonce tournoi');
    if (!annonceRole) {
      return interaction.reply({
        content: "⚠️ Le rôle **@Annonce tournoi** est introuvable sur ce serveur.",
        ephemeral: true,
      });
    }

    const message = `
🇲🇫 **@FR**  
Le check-in est là.  
Après avoir rempli l’équipe, veuillez cliquer sur check-in pour être qualifiés.  

🇬🇧 **@EN**  
Check-in is here.  
After completing the team, please click check-in to qualify.  

${annonceRole}
    `;

    await interaction.reply({
      content: message,
      allowedMentions: { roles: [annonceRole.id] },
    });
  },
};
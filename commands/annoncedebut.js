import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('annoncedebut')
    .setDescription('📣 Annonce le début du tournoi (FR + EN)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

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
**LE TOURNOI A COMMENCÉ !**  
Veuillez accepter l'invitation dans le jeu 🎮  

🇬🇧 **@EN**  
**THE TOURNAMENT HAS STARTED!**  
Please accept the in-game invitation 🎮  

${annonceRole}
    `;

    await interaction.reply({
      content: message,
      allowedMentions: { roles: [annonceRole.id] },
    });
  },
};
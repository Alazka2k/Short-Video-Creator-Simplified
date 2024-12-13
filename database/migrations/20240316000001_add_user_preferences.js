exports.up = async function(knex) {
  // Check if columns exist before adding them
  const hasColumns = await knex.schema.hasColumn('users', 'video_preferences')
    .then(async hasVideoPrefs => {
      const hasNotificationSettings = await knex.schema.hasColumn('users', 'notification_settings');
      const hasApiSettings = await knex.schema.hasColumn('users', 'api_settings');
      return hasVideoPrefs || hasNotificationSettings || hasApiSettings;
    });

  if (!hasColumns) {
    return knex.schema.alterTable('users', table => {
      table.jsonb('video_preferences').defaultTo(JSON.stringify({
        defaultResolution: '1080p',
        defaultAspectRatio: '16:9',
        defaultLanguage: 'en',
        defaultVoice: 'neural-1',
        defaultStyle: 'modern'
      }));
      
      table.jsonb('notification_settings').defaultTo(JSON.stringify({
        emailNotifications: true,
        videoCompletionAlert: true,
        errorNotifications: true
      }));
      
      table.jsonb('api_settings').defaultTo(JSON.stringify({
        webhookUrl: null,
        apiKeys: [],
        allowedIps: []
      }));
    });
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.dropColumn('video_preferences');
    table.dropColumn('notification_settings');
    table.dropColumn('api_settings');
  });
}; 
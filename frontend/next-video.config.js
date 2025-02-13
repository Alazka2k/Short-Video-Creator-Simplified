/** @type {import('next-video/config').Options} */
const nextVideoConfig = {
  provider: 's3',
  // Use our existing video storage path
  directory: 'videos',
  // Customize video options
  options: {
    maxDuration: 300, // 5 minutes
    maxFileSize: '100MB',
    // Use our existing aspect ratios
    aspectRatio: ['16:9', '9:16', '1:1'],
  },
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
}

module.exports = nextVideoConfig 
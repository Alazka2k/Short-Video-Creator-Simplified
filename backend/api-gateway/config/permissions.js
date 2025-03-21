const SERVICE_PERMISSIONS = {
  llm: {
    create: 'create:llm',
    read: 'read:llm',
    manage: 'manage:llm'
  },
  image: {
    create: 'create:image',
    read: 'read:image',
    manage: 'manage:image'
  },
  voice: {
    create: 'create:voice',
    read: 'read:voice',
    manage: 'manage:voice'
  },
  music: {
    create: 'create:music',
    read: 'read:music',
    manage: 'manage:music'
  },
  animation: {
    create: 'create:animation',
    read: 'read:animation',
    manage: 'manage:animation'
  },
  video: {
    create: 'create:video',
    read: 'read:video',
    manage: 'manage:video'
  },
  assembly: {
    create: 'create:assembly',
    read: 'read:assembly',
    manage: 'manage:assembly'
  },
  job: {
    create: 'create:job',
    read: 'read:job',
    manage: 'manage:job'
  },
  storage: {
    download: 'download:media',
    upload: 'upload:media',
    manage: 'manage:media'
  },
  subscription: {
    create: 'create:subscription',
    read: 'read:subscription',
    manage: 'manage:subscription'
  },
  user: {
    manage_projects: 'manage:projects',
    use_templates: 'use:templates',
    api_access: 'api:access',
    manage_team: 'manage:team',
    view_analytics: 'view:analytics',
    manage_tokens: 'manage:tokens',
    custom_branding: 'custom:branding',
    priority_processing: 'priority:processing',
    admin_access: 'admin:access'
  }
};

const ENDPOINT_PERMISSIONS = {
  // LLM Service Endpoints
  '/api/llm/generate': SERVICE_PERMISSIONS.llm.create,
  '/api/llm/status': SERVICE_PERMISSIONS.llm.read,
  '/api/llm/status/*': SERVICE_PERMISSIONS.llm.read,

  // Image Service Endpoints
  '/api/image/generate': SERVICE_PERMISSIONS.image.create,
  '/api/image/status': SERVICE_PERMISSIONS.image.read,
  '/api/image/status/*': SERVICE_PERMISSIONS.image.read,

  // Voice Service Endpoints
  '/api/voice/generate': SERVICE_PERMISSIONS.voice.create,
  '/api/voice/status': SERVICE_PERMISSIONS.voice.read,
  '/api/voice/status/*': SERVICE_PERMISSIONS.voice.read,

  // Music Service Endpoints
  '/api/music/generate': SERVICE_PERMISSIONS.music.create,
  '/api/music/status': SERVICE_PERMISSIONS.music.read,
  '/api/music/status/*': SERVICE_PERMISSIONS.music.read,

  // Animation Service Endpoints
  '/api/animation/generate': SERVICE_PERMISSIONS.animation.create,
  '/api/animation/status': SERVICE_PERMISSIONS.animation.read,
  '/api/animation/status/*': SERVICE_PERMISSIONS.animation.read,

  // Video Service Endpoints
  '/api/video/generate': SERVICE_PERMISSIONS.video.create,
  '/api/video/status': SERVICE_PERMISSIONS.video.read,
  '/api/video/status/*': SERVICE_PERMISSIONS.video.read,

  // Assembly Service Endpoints
  '/api/assembly/assemble': SERVICE_PERMISSIONS.assembly.create,
  '/api/assembly/status': SERVICE_PERMISSIONS.assembly.read,
  '/api/assembly/status/*': SERVICE_PERMISSIONS.assembly.read,
  '/api/assembly/validate': SERVICE_PERMISSIONS.assembly.read,
  '/api/assembly/validate/*': SERVICE_PERMISSIONS.assembly.read,

  // Job Service Endpoints
  '/api/job/generate': SERVICE_PERMISSIONS.job.create,
  '/api/job/jobs': SERVICE_PERMISSIONS.job.read,
  '/api/job/jobs/*': SERVICE_PERMISSIONS.job.read,

  // Download Service Endpoints
  '/api/download': SERVICE_PERMISSIONS.storage.download,
  '/api/download/*': SERVICE_PERMISSIONS.storage.download,

  // Subscription Service Endpoints
  '/api/subscription': SERVICE_PERMISSIONS.subscription.create,
  '/api/subscription': SERVICE_PERMISSIONS.subscription.read,
  '/api/subscription/*': SERVICE_PERMISSIONS.subscription.create,
  '/api/subscription/*': SERVICE_PERMISSIONS.subscription.read,

  // Plan Management Endpoints 
  '/api/subscription/plans': SERVICE_PERMISSIONS.subscription.read,
  '/api/subscription/plans/*': SERVICE_PERMISSIONS.subscription.read,

  // Current Subscription Endpoints
  '/api/subscription/current': SERVICE_PERMISSIONS.subscription.read,
  '/api/subscription/current/*': SERVICE_PERMISSIONS.subscription.read,
  '/api/subscription/transactions': SERVICE_PERMISSIONS.subscription.read,
  '/api/subscription/transactions/*': SERVICE_PERMISSIONS.subscription.read,
  '/api/subscription/history': SERVICE_PERMISSIONS.subscription.read,
  '/api/subscription/history/*': SERVICE_PERMISSIONS.subscription.read,

  // User Service Endpoints (for frontend access)
  '/api/user/profile': SERVICE_PERMISSIONS.user.api_access,
  '/api/user/projects': SERVICE_PERMISSIONS.user.manage_projects,
  '/api/user/tokens': SERVICE_PERMISSIONS.user.manage_tokens,
  '/api/user/templates': SERVICE_PERMISSIONS.user.use_templates,
  '/api/user/team': SERVICE_PERMISSIONS.user.manage_team,
  '/api/user/analytics': SERVICE_PERMISSIONS.user.view_analytics,
  '/api/user/branding': SERVICE_PERMISSIONS.user.custom_branding
};

/**
 * Get the required permission for a given endpoint
 * @param {string} endpoint - The endpoint path
 * @returns {string|null} The required permission or null if not found
 */
function getRequiredPermission(endpoint) {
  // First try exact match
  if (ENDPOINT_PERMISSIONS[endpoint]) {
    return ENDPOINT_PERMISSIONS[endpoint];
  }

  // Then try wildcard matches
  for (const [pattern, permission] of Object.entries(ENDPOINT_PERMISSIONS)) {
    if (pattern.endsWith('/*')) {
      const basePattern = pattern.slice(0, -2);
      if (endpoint.startsWith(basePattern)) {
        return permission;
      }
    }
  }

  return null;
}

module.exports = {
  SERVICE_PERMISSIONS,
  ENDPOINT_PERMISSIONS,
  getRequiredPermission
}; 
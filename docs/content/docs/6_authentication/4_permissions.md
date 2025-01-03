# Permissions and Access Control

This document outlines the permissions system used in the Short Video Creator platform, including both Machine-to-Machine (M2M) scopes and user permissions.

## M2M Scopes

Machine-to-Machine applications need to request specific scopes when obtaining access tokens. These scopes determine what API endpoints the application can access.

### Available Scopes

| Scope | Description | Endpoints |
|-------|-------------|-----------|
| `create:llm` | Access to LLM generation | `/api/llm/*` |
| `create:images` | Access to image generation | `/api/image/*` |
| `create:voice` | Access to voice synthesis | `/api/voice/*` |
| `create:animations` | Access to animation generation | `/api/animation/*` |
| `create:videos` | Access to video processing | `/api/video/*` |
| `create:music` | Access to music generation | `/api/music/*` |
| `create:assembly` | Access to assembly operations | `/api/assembly/*` |
| `manage:jobs` | Access to job management | `/api/job/*` |

### Configuring M2M Scopes in Auth0

1. Go to your Auth0 Dashboard
2. Navigate to "Applications" > Your M2M Application
3. Go to the "Permissions" tab
4. Add the required scopes from the list above
5. When requesting tokens, specify the required scopes in the `scope` parameter

## User Permissions

User permissions are stored in the database and are typically assigned through roles. These permissions control what actions authenticated users can perform.

### Available Permissions

| Permission | Description | Default Roles |
|------------|-------------|---------------|
| `create_video` | Create and edit videos | Free, Pro, Business |
| `delete_video` | Delete videos | Free, Pro, Business |
| `manage_projects` | Manage project settings | Pro, Business |
| `use_templates` | Access premium templates | Pro, Business |
| `api_access` | Access API endpoints | Business |
| `manage_team` | Manage team members | Business |
| `view_analytics` | Access analytics | Pro, Business |
| `custom_branding` | Use custom branding | Business |
| `priority_processing` | Priority in job queue | Business |
| `admin_access` | Full administrative access | Admin |

### User Roles

| Role | Description | Key Permissions |
|------|-------------|----------------|
| Free | Basic access | `create_video`, `delete_video` |
| Pro | Professional features | Above + `manage_projects`, `use_templates`, `view_analytics` |
| Business | Full feature access | All except `admin_access` |
| Admin | Administrative access | All permissions |

### Permission Assignment

Permissions are assigned to users through roles:

1. When a user signs up, they are assigned the "Free" role by default
2. Role upgrades are handled through the subscription system
3. Admin roles are assigned manually by system administrators

## Testing Permissions

### M2M Testing

To test M2M endpoints with all permissions:

1. Create an M2M application in Auth0
2. Assign all required scopes:
   ```
   create:llm create:images create:voice create:animations 
   create:videos create:music create:assembly manage:jobs
   ```
3. Request a token with these scopes
4. Use the token in your API requests

### User Testing

For testing user endpoints with full permissions:

1. Create a test user
2. Assign the "Admin" role to get all permissions
3. Log in as this user
4. Use the received token for API requests

## Security Considerations

1. Always use the principle of least privilege
2. Regularly audit permission assignments
3. Monitor permission usage through logs
4. Review and update permissions when adding new features

## Error Handling

The API returns specific error messages for permission issues:

```json
{
  "error": "Insufficient scope",
  "message": "Missing required scope: create:videos",
  "requiredScope": "create:videos",
  "availableScopes": ["create:llm", "create:images"]
}
```

For user permissions:
```json
{
  "error": "Forbidden",
  "message": "Missing required permission: create_video"
}
``` 
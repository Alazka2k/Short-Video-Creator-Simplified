# Project Management API

## Get Project List

Retrieves a paginated list of projects with optional filters.

```http
GET /api/projects
```

### Query Parameters

| Parameter | Type     | Description                                                |
|-----------|----------|------------------------------------------------------------|
| page      | number   | Page number for pagination (default: 1)                    |
| limit     | number   | Number of items per page (default: 10, max: 50)           |
| status    | string   | Filter by status: 'draft', 'in_progress', 'ready_to_generate' |
| sortBy    | string   | Sort field: 'createdAt', 'lastEdited', 'title' (default: 'lastEdited') |
| order     | string   | Sort order: 'asc', 'desc' (default: 'desc')               |

### Response

```typescript
{
  projects: {
    id: string;
    title: string;
    status: 'draft' | 'in_progress' | 'ready_to_generate';
    lastEdited: string;
    createdAt: string;
    thumbnail?: string;
    settings: {
      targetPlatform: 'youtube' | 'tiktok' | 'instagram';
      style?: string;
      duration?: number;
    };
  }[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
```

## Get Project Details

Retrieves detailed information about a specific project.

```http
GET /api/projects/:id
```

### Response

```typescript
{
  id: string;
  title: string;
  status: 'draft' | 'in_progress' | 'ready_to_generate';
  lastEdited: string;
  createdAt: string;
  thumbnail?: string;
  settings: {
    targetPlatform: 'youtube' | 'tiktok' | 'instagram';
    style?: string;
    duration?: number;
  };
  content: {
    scenes: {
      id: string;
      text: string;
      imagePrompt?: string;
      voiceSettings?: {
        voice: string;
        style: string;
      };
      duration?: number;
    }[];
    music?: {
      style: string;
      mood: string;
      duration: number;
    };
  };
  metadata?: {
    estimatedTokens: number;
    totalScenes: number;
    complexity: 'simple' | 'medium' | 'complex';
  };
}
```

## Create Project

Creates a new project.

```http
POST /api/projects
```

### Request Body

```typescript
{
  title: string;
  settings: {
    targetPlatform: 'youtube' | 'tiktok' | 'instagram';
    style?: string;
    duration?: number;
  };
  content?: {
    scenes?: {
      text: string;
      imagePrompt?: string;
      voiceSettings?: {
        voice: string;
        style: string;
      };
      duration?: number;
    }[];
    music?: {
      style: string;
      mood: string;
      duration: number;
    };
  };
}
```

### Response

```typescript
{
  success: boolean;
  project: {
    id: string;
    title: string;
    // ... (created project object)
  };
}
```

## Update Project

Updates an existing project.

```http
PATCH /api/projects/:id
```

### Request Body

```typescript
{
  title?: string;
  settings?: {
    targetPlatform?: 'youtube' | 'tiktok' | 'instagram';
    style?: string;
    duration?: number;
  };
  content?: {
    scenes?: {
      text: string;
      imagePrompt?: string;
      voiceSettings?: {
        voice: string;
        style: string;
      };
      duration?: number;
    }[];
    music?: {
      style: string;
      mood: string;
      duration: number;
    };
  };
}
```

### Response

```typescript
{
  success: boolean;
  project: {
    id: string;
    title: string;
    // ... (updated project object)
  };
}
```

## Delete Project

Deletes a specific project.

```http
DELETE /api/projects/:id
```

### Response

```typescript
{
  success: boolean;
  message: string;
}
``` 
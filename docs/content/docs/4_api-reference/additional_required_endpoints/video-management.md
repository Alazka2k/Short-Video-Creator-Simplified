# Video Management API

## Get Video List

Retrieves a paginated list of videos with optional filters.

```http
GET /api/videos
```

### Query Parameters

| Parameter | Type     | Description                                                |
|-----------|----------|------------------------------------------------------------|
| page      | number   | Page number for pagination (default: 1)                    |
| limit     | number   | Number of items per page (default: 10, max: 50)           |
| status    | string   | Filter by status: 'processing', 'completed', 'failed'      |
| sortBy    | string   | Sort field: 'createdAt', 'title', 'status' (default: 'createdAt') |
| order     | string   | Sort order: 'asc', 'desc' (default: 'desc')               |

### Response

```typescript
{
  videos: {
    id: string;
    title: string;
    status: 'processing' | 'completed' | 'failed';
    thumbnailUrl?: string;
    createdAt: string;
    duration?: number;
    platform?: 'youtube' | 'tiktok' | 'instagram';
    stats?: {
      views?: number;
      likes?: number;
      shares?: number;
    };
  }[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
```

## Get Video Details

Retrieves detailed information about a specific video.

```http
GET /api/videos/:id
```

### Response

```typescript
{
  id: string;
  title: string;
  status: 'processing' | 'completed' | 'failed';
  thumbnailUrl?: string;
  createdAt: string;
  duration?: number;
  platform?: 'youtube' | 'tiktok' | 'instagram';
  stats?: {
    views?: number;
    likes?: number;
    shares?: number;
  };
  metadata: {
    resolution: string;
    format: string;
    fileSize?: number;
    scenes?: number;
  };
  processingDetails?: {
    progress: number;
    currentStep: string;
    estimatedTimeRemaining?: number;
  };
}
```

## Delete Video

Deletes a specific video.

```http
DELETE /api/videos/:id
```

### Response

```typescript
{
  success: boolean;
  message: string;
}
```

## Update Video Metadata

Updates metadata for a specific video.

```http
PATCH /api/videos/:id
```

### Request Body

```typescript
{
  title?: string;
  platform?: 'youtube' | 'tiktok' | 'instagram';
  metadata?: {
    [key: string]: any;
  };
}
```

### Response

```typescript
{
  success: boolean;
  video: {
    id: string;
    title: string;
    // ... (updated video object)
  };
}
``` 
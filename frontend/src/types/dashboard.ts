// frontend/src/types/dashboard.ts

export interface Job {
  job_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  // Use the status enum that the existing JobCard/JobThumbnail components expect
  status: 'completed' | 'in_progress' | 'failed' | 'queued';
  service_sequence: string[];
  metadata: {
    // Correct the scene definition to include the optional image for the thumbnail
    scenes: {
      sceneId: number;
      status: string;
      image?: {
        publicUrl?: string;
      };
    }[];
    llmResult?: {
      title?: string;
      description?: string;
    };
    // Add other metadata properties as needed
  };
  prompt: string;
  error: string | null;
  completed_at: string | null;
  error_type: string | null;
  // This is a simplified version based on the `job` object inside the /videos response
  // and the top-level job properties. It can be expanded.
  title?: string;
  description?: string;
  sceneCount?: number;
}

export interface JobsApiResponse {
  data: Job[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_payment_intent_id: string | null;
  stripe_status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  plan_name: string;
  monthly_token_allocation: number;
}

export interface TokenBalance {
  balance: number;
}

export interface ContentStats {
  images: number;
  voiceovers: number;
  musicTracks: number;
  animations: number;
  videos: number;
  completedJobs: number;
  finalVideos: number;
}

export interface Video {
  assembly_id: number;
  job_id: string;
  user_id: number;
  template_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  storage_key: string;
  public_url: string;
  creatomate_id: string;
  metadata: {
    jobData: {
      id: string;
      scenes: number;
      status: string;
    };
    duration: number;
    fileSize: number;
    frameRate: number;
    startTime: string;
    resolution: {
      width: number;
      height: number;
    };
    templateInfo: {
      id: string;
      name: string;
      aspectRatio: string;
      sceneAmount: number;
    };
  };
  job: {
    job_id: string;
    status: string;
    title: string;
    description: string;
    sceneCount: number;
  };
}

export interface VideosApiResponse {
  data: Video[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
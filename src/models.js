const { z } = require("zod");

const SceneSchema = z.object({
  description: z.string(),
  visual_prompt: z.string(),
  camera_movement: z.string(), // JSON string
  negative_prompt: z.string()
});

const CameraMovementSchema = z.object({
  type: z.string(),
  horizontal: z.number(),
  vertical: z.number(),
  zoom: z.number(),
  tilt: z.number(),
  pan: z.number(),
  roll: z.number()
});

const MusicSchema = z.object({
  title: z.string(),
  lyrics: z.string(),
  style: z.string(),
});

const VideoScriptSchema = z.object({
  prompt: z.string().optional(), // Make this optional as it's added after the API call
  title: z.string(),
  description: z.string(),
  hashtags: z.string(),
  scenes: z.array(SceneSchema),
  music: MusicSchema, // Use MusicSchema directly here
});


module.exports = { SceneSchema, VideoScriptSchema, MusicSchema, CameraMovementSchema };
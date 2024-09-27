const { z } = require("zod");

const SceneSchema = z.object({
  description: z.string(),
  visual_prompt: z.string(),
  video_prompt: z.string(),
  camera_movement: z.string()
});

const MusicSchema = z.object({
  title: z.string(),
  lyrics: z.string(),
  tags: z.string(),
});

const AnimationPatternSchema = z.object({
  pattern: z.string(),
  description: z.string()
});

const VideoScriptSchema = z.object({
  prompt: z.string().optional(), // Make this optional as it's added after the API call
  title: z.string(),
  description: z.string(),
  hashtags: z.string(),
  scenes: z.array(SceneSchema),
  music: MusicSchema, // Use MusicSchema directly here
});


module.exports = { SceneSchema, VideoScriptSchema, MusicSchema, AnimationPatternSchema};
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

const VideoScriptSchema = z.object({
  prompt: z.string(),
  title: z.string(),
  description: z.string(),
  hashtags: z.string(),
  scenes: z.array(SceneSchema),
  music: MusicSchema,
});

const AnimationPatternSchema = z.object({
  pattern: z.string(),
  description: z.string()
});

module.exports = { SceneSchema, VideoScriptSchema, MusicSchema, AnimationPatternSchema };
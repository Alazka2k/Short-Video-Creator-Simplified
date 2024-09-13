const { z } = require("zod");

const SceneSchema = z.object({
  description: z.string(),
  visual_prompt: z.string(),
});

const MusicSchema = z.object({
  title: z.string(),
  lyrics: z.string(),
  style: z.string(),
});

const VideoScriptSchema = z.object({
  prompt: z.string(),
  title: z.string(),
  description: z.string(),
  hashtags: z.string(),
  scenes: z.array(SceneSchema),
  music: z.object(MusicSchema),
});

module.exports = { SceneSchema, VideoScriptSchema };
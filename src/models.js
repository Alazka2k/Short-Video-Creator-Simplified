const { z } = require("zod");

const SceneSchema = z.object({
  description: z.string(),
  visual_prompt: z.string(),
});

const VideoScriptSchema = z.object({
  title: z.string(),
  description: z.string(),
  hashtags: z.string(),
  opening_scene: SceneSchema,
  scenes: z.array(SceneSchema),
  closing_scene: SceneSchema,
});

module.exports = { SceneSchema, VideoScriptSchema };
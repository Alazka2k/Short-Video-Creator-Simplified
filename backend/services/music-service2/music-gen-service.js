const path = require('path');
const fs = require('fs').promises;
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const { get_pretrained_model, generate_diffusion_cond } = require('stable_audio_tools');
const { rearrange } = require('einops');
const torchaudio = require('torchaudio');
const torch = require('torch');

class MusicGenService {
  constructor() {
    this.musicGenOptions = config.parameters?.musicGen2 || {};
    logger.info('Initialized MusicGenService2 with options:', JSON.stringify(this.musicGenOptions, null, 2));

    this.initStableAudioOpen();
  }

  async initStableAudioOpen() {
    try {
      logger.info('Initializing Stable Audio Open 1.0 model...');
      this.device = torch.cuda.is_available() ? 'cuda' : 'cpu';
      this.model, this.modelConfig = await get_pretrained_model("stabilityai/stable-audio-open-1.0");
      this.model = this.model.to(this.device);
      this.sampleRate = this.modelConfig.sample_rate;
      this.sampleSize = this.modelConfig.sample_size;
      logger.info('Stable Audio Open 1.0 model initialized successfully');
    } catch (error) {
      logger.error('Error initializing Stable Audio Open 1.0 model:', error);
      throw error;
    }
  }

  async generateMusic(musicData, isTest = false) {
    try {
      logger.info(`Generating music for title: "${musicData.title}"`);
      logger.info('Music data:', JSON.stringify(musicData, null, 2));

      const { outputPath, metadataPath } = this.getOutputPaths(isTest);

      // Set up text and timing conditioning
      const conditioning = [
        {
          prompt: musicData.prompt || "128 BPM tech house drum loop",
          seconds_start: 0,
          seconds_total: 30
        }
      ];

      // Generate audio using Stable Audio Open 1.0
      const output = await generate_diffusion_cond(
        this.model,
        steps=100,
        cfg_scale=7,
        conditioning=conditioning,
        sample_size=this.sampleSize,
        sigma_min=0.3,
        sigma_max=500,
        sampler_type="dpmpp-3m-sde",
        device=this.device
      );

      // Rearrange audio batch to a single sequence
      const rearrangedOutput = rearrange(output, "b d n -> d (b n)");

      // Peak normalize, clip, convert to int16, and save to file
      const normalizedOutput = rearrangedOutput.to(torch.float32).div(torch.max(torch.abs(rearrangedOutput))).clamp(-1, 1).mul(32767).to(torch.int16).cpu();
      await torchaudio.save(outputPath, normalizedOutput, this.sampleRate);

      await this.saveMusicMetadata(metadataPath, path.basename(outputPath), musicData);

      return {
        filePath: outputPath,
        fileName: path.basename(outputPath)
      };
    } catch (error) {
      logger.error('Error generating music:', error);
      throw error;
    }
  }

  getOutputPaths(isTest) {
    let outputPath, metadataPath;

    if (isTest) {
      const testOutputDir = path.join(__dirname, '..', '..', '..', 'tests', 'test_output', 'music-v2');
      outputPath = path.join(testOutputDir, `background_music.wav`);
      metadataPath = path.join(testOutputDir, 'metadata.json');
    } else {
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
      const promptDir = path.join(config.output.directory, 'music-v2', `${dateString}_${timeString}`, `prompt_1`);
      outputPath = path.join(promptDir, `background_music.wav`);
      metadataPath = path.join(promptDir, 'metadata.json');
    }

    return { outputPath, metadataPath };
  }

  async saveMusicMetadata(metadataPath, fileName, musicData) {
    let metadata = {
      musicFile: fileName,
      title: musicData.title,
      tags: musicData.tags,
      instrumental: musicData.instrumental
    };

    await fs.mkdir(path.dirname(metadataPath), { recursive: true });
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    logger.info(`Metadata saved to ${metadataPath}`);
  }
}

module.exports = MusicGenService;
const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV || 'development']);
const path = require('path');
const fs = require('fs').promises;
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');
const storageService = require('../../../shared/utils/storage');

class MusicDataAccess {
    constructor() {
        this.baseOutputDir = path.join(config.output.directory, 'music');
    }

    async createMusicOutput(jobId, musicData) {
        try {
            logger.info(`Creating music output record for job ${jobId}`);

            // Create output directory structure
            const currentDate = new Date();
            const dateString = currentDate.toISOString().split('T')[0];
            const outputDir = path.join(this.baseOutputDir, dateString, jobId);
            await fs.mkdir(outputDir, { recursive: true });

            // Move the temp file to final location
            const finalFileName = `background_music.mp3`;
            const finalFilePath = path.join(outputDir, finalFileName);
            
            if (musicData.tempFilePath) {
                await fs.rename(musicData.tempFilePath, finalFilePath);
            }

            // Upload to storage
            const storageResult = await storageService.uploadFile(finalFilePath, 'music');
            logger.info('Music uploaded to storage successfully');

            // Prepare database record
            const record = {
                job_id: jobId,
                title: musicData.title,
                style: musicData.style || '',
                lyric: musicData.lyric || null,
                instrumental: musicData.instrumental,
                file_path: finalFilePath,
                storage_key: storageResult.storageKey,
                public_url: storageResult.url,
                created_at: new Date(),
                metadata: JSON.stringify({
                    generationId: musicData.metadata.generationId,
                    created_at: musicData.metadata.created_at,
                    generatedAt: musicData.metadata.generatedAt
                })
            };

            // Save to database
            const [id] = await knex('music_outputs').insert(record).returning('music_output_id');
            logger.info(`Created music output record with ID: ${id}`);

            // Save metadata file
            const metadataPath = path.join(outputDir, 'metadata.json');
            await fs.writeFile(
                metadataPath, 
                JSON.stringify({
                    fileName: finalFileName,
                    title: musicData.title,
                    style: musicData.style,
                    lyric: musicData.lyric || null,
                    instrumental: musicData.instrumental,
                    file_path: finalFilePath,
                    storage_key: storageResult.storageKey,
                    public_url: storageResult.url,
                    created_at: new Date(),
                    metadata: JSON.stringify({
                        generationId: musicData.metadata.generationId,
                        created_at: musicData.metadata.created_at,
                        generatedAt: musicData.metadata.generatedAt
                    })
                }, null, 2)
            );

            return {
                music_output_id: id,
                ...record
            };
        } catch (error) {
            logger.error('Error creating music output:', error);
            throw error;
        }
    }

    async getMusicByJobId(jobId) {
        try {
            logger.info(`Fetching music output for job ${jobId}`);
            const music = await knex('music_outputs')
                .where('job_id', jobId)
                .first();

            if (!music) {
                logger.warn(`No music found for job ${jobId}`);
                return null;
            }

            return music;
        } catch (error) {
            logger.error('Error fetching music by job ID:', error);
            throw error;
        }
    }

    async updateMusicMetadata(musicId, metadata) {
        try {
            logger.info(`Updating metadata for music output ${musicId}`);
            const [updated] = await knex('music_outputs')
                .where('music_output_id', musicId)
                .update({
                    metadata: JSON.stringify(metadata),
                    updated_at: new Date()
                })
                .returning('*');

            if (!updated) {
                throw new Error(`Music output ${musicId} not found`);
            }

            // Update metadata file if it exists
            const musicRecord = await this.getMusicByJobId(updated.job_id);
            if (musicRecord && musicRecord.file_path) {
                const metadataPath = path.join(
                    path.dirname(musicRecord.file_path),
                    'metadata.json'
                );
                try {
                    const existingMetadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
                    await fs.writeFile(
                        metadataPath,
                        JSON.stringify({ ...existingMetadata, ...metadata }, null, 2)
                    );
                } catch (error) {
                    logger.warn(`Could not update metadata file: ${error.message}`);
                }
            }

            return updated;
        } catch (error) {
            logger.error('Error updating music metadata:', error);
            throw error;
        }
    }

    async deleteMusic(musicId) {
        try {
            logger.info(`Deleting music output ${musicId}`);
            const music = await knex('music_outputs')
                .where('music_output_id', musicId)
                .first();

            if (!music) {
                throw new Error(`Music output ${musicId} not found`);
            }

            // Delete the file if it exists
            if (music.file_path) {
                try {
                    await fs.unlink(music.file_path);
                    const metadataPath = path.join(
                        path.dirname(music.file_path),
                        'metadata.json'
                    );
                    await fs.unlink(metadataPath);
                } catch (error) {
                    logger.warn(`Could not delete music files: ${error.message}`);
                }
            }

            // Delete from database
            await knex('music_outputs')
                .where('music_output_id', musicId)
                .del();

            return true;
        } catch (error) {
            logger.error('Error deleting music:', error);
            throw error;
        }
    }
}

module.exports = new MusicDataAccess();
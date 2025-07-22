/**
 * Webhook Events Data Access
 * 
 * This module provides a clean interface for interacting with the webhook_events table,
 * which is crucial for ensuring idempotent processing of webhooks.
 */
const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');

const WEBHOOK_EVENTS_TABLE = 'webhook_events';

class WebhookEventsDataAccess {
  /**
   * Find a webhook event by its ID.
   * @param {string} eventId - The Stripe event ID.
   * @returns {Promise<Object|null>} The event object or null if not found.
   */
  async findEventById(eventId) {
    try {
      return await knex(WEBHOOK_EVENTS_TABLE).where('event_id', eventId).first();
    } catch (error) {
      logger.error(`Error finding webhook event by ID ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Log a new webhook event.
   * @param {Object} event - The Stripe event object.
   * @returns {Promise<Object>} The newly created event log record.
   */
  async logEvent(event) {
    try {
      const [newEvent] = await knex(WEBHOOK_EVENTS_TABLE)
        .insert({
          event_id: event.id,
          event_type: event.type,
          event_data: event,
          processing_attempts: 1,
        })
        .returning('*');
      logger.info(`Webhook event logged: ${event.id}`);
      return newEvent;
    } catch (error) {
      logger.error(`Error logging webhook event ${event.id}:`, error);
      throw error;
    }
  }

  /**
   * Update a webhook event record.
   * @param {string} eventId - The ID of the event to update.
   * @param {Object} updates - The fields to update.
   * @returns {Promise<Object>} The updated event record.
   */
  async updateEvent(eventId, updates) {
    try {
      const [updatedEvent] = await knex(WEBHOOK_EVENTS_TABLE)
        .where('event_id', eventId)
        .update({
          ...updates,
          processing_attempts: knex.raw('processing_attempts + 1'),
        })
        .returning('*');
      logger.info(`Webhook event updated: ${eventId}`, updates);
      return updatedEvent;
    } catch (error) {
      logger.error(`Error updating webhook event ${eventId}:`, error);
      throw error;
    }
  }
}

module.exports = new WebhookEventsDataAccess(); 
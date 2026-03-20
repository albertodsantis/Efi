import { Router } from 'express';
import { google } from 'googleapis';
import type {
  CalendarSyncDownRequest,
  CalendarSyncDownResponse,
  CalendarSyncRequest,
  CalendarSyncResponse,
} from '@shared';

type OAuthClient = {
  setCredentials: (tokens: unknown) => void;
};

export function createCalendarRouter(oauth2Client: OAuthClient) {
  const router = Router();

  router.post('/sync', async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client as any });
    const { task } = req.body as CalendarSyncRequest;

    try {
      const event = {
        summary: `Entrega: ${task.title}`,
        description: `Partner: ${task.partnerName}\n\n${task.description}`,
        start: {
          date: task.dueDate,
          timeZone: 'UTC',
        },
        end: {
          date: task.dueDate,
          timeZone: 'UTC',
        },
      };

      let result;
      if (task.gcalEventId) {
        result = await calendar.events.update({
          calendarId: 'primary',
          eventId: task.gcalEventId,
          requestBody: event,
        });
      } else {
        result = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
        });
      }

      const response: CalendarSyncResponse = {
        success: true,
        eventId: result.data.id ?? null,
      };

      res.json(response);
    } catch (error) {
      console.error('Error syncing to calendar', error);
      res.status(500).json({ error: 'Failed to sync to calendar' });
    }
  });

  router.post('/sync-down', async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client as any });
    const { eventIds } = req.body as CalendarSyncDownRequest;

    if (!eventIds || !Array.isArray(eventIds)) {
      return res.status(400).json({ error: 'eventIds array is required' });
    }

    try {
      const updatedEvents: CalendarSyncDownResponse['updatedEvents'] = [];

      for (const eventId of eventIds) {
        try {
          const response = await calendar.events.get({
            calendarId: 'primary',
            eventId,
          });

          if (response.data?.start) {
            const date =
              response.data.start.date ||
              (response.data.start.dateTime ? response.data.start.dateTime.split('T')[0] : null);

            if (date) {
              updatedEvents.push({
                eventId,
                dueDate: date,
              });
            }
          }
        } catch (error: any) {
          if (error.code !== 404) {
            console.error(`Error fetching event ${eventId}`, error);
          }
        }
      }

      const response: CalendarSyncDownResponse = {
        success: true,
        updatedEvents,
      };

      res.json(response);
    } catch (error) {
      console.error('Error syncing down from calendar', error);
      res.status(500).json({ error: 'Failed to sync down from calendar' });
    }
  });

  return router;
}

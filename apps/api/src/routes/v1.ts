import { Router } from 'express';
import type {
  AppBootstrapResponse,
  CreateContactRequest,
  CreatePartnerRequest,
  CreateTaskRequest,
  CreateTemplateRequest,
  DashboardSummaryResponse,
  SettingsResponse,
  UpdateContactRequest,
  UpdatePartnerRequest,
  UpdateProfileRequest,
  UpdateSettingsRequest,
  UpdateTaskRequest,
} from '@shared';
import type { PostgresAppStore } from '../db/repository';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Bad request';
}

export function createV1Router(appStore: PostgresAppStore) {
  const router = Router();

  router.get('/bootstrap', async (_req, res) => {
    try {
      const response: AppBootstrapResponse = {
        appState: await appStore.getSnapshot(),
      };
      res.json(response);
    } catch (error) {
      console.error('Bootstrap error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/dashboard/summary', async (_req, res) => {
    try {
      const response: DashboardSummaryResponse = await appStore.getDashboardSummary();
      res.json(response);
    } catch (error) {
      console.error('Dashboard summary error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/tasks', async (_req, res) => {
    try {
      res.json(await appStore.listTasks());
    } catch (error) {
      console.error('List tasks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/tasks', async (req, res) => {
    try {
      const task = await appStore.createTask(req.body as CreateTaskRequest);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.delete('/tasks/:taskId', async (req, res) => {
    try {
      const result = await appStore.deleteTask(req.params.taskId);
      if (!result.success) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(result);
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.patch('/tasks/:taskId', async (req, res) => {
    try {
      const task = await appStore.updateTask(req.params.taskId, req.body as UpdateTaskRequest);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      return res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.get('/partners', async (_req, res) => {
    try {
      res.json(await appStore.listPartners());
    } catch (error) {
      console.error('List partners error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/partners', async (req, res) => {
    try {
      const partner = await appStore.createPartner(req.body as CreatePartnerRequest);
      res.status(201).json(partner);
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.patch('/partners/:partnerId', async (req, res) => {
    try {
      const partner = await appStore.updatePartner(
        req.params.partnerId,
        req.body as UpdatePartnerRequest,
      );
      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' });
      }
      res.json(partner);
    } catch (error) {
      return res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.post('/partners/:partnerId/contacts', async (req, res) => {
    try {
      const contact = await appStore.addContact(
        req.params.partnerId,
        req.body as CreateContactRequest,
      );
      if (!contact) {
        return res.status(404).json({ error: 'Partner not found' });
      }
      res.status(201).json(contact);
    } catch (error) {
      return res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.patch('/contacts/:contactId', async (req, res) => {
    try {
      const contact = await appStore.updateContact(
        req.params.contactId,
        req.body as UpdateContactRequest,
      );
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      res.json(contact);
    } catch (error) {
      return res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.delete('/contacts/:contactId', async (req, res) => {
    try {
      const result = await appStore.deleteContact(req.params.contactId);
      if (!result.success) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      res.json(result);
    } catch (error) {
      console.error('Delete contact error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/profile', async (_req, res) => {
    try {
      res.json(await appStore.getProfile());
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.patch('/profile', async (req, res) => {
    try {
      const profile = await appStore.updateProfile(req.body as UpdateProfileRequest);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.get('/settings', async (_req, res) => {
    try {
      const response: SettingsResponse = await appStore.getSettings();
      res.json(response);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.patch('/settings', async (req, res) => {
    try {
      const response = await appStore.updateSettings(req.body as UpdateSettingsRequest);
      res.json(response);
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.get('/templates', async (_req, res) => {
    try {
      res.json(await appStore.listTemplates());
    } catch (error) {
      console.error('List templates error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/templates', async (req, res) => {
    try {
      const template = await appStore.createTemplate(req.body as CreateTemplateRequest);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.delete('/templates/:templateId', async (req, res) => {
    try {
      const result = await appStore.deleteTemplate(req.params.templateId);
      if (!result.success) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(result);
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/tasks/:taskId/status-history', async (req, res) => {
    try {
      const history = await appStore.getTaskStatusHistory(req.params.taskId);
      res.json(history);
    } catch (error) {
      console.error('Task status history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/partners/:partnerId/status-history', async (req, res) => {
    try {
      const history = await appStore.getPartnerStatusHistory(req.params.partnerId);
      res.json(history);
    } catch (error) {
      console.error('Partner status history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

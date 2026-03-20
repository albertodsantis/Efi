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
import { appStore } from '../store/appStore';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Bad request';
}

export function createV1Router() {
  const router = Router();

  router.get('/bootstrap', (_req, res) => {
    const response: AppBootstrapResponse = {
      appState: appStore.getSnapshot(),
    };

    res.json(response);
  });

  router.get('/dashboard/summary', (_req, res) => {
    const response: DashboardSummaryResponse = appStore.getDashboardSummary();
    res.json(response);
  });

  router.get('/tasks', (_req, res) => {
    res.json(appStore.listTasks());
  });

  router.post('/tasks', (req, res) => {
    try {
      const task = appStore.createTask(req.body as CreateTaskRequest);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.delete('/tasks/:taskId', (req, res) => {
    const result = appStore.deleteTask(req.params.taskId);
    if (!result.success) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result);
  });

  router.patch('/tasks/:taskId', (req, res) => {
    try {
      const task = appStore.updateTask(req.params.taskId, req.body as UpdateTaskRequest);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error) {
      return res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.get('/partners', (_req, res) => {
    res.json(appStore.listPartners());
  });

  router.post('/partners', (req, res) => {
    try {
      const partner = appStore.createPartner(req.body as CreatePartnerRequest);
      res.status(201).json(partner);
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.patch('/partners/:partnerId', (req, res) => {
    try {
      const partner = appStore.updatePartner(
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

  router.post('/partners/:partnerId/contacts', (req, res) => {
    try {
      const contact = appStore.addContact(
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

  router.patch('/contacts/:contactId', (req, res) => {
    try {
      const contact = appStore.updateContact(
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

  router.delete('/contacts/:contactId', (req, res) => {
    const result = appStore.deleteContact(req.params.contactId);
    if (!result.success) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(result);
  });

  router.get('/profile', (_req, res) => {
    res.json(appStore.getProfile());
  });

  router.patch('/profile', (req, res) => {
    try {
      const profile = appStore.updateProfile(req.body as UpdateProfileRequest);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.get('/settings', (_req, res) => {
    const response: SettingsResponse = appStore.getSettings();
    res.json(response);
  });

  router.patch('/settings', (req, res) => {
    try {
      const response = appStore.updateSettings(req.body as UpdateSettingsRequest);
      res.json(response);
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.get('/templates', (_req, res) => {
    res.json(appStore.listTemplates());
  });

  router.post('/templates', (req, res) => {
    try {
      const template = appStore.createTemplate(req.body as CreateTemplateRequest);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.delete('/templates/:templateId', (req, res) => {
    const result = appStore.deleteTemplate(req.params.templateId);
    if (!result.success) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result);
  });

  return router;
}

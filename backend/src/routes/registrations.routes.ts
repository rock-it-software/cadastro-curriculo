import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ApiError } from '../lib/api-error';
import { createRegistration } from '../services/registration.service';
import { downloadRegistrationCv, searchRegistrations } from '../services/registration-search.service';
import { MAX_CV_FILE_SIZE_BYTES, RegistrationInput } from '../types/registration';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CV_FILE_SIZE_BYTES },
});

export const registrationsRouter = Router();

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return [value];
  return [];
}

registrationsRouter.post(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('cvFile')(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        next(new ApiError(400, 'file_too_large', 'O arquivo deve ter no máximo 4MB.'));
        return;
      }
      if (err) {
        next(err);
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const input: RegistrationInput = {
        fullName: String(body.fullName ?? ''),
        birthDate: String(body.birthDate ?? ''),
        email: String(body.email ?? ''),
        phone: String(body.phone ?? ''),
        city: String(body.city ?? ''),
        stateUf: String(body.stateUf ?? ''),
        desiredRoles: asArray(body.desiredRoles),
      };

      const file = req.file
        ? {
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            buffer: req.file.buffer,
          }
        : undefined;

      const record = await createRegistration(input, file);
      res.status(201).json({ id: record.id, createdAt: record.createdAt });
    } catch (err) {
      next(err);
    }
  },
);

registrationsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await searchRegistrations(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

registrationsRouter.get('/:id/cv', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const download = await downloadRegistrationCv(String(req.params.id));
    const asciiFallback = download.fileName.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, "'");
    const encoded = encodeURIComponent(download.fileName);
    res.setHeader('Content-Type', download.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`,
    );
    res.status(200).send(download.buffer);
  } catch (err) {
    next(err);
  }
});

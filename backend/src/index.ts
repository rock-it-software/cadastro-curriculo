import express, { Express, NextFunction, Request, Response } from 'express';
import { registrationsRouter } from './routes/registrations.routes';
import { ApiErrorBody } from './types/registration';

export function createApp(): Express {
  const app = express();

  app.use('/api/registrations', registrationsRouter);

  app.use((_req: Request, res: Response) => {
    const body: ApiErrorBody = { error: 'not_found', message: 'Recurso não encontrado.' };
    res.status(404).json(body);
  });

  // Central error handler: Multer file-size/type rejections and any
  // uncaught service/repository error land here with the shared envelope.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err && typeof err === 'object' && 'httpStatus' in err) {
      const typed = err as { httpStatus: number; error: string; message: string; fields?: string[] };
      const body: ApiErrorBody = { error: typed.error, message: typed.message, fields: typed.fields };
      res.status(typed.httpStatus).json(body);
      return;
    }

    console.error(err);
    const body: ApiErrorBody = {
      error: 'internal_error',
      message: 'Não foi possível salvar. Tente novamente.',
    };
    res.status(500).json(body);
  });

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3000);
  const app = createApp();
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

import { Request, Response, NextFunction } from 'express';
import { userIdSchema, type UserId } from 'shared';

declare global {
  namespace Express {
    interface Request {
      userId: UserId;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const userIdHeader = req.headers['x-user-id'];

  const result = userIdSchema.safeParse(userIdHeader);
  if (!result.success) {
    res.status(401).json({ error: 'Wymagany nagłówek X-User-Id: A lub B' });
    return;
  }

  req.userId = result.data;
  next();
}

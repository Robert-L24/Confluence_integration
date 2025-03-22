import { Request, Response, NextFunction } from 'express';

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies?.["confluenceToken"]) {
    console.log(`No access token found. Redirecting to ${process.env.CONFLUENCE_AUTH_URL}`);
    return res.redirect(`/auth/authorize?redirectTo=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
}

import express, { Request, Response, NextFunction } from 'express';
import { Authenticator } from '../services/authenticator';
import { getCloudId } from '../services/confluenceClient';

const router = express.Router();

// redirect URL memory
const stateStore: Record<string, string> = {};

const clientId = process.env.CLIENT_ID || '';
const clientSecret = process.env.CLIENT_SECRET || '';
const redirectUri = process.env.REDIRECT_URI || '';
const tokenUrl = process.env.TOKEN_URL || '';
const authEndpoint = process.env.CONFLUENCE_AUTH_URL || '';

const authenticator = new Authenticator(clientId, clientSecret, redirectUri, tokenUrl, authEndpoint);

router.get('/authorize', (req: Request, res: Response) => {
  const redirectTo = req.query.redirectTo as string | undefined;
  const stateValue = authenticator.generateState();
  if (redirectTo) {
    stateStore[stateValue] = redirectTo;
  }
  const authUrl = authenticator.getAuthorizationUrl(stateValue);
  console.log(`Redirecting to Auth URL: ${authUrl}`);
  res.redirect(authUrl);
  
});

router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state) {
    res.status(400).send("Missing code");
    return;
  }
  if (!stateStore.hasOwnProperty(state)) {
    res.status(400).send("Invalid state");
    return;
  }
  try {
    const { accessToken, expiresInSec } = await authenticator.getAccessToken(code);
    console.log("Access token obtained");
    // Setting the cookies for token and cloudId
    const cloudId = await getCloudId(accessToken);
    res.cookie("confluenceCloudId", cloudId, { maxAge: expiresInSec * 1000, httpOnly: true, sameSite: "lax" });
    res.cookie("confluenceToken", accessToken, { maxAge: expiresInSec * 1000, httpOnly: true, sameSite: "lax" });

    const redirectTo = stateStore[state] || '/';
    delete stateStore[state];
    console.log(`Redirecting back to ${redirectTo}`);
    res.redirect(302, redirectTo);
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    next(error);
  }
});

export default router;

export const testHelpers = process.env.NODE_ENV === 'test' ? {
  setAuthState: (state: string, redirectTo: string) => { stateStore[state] = redirectTo; }
} : undefined;

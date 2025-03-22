import request from 'supertest';
import { expect } from 'chai';
import nock from 'nock';
import app from '../src/index';
import { testHelpers } from '../src/routes/auth';

// Replace these with your actual API URLs as configured in your .env file.
const CONFLUENCE_API_URL = process.env.CONFLUENCE_API_URL || 'https://api.confluence.example.com';
const TOKEN_URL = process.env.TOKEN_URL || 'https://auth.confluence.example.com/oauth/token';
const CLOUD_ID_URL = process.env.CLOUD_ID_URL || 'https://api.atlassian.com/oauth/token/accessible-resources';

describe('Integration Tests', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('Pages Endpoints', () => {
    describe('GET /pages/space/:spaceKey', () => {
      it('should return pages list when token is valid and space exists', async () => {
        // First stub: getSpaceIdByKey call
        nock(CONFLUENCE_API_URL)
          .get(uri => uri.includes('/wiki/api/v2/spaces'))
          .query({ keys: 'TEST' })
          .reply(200, { results: [{ id: 123, key: 'TEST' }] });

        // Second stub: getAllPagesInSpace call
        nock(CONFLUENCE_API_URL)
          .get(`/fakeCloudId/wiki/api/v2/spaces/123/pages`)
          .reply(200, { results: [{ id: 1, title: 'Page 1' }] });

        const res = await request(app)
          .get('/pages/space/TEST')
          .set('Cookie', [
            'confluenceToken=fakeToken',
            'confluenceCloudId=fakeCloudId'
          ]);

        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal([{ id: 1, title: 'Page 1' }]);
      });

      it('should return 401 and clear cookies when API returns unauthorized', async () => {
        // Stub the getSpaceIdByKey call to return unauthorized error.
        nock(CONFLUENCE_API_URL)
          .get(uri => uri.includes('/wiki/api/v2/spaces'))
          .query({ keys: 'TEST' })
          .reply(401);

        const res = await request(app)
          .get('/pages/space/TEST')
          .set('Cookie', [
            'confluenceToken=fakeToken',
            'confluenceCloudId=fakeCloudId'
          ]);

        expect(res.status).to.equal(401);
        expect(res.text).to.include('Authentication error');
      });

      it('should return 404 when the space does not exist', async () => {
        // Stub the getSpaceIdByKey call to return 404.
        nock(CONFLUENCE_API_URL)
          .get(uri => uri.includes('/wiki/api/v2/spaces'))
          .query({ keys: 'INVALID' })
          .reply(404);

        const res = await request(app)
          .get('/pages/space/INVALID')
          .set('Cookie', [
            'confluenceToken=fakeToken',
            'confluenceCloudId=fakeCloudId'
          ]);

        expect(res.status).to.equal(404);
        expect(res.text).to.include("Requested space doesn't exist");
      });

      it('should return 500 for other errors', async () => {
        // Stub the getSpaceIdByKey call to return an unexpected error.
        nock(CONFLUENCE_API_URL)
          .get(uri => uri.includes('/wiki/api/v2/spaces'))
          .query({ keys: 'TEST' })
          .reply(500);

        const res = await request(app)
          .get('/pages/space/TEST')
          .set('Cookie', [
            'confluenceToken=fakeToken',
            'confluenceCloudId=fakeCloudId'
          ]);

        expect(res.status).to.equal(500);
        expect(res.text).to.include("Error fetching from Confluence");
      });
    });

    describe('GET /pages/:pageId', () => {
      it('should return page content when valid token and page id exist', async () => {
        // Stub for getPageById call
        nock(CONFLUENCE_API_URL)
          .get(`/fakeCloudId/wiki/api/v2/pages/123`)
          .query({ 'body-format': 'view' })
          .reply(200, {
            title: 'Page Title',
            body: { view: { value: '<p>Content</p>' } }
          });

        const res = await request(app)
          .get('/pages/123')
          .set('Cookie', [
            'confluenceToken=fakeToken',
            'confluenceCloudId=fakeCloudId'
          ]);

        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal({
          title: 'Page Title',
          body: '<p>Content</p>'
        });
      });

      it('should return 404 when the page id does not exist', async () => {
        nock(CONFLUENCE_API_URL)
          .get(`/fakeCloudId/wiki/api/v2/pages/invalidId`)
          .query({ 'body-format': 'view' })
          .reply(404);

        const res = await request(app)
          .get('/pages/invalidId')
          .set('Cookie', [
            'confluenceToken=fakeToken',
            'confluenceCloudId=fakeCloudId'
          ]);

        expect(res.status).to.equal(404);
        expect(res.text).to.include("Requested id doesn't exist");
      });

      it('should return 401 when API returns unauthorized', async () => {
        nock(CONFLUENCE_API_URL)
          .get(`/fakeCloudId/wiki/api/v2/pages/123`)
          .query({ 'body-format': 'view' })
          .reply(401);

        const res = await request(app)
          .get('/pages/123')
          .set('Cookie', [
            'confluenceToken=fakeToken',
            'confluenceCloudId=fakeCloudId'
          ]);

        expect(res.status).to.equal(401);
        expect(res.text).to.include('Authentication error');
      });

      it('should return 500 for other errors', async () => {
        nock(CONFLUENCE_API_URL)
          .get(`/fakeCloudId/wiki/api/v2/pages/123`)
          .query({ 'body-format': 'view' })
          .reply(500);

        const res = await request(app)
          .get('/pages/123')
          .set('Cookie', [
            'confluenceToken=fakeToken',
            'confluenceCloudId=fakeCloudId'
          ]);

        expect(res.status).to.equal(500);
        expect(res.text).to.include("Error fetching from Confluence");
      });
    });
  });

  describe('Authorization Flow', () => {
    it('should redirect to the Confluence authorization URL on /auth/authorize', async () => {
      const res = await request(app)
        .get('/auth/authorize?redirectTo=/pages/TEST');

      expect(res.status).to.equal(302);
      expect(res.headers.location).to.include(process.env.CONFLUENCE_AUTH_URL || '');
    });

    it('should exchange code for token and set cookies on /auth/callback', async () => {
      // Pre-populate a valid state using the helper.
      const testState = 'teststate123';
      if (testHelpers) {
        testHelpers.setAuthState(testState, '/dashboard');
      }

      // Stub the POST to tokenUrl for exchanging the code
      nock(TOKEN_URL)
        .post(uri => uri.includes(''))
        .reply(200, { access_token: 'fakeAccessToken', expires_in: 3600 });

      // Stub the GET to CLOUD_ID_URL to return a cloud id.
      nock(CLOUD_ID_URL)
        .get(uri => uri.includes(''))
        .reply(200, [{ id: 'fakeCloudId' }]);

      const res = await request(app)
        .get(`/auth/callback?code=fakeCode&state=${testState}`);

      expect(res.status).to.equal(302);
      expect(res.headers['set-cookie']).to.satisfy((cookies: string[]) =>
        cookies.some(c => c.includes('confluenceToken')) &&
        cookies.some(c => c.includes('confluenceCloudId'))
      );
      expect(res.headers.location).to.equal('/dashboard');
    });
  });
});

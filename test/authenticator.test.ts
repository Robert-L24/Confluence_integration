import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import querystring from 'querystring';
import { Authenticator } from '../src/services/authenticator';


describe('Authenticator Service', () => {
  const clientId = 'testClientId';
  const clientSecret = 'testClientSecret';
  const redirectUri = 'http://localhost/callback';
  const tokenUrl = 'http://auth.example.com/token';
  const authEndpoint = 'http://auth.example.com/authorize';

  let authenticator: Authenticator;

  beforeEach(() => {
    authenticator = new Authenticator(clientId, clientSecret, redirectUri, tokenUrl, authEndpoint);
  });

  describe('generateState', () => {
    it('should return a string and generate unique states', () => {
      const state1 = authenticator.generateState();
      const state2 = authenticator.generateState();
      expect(state1).to.be.a('string');
      expect(state2).to.be.a('string');
      expect(state1).to.not.equal(state2);
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should return a valid URL with query parameters', () => {
      const state = 'dummyState';
      const url = authenticator.getAuthorizationUrl(state);
      expect(url).to.include(authEndpoint);
      expect(url).to.include(`client_id=${clientId}`);
      expect(url).to.include(`redirect_uri=${encodeURIComponent(redirectUri)}`);
      expect(url).to.include(`state=${state}`);
      expect(url).to.include('response_type=code');
    });
  });

  describe('getAccessToken', () => {
    let axiosPostStub: sinon.SinonStub;

    beforeEach(() => {
      axiosPostStub = sinon.stub(axios, 'post');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should return access token on successful request', async () => {
      const dummyToken = 'dummy_access_token';
      axiosPostStub.resolves({ data: { access_token: dummyToken, expires_in: 200 } });

      const token = await authenticator.getAccessToken('dummyCode');
      expect(token.accessToken).to.equal(dummyToken);
      expect(token.expiresInSec).to.equal(200);

      const data = querystring.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: 'dummyCode',
        redirect_uri: redirectUri,
      });
      sinon.assert.calledWith(axiosPostStub, tokenUrl, data, sinon.match.has('headers'));
    });

    it('should throw an error when axios post fails', async () => {
      axiosPostStub.rejects(new Error('Network error'));
      try {
        await authenticator.getAccessToken('dummyCode');
        throw new Error('Expected error was not thrown');
      } catch (error: any) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('Network error');
      }
    });
  });
});

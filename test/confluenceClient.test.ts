import sinon from 'sinon';
import axios from 'axios';
import { expect } from 'chai';
import * as confluenceClient from '../src/services/confluenceClient';

describe('Confluence Client Service', () => {
  let axiosGetStub: sinon.SinonStub;
  const dummyToken = 'dummy_token';
  const dummyCloudId = 'cloud123';
  const dummySpaceId = 456;

  beforeEach(() => {
    axiosGetStub = sinon.stub(axios, 'get');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getAllPagesInSpace', () => {
    it('should return pages list on successful request', async () => {
      axiosGetStub.onCall(0).resolves({ data: { results: [{ id: dummySpaceId, key: 'TEST' }] } });
      const fakePages = { results: [{ id: 1, title: 'Test Page' }] };
      axiosGetStub.onCall(1).resolves({ data: fakePages });

      const result = await confluenceClient.getAllPagesInSpace('TEST', dummyCloudId, dummyToken);
      expect(result).to.deep.equal(fakePages);
      sinon.assert.calledTwice(axiosGetStub);
    });

    it('should throw an error if pages API call fails', async () => {
      axiosGetStub.onCall(0).resolves({ data: { results: [{ id: dummySpaceId, key: 'TEST' }] } });
      axiosGetStub.onCall(1).rejects(new Error('API error'));

      try {
        await confluenceClient.getAllPagesInSpace('TEST', dummyCloudId, dummyToken);
        throw new Error('Expected error was not thrown');
      } catch (error: any) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('API error');
      }
    });
  });

  describe('getPageById', () => {
    it('should return page details on successful request', async () => {
      const fakePage = { title: 'Page Title', body: { view: { value: 'Page content' } } };
      axiosGetStub.onCall(0).resolves({ data: fakePage });

      const result = await confluenceClient.getPageById('12345', dummyCloudId, dummyToken);
      expect(result).to.deep.equal({ title: 'Page Title', body: 'Page content' });
      sinon.assert.calledOnce(axiosGetStub);
    });

    it('should throw an error if page API call fails', async () => {
      axiosGetStub.onCall(0).rejects(new Error('Page not found'));

      try {
        await confluenceClient.getPageById('12345', dummyCloudId, dummyToken);
        throw new Error('Expected error was not thrown');
      } catch (error: any) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('Page not found');
      }
    });
  });
});

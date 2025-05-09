import dotenv from 'dotenv';
import request from 'supertest';
import { getApp, shutdownApp } from './utils/testApp';
import { Server } from 'http';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateFakeUser, userCredentials } from './utils/testData';
import { getLoggedInAdmin, getLoggedInUser, getNewloggedInUser } from './utils/auth';
import { ExpectedPricingType } from '../main/utils/pricing-yaml2json';
import { getPricingFile } from './utils/service';

dotenv.config();

describe('Get public user information', function () {
  let app: Server;

  beforeAll(async function () {
    app = await getApp();
  });

  describe('GET /services', function () {
    it('Should return 200 and the services', async function () {
      const response = await request(app).get('/api/services');
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  })

  describe('POST /services', function () {
    it('Should return 201 and the created service: Given Pricing2Yaml file in the request', async function () {
      const pricingFilePath = getPricingFile();
      const response = await request(app)
        .post('/api/services')
        .attach('pricing', pricingFilePath);
      expect(response.status).toEqual(201);
      expect(response.body).toBeDefined();
      expect(Object.keys(response.body.activePricings).length).greaterThan(0);
      expect((Object.values(response.body.activePricings)[0] as any).id).toBeDefined();
      expect((Object.values(response.body.activePricings)[0] as any).url).toBeUndefined();
      expect(response.body.archivedPricings).toBeUndefined();
    });

    it('Should return 201 and the created service: Given url in the request', async function () {
      const response = await request(app)
        .post('/api/services')
        .send({
          pricing: "https://sphere.score.us.es/static/collections/63f74bf8eeed64058364b52e/IEEE TSC 2025/notion/2025.yml",
        })
      expect(response.status).toEqual(201);
      expect(response.body).toBeDefined();
      expect(Object.keys(response.body.activePricings).length).greaterThan(0);
      expect((Object.values(response.body.activePricings)[0] as any).id).toBeUndefined();
      expect((Object.values(response.body.activePricings)[0] as any).url).toBeDefined();
      expect(response.body.archivedPricings).toBeUndefined();
    });
  })

  describe('GET /services/{serviceName}', function () {
    it('Should return 200: Given existent service name in lower case', async function () {
      const response = await request(app).get('/api/services/zoom');
      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toBe(false);
      expect(response.body.name.toLowerCase()).toBe("zoom");
    });

    it('Should return 200: Given existent service name in upper case', async function () {
      const response = await request(app).get('/api/services/ZOOM');
      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toBe(false);
      expect(response.body.name.toLowerCase()).toBe("zoom");
    });

    it('Should return 404 due to service not found', async function () {
      const response = await request(app).get('/api/services/unexistent-service');
      expect(response.status).toEqual(404);
      expect(response.body.error).toBe("Service unexistent-service not found");
    });
  })

  describe('PUT /services/{serviceName}', function () {
    it('Should return 200 and the updated pricing', async function () {
      const responseBefore = await request(app).get('/api/services/zoom');
      expect(responseBefore.status).toEqual(200);
      expect(responseBefore.body.name.toLowerCase()).toBe("zoom");

      const responseUpdate = await request(app).put('/api/services/zoom').send({name: "New Zoom"});
      expect(responseUpdate.status).toEqual(200);
      expect(responseUpdate.body).toBeDefined();
      expect(responseUpdate.body.name).toEqual("New Zoom");

      const responseAfter = await request(app).get('/api/services/New Zoom');
      expect(responseAfter.status).toEqual(200);
      expect(responseAfter.body.name.toLowerCase()).toBe("new zoom");

      await request(app).put('/api/services/zoom').send({name: "Zoom"});
    });

    it('Should return 200: Given existent service name in upper case', async function () {
      const response = await request(app).get('/api/services/ZOOM');
      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toBe(false);
      expect(response.body.name.toLowerCase()).toBe("zoom");
    });

    it('Should return 404 due to service not found', async function () {
      const response = await request(app).get('/api/services/unexistent-service');
      expect(response.status).toEqual(404);
      expect(response.body.error).toBe("Service unexistent-service not found");
    });
  })

  describe('GET /services/{serviceName}/pricings', function () {
    it('Should return 200: Given existent service name in lower case', async function () {
      const response = await request(app).get('/api/services/zoom/pricings');
      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].features).toBeDefined();
      expect(Object.keys(response.body[0].features).length).toBeGreaterThan(0);
      expect(response.body[0].usageLimits).toBeDefined();
      expect(response.body[0].plans).toBeDefined();
      expect(response.body[0].addOns).toBeDefined();

      const serviceResponse = await request(app).get('/api/services/zoom');
      expect(serviceResponse.status).toEqual(200);
      expect(serviceResponse.body.name.toLowerCase()).toBe("zoom");
      expect(response.body.map((p: ExpectedPricingType) => p.version).sort()).toEqual(Object.keys(serviceResponse.body.activePricings).sort());
    });

    it('Should return 200: Given existent service name in lower case and "archived" in query', async function () {
      const response = await request(app).get('/api/services/zoom/pricings?pricingStatus=archived');
      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].features).toBeDefined();
      expect(Object.keys(response.body[0].features).length).toBeGreaterThan(0);
      expect(response.body[0].usageLimits).toBeDefined();
      expect(response.body[0].plans).toBeDefined();
      expect(response.body[0].addOns).toBeDefined();

      const serviceResponse = await request(app).get('/api/services/zoom');
      expect(serviceResponse.status).toEqual(200);
      expect(serviceResponse.body.name.toLowerCase()).toBe("zoom");
      expect(response.body.map((p: ExpectedPricingType) => p.version).sort()).toEqual(Object.keys(serviceResponse.body.archivedPricings).sort());
    });

    it('Should return 200: Given existent service name in upper case', async function () {
      const response = await request(app).get('/api/services/ZOOM/pricings');
      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].features).toBeDefined();
      expect(Object.keys(response.body[0].features).length).toBeGreaterThan(0);
      expect(response.body[0].usageLimits).toBeDefined();
      expect(response.body[0].plans).toBeDefined();
      expect(response.body[0].addOns).toBeDefined();
    });

    it('Should return 404 due to service not found', async function () {
      const response = await request(app).get('/api/services/unexistent-service/pricings');
      expect(response.status).toEqual(404);
      expect(response.body.error).toBe("Service unexistent-service not found");
    });
  })

  describe('GET /services/{serviceName}/pricings/{pricingVersion}', function () {
    it('Should return 200: Given existent service name and pricing version', async function () {
      const response = await request(app).get('/api/services/zoom/pricings/2024');
      expect(response.status).toEqual(200);
      expect(response.body.features).toBeDefined();
      expect(Object.keys(response.body.features).length).toBeGreaterThan(0);
      expect(response.body.usageLimits).toBeDefined();
      expect(response.body.plans).toBeDefined();
      expect(response.body.addOns).toBeDefined();
      expect(response.body.id).toBeUndefined();
      expect(response.body._serviceId).toBeUndefined();
      expect(response.body._id).toBeUndefined();
    });

    it('Should return 200: Given existent service name in upper case and pricing version', async function () {
      const response = await request(app).get('/api/services/ZOOM/pricings/2024');
      expect(response.status).toEqual(200);
      expect(response.body.features).toBeDefined();
      expect(Object.keys(response.body.features).length).toBeGreaterThan(0);
      expect(response.body.usageLimits).toBeDefined();
      expect(response.body.plans).toBeDefined();
      expect(response.body.addOns).toBeDefined();
      expect(response.body.id).toBeUndefined();
      expect(response.body._serviceId).toBeUndefined();
      expect(response.body._id).toBeUndefined();
    });

    it('Should return 404 due to service not found', async function () {
      const response = await request(app).get('/api/services/unexistent-service/pricings/2024');
      expect(response.status).toEqual(404);
      expect(response.body.error).toBe("Service unexistent-service not found");
    });

    it('Should return 404 due to pricing not found', async function () {
      const response = await request(app).get('/api/services/zoom/pricings/unexistent-version');
      expect(response.status).toEqual(404);
      expect(response.body.error).toBe("Pricing version unexistent-version not found for service zoom");
    });
  })

  describe('DELETE /services', function () {
    it('Should return 200', async function () {
      // Checks if there are services to delete
      const responseIndexBeforeDelete = await request(app)
        .get('/api/services')

      expect(responseIndexBeforeDelete.status).toEqual(200);
      expect(Array.isArray(responseIndexBeforeDelete.body)).toBe(true);
      expect(responseIndexBeforeDelete.body.length).greaterThan(0);

      // Deletes all services
      const responseDelete = await request(app)
        .delete('/api/services')
      expect(responseDelete.status).toEqual(200);

      // Checks if there are no services after delete
      const responseIndexAfterDelete = await request(app)
        .get('/api/services')

      expect(responseIndexAfterDelete.status).toEqual(200);
      expect(Array.isArray(responseIndexAfterDelete.body)).toBe(true);
      expect(responseIndexAfterDelete.body.length).toBe(0);
    });
  })

  afterAll(async function () {
    await shutdownApp();
  });
});

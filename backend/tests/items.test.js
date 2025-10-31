const request = require('supertest');
const express = require('express');
const { sequelize, Item } = require('./setup');
const v1Router = require('../routes/v1')({ Item });

const app = express();
app.use(express.json());
app.use('/api/v1', v1Router);

describe('Items API', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  it('should return an empty array when no items exist', async () => {
    const res = await request(app).get('/api/v1/items');
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual([]);
  });
});

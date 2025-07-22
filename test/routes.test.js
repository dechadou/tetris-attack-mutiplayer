const request = require('supertest');
const app = require('../index');

describe('routes', () => {
  test('GET / returns index page', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Tetris Attack');
  });

  test('GET /solo returns game page', async () => {
    const res = await request(app).get('/solo');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Tetris Attack');
  });

  test('GET /room returns game page', async () => {
    const res = await request(app).get('/testroom');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Tetris Attack');
  });
});

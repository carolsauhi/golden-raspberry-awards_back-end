const request = require('supertest');
const { app, db } = require('./app');

let serverInstance;

const waitForDatabaseInitialization = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 1000); // Aguarda a inicialização do banco
  });

describe('Integration Tests for Movie API', () => {
  beforeAll(async () => {
    serverInstance = app; // Armazena a instância do servidor
    await waitForDatabaseInitialization(); // Aguarda a inicialização do banco
  });

  afterAll(() => {
    db.close(); // Fecha o banco de dados
  });

  test('GET / - should return API status', async () => {
    const response = await request(serverInstance).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'API is running' });
  });

  test('GET /movies - should return all movies from the database', async () => {
    const response = await request(serverInstance).get('/movies');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        {
          year: 1980,
          title: "Can't Stop the Music",
          studios: 'Associated Film Distribution',
          producers: 'Allan Carr',
          winner: 'yes',
        },
        {
          year: 1980,
          title: 'Cruising',
          studios: 'Lorimar Productions, United Artists',
          producers: 'Jerry Weintraub',
          winner: 'no',
        },
        // Add other rows as necessary
      ])
    );
  });

  test('GET /intervals - should return correct min and max award intervals', async () => {
    const response = await request(serverInstance).get('/intervals');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        min: expect.arrayContaining([
          {
            producer: expect.any(String),
            interval: expect.any(Number),
            previousWin: expect.any(Number),
            followingWin: expect.any(Number),
          },
        ]),
        max: expect.arrayContaining([
          {
            producer: expect.any(String),
            interval: expect.any(Number),
            previousWin: expect.any(Number),
            followingWin: expect.any(Number),
          },
        ]),
      })
    );
  });

});

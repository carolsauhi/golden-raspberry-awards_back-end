const { app } = require('./app');

const PORT = 3000;

// Iniciar o servidor
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = server;

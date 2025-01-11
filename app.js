const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const csvParser = require('csv-parser');

const app = express();
const PORT = 3000;

// Configure SQLite Database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS movies (
    year INTEGER,
    title TEXT,
    studios TEXT,
    producers TEXT,
    winner TEXT
)`);

// Multer configuration for uploads
const upload = multer({ dest: 'uploads/' }); // Temporary folder to store uploads

// Function to load data from CSV
const loadCSVData = (filePath) => {
    const data = [];
    fs.createReadStream(filePath)
        .pipe(csvParser({ separator: ';' })) // Adjusting to the correct delimiter
        .on('data', (row) => {
            data.push(row);
        })
        .on('end', () => {
            console.log('Arquivo CSV lido com sucesso.');

            // Insert data into the database
            const insertStmt = db.prepare(`INSERT INTO movies (year, title, studios, producers, winner) VALUES (?, ?, ?, ?, ?)`);

            data.forEach((movie) => {
                insertStmt.run(movie.year, movie.title, movie.studios, movie.producers, movie.winner || 'no', (err) => {
                    if (err) {
                        console.error('Erro ao inserir dados:', err.message);
                    }
                });
            });

            insertStmt.finalize();
            console.log('Dados inseridos no banco.');
        });
};

// Endpoint for file upload
app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = req.file.path;

    // Load data from uploaded CSV
    loadCSVData(filePath);

    res.status(200).send({ message: 'Arquivo processado com sucesso!', file: req.file });
});

// Endpoint to list all movies
app.get('/movies', (req, res) => {
    db.all(`SELECT * FROM movies`, [], (err, rows) => {
        if (err) {
            res.status(500).send({ error: 'Erro ao buscar filmes' });
        } else {
            res.json(rows);
        }
    });
});

// Endpoint to search for movie by title
app.get('/movies/:title', (req, res) => {
    const title = req.params.title;
    db.get(`SELECT * FROM movies WHERE title = ?`, [title], (err, row) => {
        if (err) {
            res.status(500).send({ error: 'Erro ao buscar filme' });
        } else if (!row) {
            res.status(404).send({ error: 'Filme não encontrado' });
        } else {
            res.json(row);
        }
    });
});


// ********************************************************************

// Função para calcular intervalos entre prêmios
const calculateAwardIntervals = (callback) => {
  const query = `
      SELECT producers, year
      FROM movies
      WHERE winner = 'yes'
  `;

  db.all(query, [], (err, rows) => {
      if (err) {
          callback(err, null);
          return;
      }

      // Mapeando produtores para suas respectivas listas de anos de prêmios
      const producerAwards = {};
      rows.forEach((row) => {
          const producers = row.producers.split(','); // Separar múltiplos produtores
          producers.forEach((producer) => {
              const trimmedProducer = producer.trim();
              if (!producerAwards[trimmedProducer]) {
                  producerAwards[trimmedProducer] = [];
              }
              producerAwards[trimmedProducer].push(row.year);
          });
      });

      // Calculando intervalos
      const producerIntervals = [];
      Object.keys(producerAwards).forEach((producer) => {
          const years = producerAwards[producer].sort((a, b) => a - b); // Ordenar os anos
          if (years.length > 1) {
              for (let i = 1; i < years.length; i++) {
                  producerIntervals.push({
                      producer,
                      interval: years[i] - years[i - 1],
                      previousWin: years[i - 1],
                      followingWin: years[i],
                  });
              }
          }
      });

      callback(null, producerIntervals);
  });
};

// Endpoint para obter o produtor com o maior intervalo entre prêmios consecutivos
app.get('/producers/longest-interval', (req, res) => {
  calculateAwardIntervals((err, intervals) => {
      if (err) {
          res.status(500).send({ error: 'Erro ao calcular intervalos.' });
          return;
      }

      if (intervals.length === 0) {
          res.status(404).send({ error: 'Nenhum intervalo encontrado entre prêmios.' });
          return;
      }

      const maxInterval = intervals.reduce((prev, current) =>
          current.interval > prev.interval ? current : prev
      );

      res.json({
          producer: maxInterval.producer,
          interval: maxInterval.interval,
          previousWin: maxInterval.previousWin,
          followingWin: maxInterval.followingWin,
      });
  });
});

// Endpoint para obter o produtor com o menor intervalo entre prêmios consecutivos
app.get('/producers/shortest-interval', (req, res) => {
  calculateAwardIntervals((err, intervals) => {
      if (err) {
          res.status(500).send({ error: 'Erro ao calcular intervalos.' });
          return;
      }

      if (intervals.length === 0) {
          res.status(404).send({ error: 'Nenhum intervalo encontrado entre prêmios.' });
          return;
      }

      const minInterval = intervals.reduce((prev, current) =>
          current.interval < prev.interval ? current : prev
      );

      res.json({
          producer: minInterval.producer,
          interval: minInterval.interval,
          previousWin: minInterval.previousWin,
          followingWin: minInterval.followingWin,
      });
  });
});



// *******************************************************************




// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Close connection when process ends
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});

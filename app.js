const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csvParser = require('csv-parser');

const app = express();
const PORT = 3000;

// Initialize SQLite database in memory
const db = new sqlite3.Database(':memory:');

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS movies (
    year INTEGER,
    title TEXT,
    studios TEXT,
    producers TEXT,
    winner TEXT
)`);

// Function to load data from CSV
const loadCSVData = () => {
  const data = [];
  fs.createReadStream('./movielist.csv')
    .pipe(csvParser({ separator: ';' })) // Adjusting to the correct delimiter
    .on('data', (row) => {
      data.push(row);
    })
    .on('end', () => {
      console.log('CSV file read successfully.');

      // Insert data into the database
      const insertStmt = db.prepare(`INSERT INTO movies (year, title, studios, producers, winner) VALUES (?, ?, ?, ?, ?)`);

      data.forEach((movie) => {
        insertStmt.run(movie.year, movie.title, movie.studios, movie.producers, movie.winner || 'no', (err) => {
          if (err) {
            console.error('Error inserting data:', err.message);
          }
        });
      });

      insertStmt.finalize();
      console.log('Data entered into the database.');
    });
};

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

// Endpoint: List all movies
app.get('/movies', (req, res) => {
  db.all('SELECT * FROM movies', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Endpoint: Check API status
app.get('/', (req, res) => {
  // Load data from uploaded CSV
  loadCSVData();
  res.json({ message: 'API is running' });
});


// Function to calculate intervals between rewards
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

    // Mapping Producers to Their Respective Awards Year Lists
    const producerAwards = {};
    rows.forEach((row) => {
      const producers = row.producers.split(','); // Split multiple producers
      producers.forEach((producer) => {
        const trimmedProducer = producer.trim();
        if (!producerAwards[trimmedProducer]) {
          producerAwards[trimmedProducer] = [];
        }
        producerAwards[trimmedProducer].push(row.year);
      });
    });

    // Calculating intervals
    const producerIntervals = [];
    Object.keys(producerAwards).forEach((producer) => {
      const years = producerAwards[producer].sort((a, b) => a - b); // Sort the years
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

// Endpoint for getting the two largest and two smallest intervals between consecutive awards
app.get('/intervals', (req, res) => {
  calculateAwardIntervals((err, intervals) => {
    if (err) {
      res.status(500).send({ error: 'Error when calculating intervals.' });
      return;
    }

    if (intervals.length === 0) {
      res.status(404).send({ error: 'No intervals found between awards.' });
      return;
    }

    // Sort by interval in ascending
    const sortedByInterval = intervals.sort((a, b) => a.interval - b.interval);

    // Get the two smallest intervals
    const minIntervals = sortedByInterval.slice(0, 2);

    // Get the two largest intervals
    const maxIntervals = sortedByInterval.slice(-2).reverse();

    res.json({
      min: minIntervals.map(({ producer, interval, previousWin, followingWin }) => ({
        producer,
        interval,
        previousWin,
        followingWin,
      })),
      max: maxIntervals.map(({ producer, interval, previousWin, followingWin }) => ({
        producer,
        interval,
        previousWin,
        followingWin,
      })),
    });
  });
});

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

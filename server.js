const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3001;

// PostgreSQL Connection Pool
const pool = new Pool({
  user: 'postgres', 
  host: 'localhost', 
  database: 'DroneDelivery', 
  password: 'Jeet@0107', 
  port: 5432,
});

app.use(cors());
app.use(bodyParser.json());

// risk assessment (simplified)
const calculateRisk = (distance, value) => {
  let riskFactor = 1; 
  if (distance > 10) riskFactor += 0.5; 
  if (value > 100) riskFactor += 0.2; 
  return riskFactor;
};

// pricing (simplified)
const calculatePremium = (riskFactor, value) => {
  return riskFactor * value * 0.01 ; // 1% of value per risk unit
};

// API Endpoints

// Create a new order
app.post('/orders', async (req, res) => {
  const { distance, value } = req.body;

  try {
    const risk = calculateRisk(distance, value);
    const premium = calculatePremium(risk, value); 

    const result = await pool.query(
      'INSERT INTO orders (distance, value, risk, premium) VALUES ($1, $2, $3, $4) RETURNING *', 
      [distance, value, risk, premium]
    );

    res.status(201).json({ orderId: result.rows[0].id, risk, premium }); 

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Get order details by ID
app.get('/orders/:orderId', async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

// endpoint for processing a claim 
app.post('/claims/:orderId', async (req, res) => {
  const orderId = req.params.orderId;

  try {
    // Update order status (e.g., 'claimed') in the database
    const result = await pool.query('UPDATE orders SET status = \'claimed\' WHERE id = $1', [orderId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ message: 'Claim submitted successfully' });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process claim' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
'use strict';

// eslint-disable-next-line import/no-unresolved
const express = require('express');

require('dotenv').config();
const app = express();
const AWS = require('aws-sdk');

// Middleware
app.use(function (req, res, next) {
  // Load database
  AWS.config.loadFromPath('./awsKeys.json');

  var docClient;
  if (process.env.DEPLOYMENT === 'production') {
    AWS.config.update({
      region: "ap-southeast-2",
      endpoint: "https://dynamodb.ap-southeast-2.amazonaws.com",
    });
  }
  else {
    AWS.config.update({
      region: "ap-southeast-2",
      endpoint: "http://localhost:8000"
    });
  }

  var docClient = new AWS.DynamoDB.DocumentClient();
  req.db = docClient;

  next();
});

// Routes
app.get('/*', (req, res) => {
  // List tables
  // Reading an item
  var params = {
    TableName: 'programs',
    Key: {
      code: "3502",
      implementation_year: "2020"
    }
  };
  req.db.get(params, function (err, data) {
    if (err) console.log(err); // an error occurred
    else console.log(data); // successful response
  });
  res.send(`Request received: ${req.method} - ${req.path}`);
});

// Error handler
app.use((err, req, res) => {
  console.error(err);
  res.status(500).send('Internal Serverless Error');
});

module.exports = app;

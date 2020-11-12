'use strict';

// eslint-disable-next-line import/no-unresolved
const express = require('express');

require('dotenv').config();
const app = express();
const AWS = require('aws-sdk');
const Fuse = require('fuse.js');
const bodyParser = require('body-parser');
const cors = require('cors');
const _ = require('lodash');

const programs = require('./data/programs.json');
const courses = require('./data/courses.json');

// Configure CORS
var corsOptions = {
	origin: ['http://localhost:1234'],
	optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));

// Middleware
app.use(bodyParser.json({ strict: false }));
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
app.get('/', (request, response) => {
  try {
	// Reading an item
	var params = {
	  TableName: 'programs',
	  Key: {
		code: "3502",
		implementation_year: "2020"
	  }
	};
	request.db.get(params, function (err, data) {
	  if (err) console.log(err); // an error occurred
	  else console.log(data); // successful response
	});
	response.send(`Request received: ${request.method} - ${request.path}`);
  } catch (error) {
	return response.status(400).json({ error });
  }
});

app.post('/getProgram', (request, response) => {
	const code = request.body.code;
	const implementation_year = request.body.implementation_year;

	const programToReturn = _.find(programs, function(program) {
		return program.Item.code.S === code && program.Item.implementation_year.S === implementation_year;
	});

	return response.send(programToReturn);
});
app.post('/autocompletePrograms', (request, response) => {
	try {
		const query = request.body.query;
		
		const fuse = new Fuse(programs, {
			keys: ['Item.code.S', 'Item.title.S']
		});

		const results = fuse.search(query, { limit: 10 });

		return response.send(results);
	} catch (error) {
		return response.status(400).json({ error });
	}
});

app.post('/autocompleteCourses', (request, response) => {
	try {
		const query = request.body.query;

		const fuse = new Fuse(courses, {
			keys: ['Item.course_code.S', 'Item.name.S']
		});

		const results = fuse.search(query, { limit: 10 });

		return response.send(results);
	} catch (error) {
		return response.status(400).json({ error });
	}
});

// Error handler
app.use((err, req, res) => {
  console.error(err);
  res.status(500).send('Internal Serverless Error');
});

module.exports = app;

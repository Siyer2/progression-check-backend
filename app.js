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
const specialisations = require('./data/specialisations.json');

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

	const programToReturn = getProgram(code, implementation_year);

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

function getSpecialisation(specialisation_code, implementation_year) {
	const specialisation = _.find(specialisations, function(spec) {
		return spec.Item.specialisation_code.S === specialisation_code && spec.Item.implementation_year.S === implementation_year;
	});

	return specialisation;
}

function getProgram(code, implementation_year) {
	const program = _.find(programs, function(spec) {
		return spec.Item.code.S === code && spec.Item.implementation_year.S === implementation_year;
	});

	return program;
}

app.post('/getRequirements', (request, response) => {
	try {
		const code = request.body.code;
		const implementation_year = request.body.implementation_year;

		// Get program
		var program = getProgram(code, implementation_year).Item;

		// Get all the specialisation codes
		const specialisations = request.body.specialisations;
		const codes = Object.values(specialisations);

		var returnObject = {
			code: program.code.S, 
			title: program.title.S, 
			minimumUOC: program.minimumUOC.S, 
			...program.coreCourses && { coreCourses: program.coreCourses.L }, 
			...program.prescribedElectives && { prescribedElectives: program.prescribedElectives.L }, 
			...program.generalEducation && { generalEducation: program.generalEducation.L }, 
			...program.informationRules && { informationRules: program.informationRules.L }, 
			...program.limitRules && { limitRules: program.limitRules.L }, 
			...program.maturityRules && { maturityRules: program.maturityRules.L }, 
			...program.oneOfTheFollowings && { oneOfTheFollowings: program.oneOfTheFollowings.L }, 
			...program.freeElectives && { freeElectives: program.freeElectives.L }
		}
		
		// Get all of the specialisation objects and return with the program
		codes.map((specCode) => {
			if (specCode) {
				const specExists = getSpecialisation(specCode, implementation_year);
				if (specExists) {
					const spec = specExists.Item;
					// Go through each attribute that's not the code, title or year
					Object.keys(spec).map((rule) => {
						if (!['specialisation_code', 'title', 'implementation_year'].includes(rule)) {
							if (!returnObject[rule]) {
								returnObject[rule] = spec[rule];
							}
							else {
								returnObject[rule] = (returnObject[rule]).concat(spec[rule].L);
							}
						}
					});
				}
			}
		});

		return response.send(returnObject);

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

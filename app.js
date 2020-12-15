'use strict';

// eslint-disable-next-line import/no-unresolved
const express = require('express');

require('dotenv').config();
const app = express();
const Fuse = require('fuse.js');
const bodyParser = require('body-parser');
const cors = require('cors');
const _ = require('lodash');

const programs = require('./data_v2/programs.json');
const courses = require('./data_v2/courses.json');
const specialisations = require('./data_v2/specialisations.json');

// Configure CORS
var corsOptions = {
	origin: process.env.DEPLOYMENT === 'production' ? ['https://proglak.com', 'https://www.proglak.com', 'https://dvux7ocropqhi.cloudfront.net'] : ['http://localhost:1234'],
	// origin: ['https://dvux7ocropqhi.cloudfront.net'],
	optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));

// Middleware
app.use(bodyParser.json({ strict: false }));

// Helper functions
function getSpecialisation(specialisation_code, implementation_year) {
	const specialisation = _.find(specialisations, function (spec) {
		return spec.Item.specialisation_code === specialisation_code && spec.Item.implementation_year === implementation_year;
	});

	return specialisation;
}

function getProgram(code, implementation_year) {
	const program = _.find(programs, function (spec) {
		return spec.Item.code === code && spec.Item.implementation_year === implementation_year;
	});

	return program;
}

function getCourse(course_code) {
	const course = _.find(courses, function (spec) {
		return spec.Item.course_code === course_code;
	});

	return course;
}

// Routes
app.get('/', (request, response) => {
  try {
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
			keys: ['Item.code', 'Item.title']
		});

		const results = fuse.search(query, { limit: 40 });

		return response.send(results);
	} catch (error) {
		return response.status(400).json({ error });
	}
});

app.post('/getCourse', (request, response) => {
	const course_code = request.body.course_code;

	const courseToReturn = getCourse(course_code);

	return response.send(courseToReturn);
});

app.post('/autocompleteCourses', (request, response) => {
	try {
		const query = request.body.query;

		const fuse = new Fuse(courses, {
			keys: ['Item.course_code', 'Item.name']
		});

		const results = fuse.search(query, { limit: 20 });
		const uniqueResults = _.uniqBy(results, 'item.Item.course_code');

		return response.send(uniqueResults);
	} catch (error) {
		return response.status(400).json({ error });
	}
});

app.post('/getRequirements', (request, response) => {
	try {
		const code = request.body.code;
		const implementation_year = request.body.implementation_year;

		// Get program
		var program = getProgram(code, implementation_year).Item;

		// Get all the specialisation codes
		const specialisations = request.body.specialisations;
		const codes = _.flatten(Object.values(specialisations));
		console.log(codes);

		var returnObject = {
			code: program.code, 
			title: program.title, 
			minimumUOC: program.minimumUOC, 
			implementation_year: program.implementation_year, 
			...program.coreCourses && { coreCourses: program.coreCourses }, 
			...program.prescribedElectives && { prescribedElectives: program.prescribedElectives }, 
			...program.generalEducation && { generalEducation: program.generalEducation }, 
			...program.informationRules && { informationRules: program.informationRules }, 
			...program.limitRules && { limitRules: program.limitRules }, 
			...program.maturityRules && { maturityRules: program.maturityRules }, 
			...program.oneOfTheFollowings && { oneOfTheFollowings: program.oneOfTheFollowings }, 
			...program.freeElectives && { freeElectives: program.freeElectives }
		}
				
		// Get all of the specialisation objects and return with the program
		codes.map((specCode) => {
			if (specCode) {
				const specExists = getSpecialisation(specCode, implementation_year);
				if (specExists) {
					// Add spec name to the returnObject
					if (!returnObject['specialisations']) {
						returnObject['specialisations'] = [specCode];
					}
					else {
						returnObject['specialisations'] = (returnObject['specialisations']).concat(specCode);
					}

					const spec = specExists.Item;
					// Go through each attribute that's not the code, title or year
					Object.keys(spec).map((rule) => {
						if (!['specialisation_code', 'title', 'implementation_year'].includes(rule)) {
							if (!returnObject[rule]) {
								returnObject[rule] = spec[rule];
							}
							else {
								returnObject[rule] = (returnObject[rule]).concat(spec[rule]);
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

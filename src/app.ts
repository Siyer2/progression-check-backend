import * as express from 'express';

require('dotenv').config();
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

// Configure CORS
var corsOptions = {
    origin: process.env.DEPLOYMENT === 'production' ? ['https://proglak.com', 'https://www.proglak.com', 'https://dvux7ocropqhi.cloudfront.net'] : ['http://localhost:1234'],
    // origin: ['https://dvux7ocropqhi.cloudfront.net'],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));

// Middleware
app.use(bodyParser.json({ strict: false }));

// Controllers
let ProgramController = require('./controllers/ProgramController');
let CourseController = require('./controllers/CourseController');

// Routes
app.use('/program', ProgramController);
app.use('/course', CourseController);
app.get('/', (request: express.Request, response: express.Response) => {
    response.send(`Request received: ${request.method} - ${request.path} with TS`);
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).send('An internal server error occurred');
});

module.exports = app;
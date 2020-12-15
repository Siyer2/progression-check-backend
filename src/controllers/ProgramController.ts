import * as express from 'express';
const router = express.Router();

router.get('/get', function (request: express.Request, response: express.Response) {
    response.send(`Program Request received: ${request.method} - ${request.path} with TS`);
});

router.post('/autocomplete', function (request: express.Request, response: express.Response) {
    response.send(`Program Request received: ${request.method} - ${request.path} with TS`);
});

router.post('/requirements', function (request: express.Request, response: express.Response) {
    response.send(`Program Request received: ${request.method} - ${request.path} with TS`);
});

module.exports = router;
const express = require('express');
const router = express.Router();

router.get('/get', function (request, response) {
    try {
        return response.send("success");
    } catch (error) {
        return response.status(400).send({ error });
    }
});

module.exports = router;
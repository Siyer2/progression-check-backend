const express = require('express');
const router = express.Router();

router.get('/get', function (request, response) {
    try {
        var params = {
            TableName: 'ratings',
            Key: {
                course_code: 'ECON1203'
            }
        };
        request.db.get(params, function (err, data) {
            if (err) console.log(err); // an error occurred
            else console.log(data); // successful response
        });
        return response.send("success");
    } catch (error) {
        return response.status(400).send({ error });
    }
});

module.exports = router;
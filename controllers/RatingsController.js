const express = require('express');
const router = express.Router();

/**
 * A gif reaction is added
 */
router.post('/add', async function (request, response) {
    try {
        const course_code = request.body.course_code;
        const gifId = request.body.gifId;

        // Get details about the course
        const course = await request.db.get({
            TableName: 'courses', 
            Key: {
                course_code: course_code, 
                implementation_year: '2021'
            }
        }).promise();

        // See if there is an existing course
        const existingCourse = await request.db.get({
            TableName: 'ratings',
            Key: {
                course_code: course_code
            }
        }).promise();
        
        // If existing course, append the new gif to it's reaction array
        if (existingCourse.Item) {
            console.log(existingCourse);
        }
        // If no existing course, create a new one
        else {
            await request.db.put({
                TableName: 'ratings', 
                Item: {
                    course_code: course_code,
                    course_name: course.Item.name, 
                    link: course.Item.link, 
                    credit_points: course.Item.credit_points, 
                    reactions: [gifId]
                }
            }).promise();
        }

        return response.send("success");

    } catch (error) {
        return response.status(400).send({ error });
    }
});

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
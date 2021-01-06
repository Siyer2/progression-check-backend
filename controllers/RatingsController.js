const express = require('express');
const router = express.Router();

/**
 * A gif reaction is added
 * Inputs: course_code and gifId
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
            await request.db.update({
                TableName: 'ratings', 
                Key: {
                    course_code: course_code
                }, 
                UpdateExpression: 'SET reactions = list_append(reactions, :value)',
                ExpressionAttributeValues: {
                    ':value': [gifId]
                },
                ReturnValues: 'ALL_NEW'
            }).promise();
        }
        // If no existing course, create a new one
        else {
            await request.db.put({
                TableName: 'ratings', 
                Item: {
                    course_code: course_code,
                    ...course.Item && { course_name: course.Item.name}, 
                    ...course.Item && { link: course.Item.link}, 
                    ...course.Item && { credit_points: course.Item.credit_points},
                    reactions: [gifId]
                }
            }).promise();
        }

        return response.send("success");

    } catch (error) {
        return response.status(400).send({ error });
    }
});

/**
 * Return the 3 most common reactions
 * Inputs: course_code
 */
router.post('/get', async function (request, response) {
    try {
        const course_code = request.body.course_code;
        const ratings = await request.db.get({
            TableName: 'ratings',
            Key: {
                course_code: course_code
            }
        }).promise();

        if (ratings.Item) {
            var formattedRatings = {};
            const reactions = ratings.Item.reactions;
            reactions.forEach((reaction) => {
                if (formattedRatings[reaction]) {
                    formattedRatings[reaction] = formattedRatings[reaction] + 1;
                }
                else {
                    formattedRatings[reaction] = 1;
                }
            });

            let sortedReactions = Object.entries(formattedRatings).sort((a, b) => b[1] - a[1]);

            return response.send(sortedReactions);
        }
        else {
            return response.send([]);
        }
    } catch (error) {
        return response.status(400).json({ error });
    }
});

module.exports = router;
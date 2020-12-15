import * as express from 'express';
import * as _ from 'lodash';
const Fuse = require('fuse.js');
const router = express.Router();

const courses = require('../../data_v2/courses.json');
import { Course } from '../types';

interface ReturnedCourse {
    title: Course
}

function getCourse(course_code: string): ReturnedCourse {
    const course: ReturnedCourse = _.find(courses, function (spec) {
        return spec.Item.course_code === course_code;
    });

    return course;
}

router.post('/get', function (request: express.Request, response: express.Response) {
    const course_code: string = request.body.course_code;

    const courseToReturn = getCourse(course_code);

    return response.send(courseToReturn);
});

router.post('/autocomplete', function (request: express.Request, response: express.Response) {
    const query = request.body.query;

    const fuse = new Fuse(courses, {
        keys: ['Item.course_code', 'Item.name']
    });

    const results = fuse.search(query, { limit: 20 });
    const uniqueResults = _.uniqBy(results, 'item.Item.course_code');

    return response.send(uniqueResults);
});

module.exports = router;
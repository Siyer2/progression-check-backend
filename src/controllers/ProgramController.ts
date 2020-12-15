import * as express from 'express';
import * as _ from 'lodash';
const Fuse = require('fuse.js');
const router = express.Router();

const programs = require('../../data_v2/programs.json');
const specialisations = require('../../data_v2/specialisations.json');
import { Program, Specialisation } from '../types';

interface ReturnedProgram {
    Item: Program
}

interface ReturnedSpecialisation {
    Item: Specialisation
}

interface ReturnRequirements extends Program {
    [other: string]: any
}

function getProgram(code: string, implementation_year: string): ReturnedProgram {
    const program: ReturnedProgram = _.find(programs, function (spec) {
        return spec.Item.code === code && spec.Item.implementation_year === implementation_year;
    });

    return program;
}

function getSpecialisation(specialisation_code: string, implementation_year: string): ReturnedSpecialisation {
    const specialisation: ReturnedSpecialisation = _.find(specialisations, function (spec) {
        return spec.Item.specialisation_code === specialisation_code && spec.Item.implementation_year === implementation_year;
    });

    return specialisation;
}

router.post('/get', function (request: express.Request, response: express.Response) {
    const code: string = request.body.code;
    const implementation_year: string = request.body.implementation_year;

    const programToReturn = getProgram(code, implementation_year);

    return response.send(programToReturn);
});

router.post('/autocomplete', function (request: express.Request, response: express.Response) {
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

router.post('/requirements', function (request: express.Request, response: express.Response) {
    try {
        const code = request.body.code;
        const implementation_year = request.body.implementation_year;

        // Get program
        var program = getProgram(code, implementation_year).Item;

        // Get all the specialisation codes
        const specialisations = request.body.specialisations;
        let codes: string[] = _.flatten(Object.values(specialisations));

        var returnObject: ReturnRequirements = {
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
                const specExists: ReturnedSpecialisation = getSpecialisation(specCode, implementation_year);
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

module.exports = router;
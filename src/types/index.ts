interface Course {
    course_code: string;
    implementation_year: string;
    link: string;
    name: string;
    credit_points: string;
}

interface Program {
    code: string;
    implementation_year: string;
    minimumUOC: string;
    title: any;
    coreCourses?: any;
    generalEducation?: any;
    faculty?: any;
    maturityRules?: any;
    prescribedElectives?: any;
    freeElectives?: any;
    informationRules?: any;
    oneOfTheFollowings?: any;
    limitRules?: any;
    majors?: any;
    minors?: any;
    specialisations?: any;
    honours?: any;
    studyLevel?: any;
}

interface Specialisation {
    specialisation_code: string;
    implementation_year: string;
    title: any;
    prescribedElectives?: any;
    coreCourses?: any;
    generalEducation?: any;
    oneOfTheFollowings?: any;
    maturityRules?: any;
    [other: string]: any;
}

export {
    Course, 
    Program, 
    Specialisation
}
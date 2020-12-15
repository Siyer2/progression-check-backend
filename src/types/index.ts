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
    coreCourses?: any;
    generalEducation?: any;
    title?: any;
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

}

export {
    Course, 
    Program, 
    Specialisation
}
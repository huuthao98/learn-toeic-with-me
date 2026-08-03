export const ROUTES = {
  HOME: '/home',
  DASHBOARD: '/dashboard',
  
  PROFILE: '/profile',
  //auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',

  //practice
  PRACTICE: '/practice',
  PRACTICE_TOEIC: '/practice/toeic',
  PRACTICE_EXAM_TOEIC: '/practice/practice-toeic',
  PRACTICE_B1: '/practice/practice-b1',

  PRACTICE_INTERVIEW: '/practice/interview',
  PRACTICE_VOCABULARY: '/practice/vocabulary',

  //exam
  EXAM_TOEIC: '/toeic',
  VIEW_ADMIN_TOEIC: '/test-toeic',
  EXAM_B1: '/exam-b1',

  //admin
  ADMIN: '/admin',
  ADMIN_MEDIA: '/admin/media',
  ADMIN_USERS: '/admin/users',
  ADMIN_TOPICS: '/admin/topics',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_CREATE_TEST: '/admin/create-test-multiple-choice',
  ADMIN_CREATE_TEST_V2: '/admin/create-test-toeic',
  ADMIN_CREATE_TEST_B1: '/admin/create-test-b1',
  ADMIN_CREATE_INTERVIEW_TEST: '/admin/create-interview-test',
};

export const getPracticeToeicResultsRoute = (id: string) => `/practice/toeic/${id}/results`;
export const getAdminTestDetailRoute = (id: string) => `/admin/tests/${id}`;
export const getAdminTestInterviewDetailRoute = (id: string) => `/admin/tests-interview/${id}`;
export const getAdminTestToeicDetailRoute = (id: string) => `/detail-test-toeic/${id}`;
export const getAdminDetailPracticeRoute = (id: string) => `/detail-practice/${id}`;
export const getAdminTestB1DetailRoute = (id: string) => `/admin/detail-b1/${id}`;

//list toeic practice or exam 
export const getListPracticeToeicRoute = (mode: 'practice' | 'exam') => `/practice/practice-toeic?mode=${mode}`;
//practice page toeic
export const getPracticeToeicExamRoute = (id: string) => `/practice-exam-toeic/${id}`;
//exam page toeic
export const getToeicExamRoute = (id: string) => `/exam-toeic/${id}`;

//list b1 practice or exam 
export const getListPracticeB1Route = (mode: 'practice' | 'exam') => `/practice/practice-b1?mode=${mode}`;
//practice page b1 
export const getPracticeB1ExamRoute = (id: string) => `/practice/practice-b1/${id}`;
//exam page b1
export const getB1ExamRoute = (id: string) => `/exam-b1/${id}`;

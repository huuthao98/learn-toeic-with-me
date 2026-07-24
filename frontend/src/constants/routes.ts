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
  PRACTICE_INTERVIEW: '/practice/interview',
  PRACTICE_VOCABULARY: '/practice/vocabulary',

  //exam
  EXAM_TOEIC: '/toeic',
  VIEW_ADMIN_TOEIC: '/test-toeic',
  
  //admin
  ADMIN: '/admin',
  ADMIN_MEDIA: '/admin/media',
  ADMIN_USERS: '/admin/users',
  ADMIN_TOPICS: '/admin/topics',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_CREATE_TEST: '/admin/create-test',
  ADMIN_CREATE_TEST_V2: '/admin/create-test-toeic',
  ADMIN_CREATE_INTERVIEW_TEST: '/admin/create-interview-test',
};

export const getPracticeToeicResultsRoute = (id: string) => `/practice/toeic/${id}/results`;
export const getAdminTestDetailRoute = (id: string) => `/admin/tests/${id}`;
export const getAdminTestInterviewDetailRoute = (id: string) => `/admin/tests-interview/${id}`;
export const getAdminTestToeicDetailRoute = (id: string) => `/detail-test-toeic/${id}`;
export const getAdminDetailPracticeRoute = (id: string) => `/detail-practice/${id}`;


export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  PRACTICE: '/practice/toeic',
  PRACTICE_INTERVIEW: '/practice/interview',
  PRACTICE_VOCABULARY: '/practice/vocabulary',
  ADMIN: '/admin',
  ADMIN_CREATE_TEST: '/admin/create-test',
  ADMIN_CREATE_TEST_V2: '/admin/create-test-toeic',
  ADMIN_CREATE_INTERVIEW_TEST: '/admin/create-interview-test',
  ADMIN_MEDIA: '/admin/media',
};

export const getPracticeToeicResultsRoute = (id: string) => `/practice/toeic/${id}/results`;
export const getAdminTestDetailRoute = (id: string) => `/admin/tests/${id}`;
export const getAdminTestInterviewDetailRoute = (id: string) => `/admin/tests-interview/${id}`;
export const getAdminTestToeicDetailRoute = (id: string) => `/admin/test-toeic/${id}`;

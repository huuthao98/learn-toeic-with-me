export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  PRACTICE: '/practice',
  PRACTICE_ENGLISH: '/practice-english',
  ADMIN: '/admin',
  ADMIN_CREATE_TEST: '/admin/create-test',
  ADMIN_CREATE_TEST_V2: '/admin/create-test-v2',
  ADMIN_CREATE_INTERVIEW_TEST: '/admin/create-interview-test',
  ADMIN_MEDIA: '/admin/media',
};

export const getPracticeEnglishResultsRoute = (id: string) => `/practice-english/${id}/results`;
export const getPracticeResultsRoute = (id: string) => `/practice/${id}/results`;
export const getAdminTestDetailRoute = (id: string) => `/admin/tests/${id}`;
export const getAdminTestInterviewDetailRoute = (id: string) => `/admin/tests-interview/${id}`;
export const getAdminTestToeicDetailRoute = (id: string) => `/admin/test-toeic/${id}`;

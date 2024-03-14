jest.mock("./services/middleware.service", () => ({
  middleware: jest.fn((req, res, next) => next()),
  middlewareCourse: jest.fn((req, res, next) => next()),
}));

jest.mock("./config/conn.js", () => ({
  query: jest.fn((sql, arr) => {
    return [];
  }),
}));

jest.mock("node-cron", () => {
  return {
    schedule: jest.fn((time, func) => false),
  };
});

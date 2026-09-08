export const copy = (obj) => JSON.parse(JSON.stringify(obj));

export const kickOut = () => {
  window.location.href = '/';
  window.localStorage.clear();
};

export const verifyToken = (token) => {
  if (!token) {
    kickOut();
    return false;
  }
  return true;
};

export const compareDBUsers = (dbUsers, users) => {
  // Add null check to ensure dbUsers and users are arrays
  if (!dbUsers || !Array.isArray(dbUsers)) {
    return [];
  }
  
  if (!users || !Array.isArray(users)) {
    return dbUsers;
  }
  
  return dbUsers.filter(dbUser => {
    return !users.some(user => user.id === dbUser.id);
  });
};

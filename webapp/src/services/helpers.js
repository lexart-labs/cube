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

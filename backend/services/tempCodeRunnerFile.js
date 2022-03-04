const toTimeString = (sec) => {
  let hr = Math.trunc(sec / 3600);
  let min = Math.trunc((sec % 3600) /60);
  let scn = Math.trunc((sec % 3600) % 60);

  const [hh, mm, ss] = [hr, min, scn].map(el => el < 10 ? ('0' + el) : el);
  return `${hh}:${mm}:${ss}`;
};

console.log(toTimeString(434183));
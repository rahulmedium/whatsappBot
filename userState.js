const users = {};

 const userState = {
  get: (phone) => users[phone],
  set: (phone, state) => users[phone] = state
};
export default userState;
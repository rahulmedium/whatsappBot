const users = {};

module.exports = {
  get: (phone) => users[phone],
  set: (phone, state) => users[phone] = state
};

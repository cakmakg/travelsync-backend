"use strict";
/* -------------------------------------------------------
    TravelSync - Password Encryption Helper
------------------------------------------------------- */

const bcrypt = require('bcrypt');

module.exports = (password) => {
  // Bcrypt rounds from environment or default to 12
  const saltRounds = Number(process.env.BCRYPT_ROUNDS) || 12;
  return bcrypt.hashSync(password, saltRounds);
};
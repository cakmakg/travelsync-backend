"use strict";
/* -------------------------------------------------------
    TravelSync - Email Validation Helper
------------------------------------------------------- */

module.exports = (email) => {
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};
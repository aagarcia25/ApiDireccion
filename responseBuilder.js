const db = require("../Server/db.js");

const buildResponse = (response, success, numCode, strMessage) => ({
  RESPONSE: response,
  SUCCESS: success,
  NUMCODE: numCode,
  STRMESSAGE: strMessage,
});

function executeQuery(sql, values) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, result) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);

  const fractional_day = serial - Math.floor(serial) + 0.0000001;

  let total_seconds = Math.floor(86400 * fractional_day);

  const seconds = total_seconds % 60;

  total_seconds -= seconds;

  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;

  return new Date(
    date_info.getFullYear(),
    date_info.getMonth(),
    date_info.getDate() + 1,
    hours,
    minutes,
    seconds
  );
}

module.exports = {
  buildResponse,
  executeQuery,
  excelDateToJSDate,
};

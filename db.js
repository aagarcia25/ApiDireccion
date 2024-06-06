const mysql = require("mysql2");

const db_config = {
  host: process.env.APP_DB_HOST,
  user: process.env.APP_DB_USER,
  database: process.env.APP_DB_DATABASE,
  password: process.env.APP_DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(db_config);

// Ping a la base de datos cada 5 minutos para mantener la conexión activa
setInterval(() => {
  pool.query("SELECT 1", (err) => {
    if (err) {
      console.error("Error en el ping a la base de datos:", err);
    } else {
      console.log("Ping a la base de datos exitoso");
    }
  });
}, 300000); // 300000 ms = 5 minutos

pool.on("connection", (connection) => {
  console.log("Nueva conexión establecida:", connection.threadId);
  connection.on("error", (err) => {
    console.error("Error en la conexión a la base de datos:", err);
    if (
      err.code === "PROTOCOL_CONNECTION_LOST" ||
      err.code === "ECONNRESET" ||
      err.code === "ETIMEDOUT" ||
      err.code === "EHOSTUNREACH"
    ) {
      console.error("Se perdió la conexión con la base de datos.");
    } else {
      throw err;
    }
  });
});

module.exports = pool;

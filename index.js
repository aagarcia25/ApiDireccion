const dotenv = require("dotenv");
const express = require("express");
const fs2 = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const xlsx = require("xlsx");
const ruta = "D:\\PLADI";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { parse, format } = require("date-fns");
dotenv.config();
const app = express();
const PORT = 3001;
const HOST = "0.0.0.0";
const uil = require("responseBuilder.js");
const db_connect = require("./db"); // Importa la configuración de la base de datos

app.use(bodyParser.json());
app.use(cors());

function insertData(data) {
  return new Promise((resolve, reject) => {
    const insertQuery = `
      INSERT INTO plantilla ( d_codigo, d_asenta, d_tipo_asenta, D_mnpio, d_estado, d_ciudad, d_CP,c_estado,c_oficina,c_CP,c_tipo_asenta,c_mnpio,id_asenta_cpcons,d_zona,c_cve_ciudad)
      VALUES ( ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?)
    `;

    for (const row of data) {
      print(row);
      const values = [
        row.d_codigo,
        row.d_asenta,
        row.d_tipo_asenta,
        row.D_mnpio,
        row.d_estado,
        row.d_ciudad,
        row.d_CP,
        row.c_estado,
        row.c_oficina,
        row.c_CP,
        row.c_tipo_asenta,
        row.c_mnpio,
        row.id_asenta_cpcons,
        row.d_zona,
        row.c_cve_ciudad,
      ];
      console.log(values);
      db_connect.query(insertQuery, values, (err) => {
        if (err) {
          return reject(err);
        }
      });
    }
    resolve();
  });
}

// Ruta para manejar la subida del archivo Excel
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // Obtener el buffer del archivo subido
    const buffer = req.file.buffer;

    // Leer el contenido del buffer usando xlsx
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    await insertData(data);
    res.status(200).json({ message: "Data inserted successfully" });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const server = app.listen(PORT, HOST, () => {
  const { address, port } = server.address();
  console.log(`Server running on http://${address}:${port}`);
});

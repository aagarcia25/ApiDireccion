const dotenv = require("dotenv");
const express = require("express");
const fs2 = require("fs").promises;
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const xlsx = require("xlsx");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
dotenv.config();
const app = express();
const PORT = 3005;
const HOST = "0.0.0.0";
const uil = require("./responseBuilder.js");
const db_connect = require("./db"); // Importa la configuración de la base de datos

app.use(bodyParser.json());
app.use(cors());

function getInfoByCP({ cp, estado, mnpio }) {
  return new Promise((resolve, reject) => {
    let insertQuery = "";
    let params = [cp];

    if (cp && !estado && !mnpio) {
      insertQuery =
        "SELECT distinct  pl.d_estado AS id , pl.d_estado AS label   FROM DIRECCIONES.plantilla pl WHERE pl.d_codigo = ?";
    } else if (cp && estado && !mnpio) {
      insertQuery =
        "SELECT distinct pl.d_ciudad AS id , pl.d_ciudad AS label FROM DIRECCIONES.plantilla pl WHERE pl.d_codigo = ? AND pl.d_estado = ?";
      params.push(estado);
    } else if (cp && estado && mnpio) {
      insertQuery =
        "SELECT distinct pl.d_asenta AS id , pl.d_asenta AS label FROM DIRECCIONES.plantilla pl WHERE pl.d_codigo = ? AND pl.d_estado = ? AND pl.D_mnpio = ?";
      params.push(estado, mnpio);
    }

    if (insertQuery === "") {
      return reject(new Error("No se proporcionaron los parámetros correctos"));
    }

    db_connect.query(insertQuery, params, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
}
app.get("/Info", async (req, res) => {
  const { cp, estado, mnpio } = req.query;
  try {
    const result = await getInfoByCP({ cp, estado, mnpio });
    const responseData = uil.buildResponse(result, true, 200, "Éxito");
    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function insertData(data) {
  return new Promise((resolve, reject) => {
    const insertQuery = `
      INSERT INTO plantilla (d_codigo, d_asenta, d_tipo_asenta, D_mnpio, d_estado, d_ciudad, d_CP, c_estado, c_oficina, c_CP, c_tipo_asenta, c_mnpio, id_asenta_cpcons, d_zona, c_cve_ciudad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        d_asenta = VALUES(d_asenta),
        d_tipo_asenta = VALUES(d_tipo_asenta),
        D_mnpio = VALUES(D_mnpio),
        d_estado = VALUES(d_estado),
        d_ciudad = VALUES(d_ciudad),
        d_CP = VALUES(d_CP),
        c_estado = VALUES(c_estado),
        c_oficina = VALUES(c_oficina),
        c_CP = VALUES(c_CP),
        c_tipo_asenta = VALUES(c_tipo_asenta),
        c_mnpio = VALUES(c_mnpio),
        id_asenta_cpcons = VALUES(id_asenta_cpcons),
        d_zona = VALUES(d_zona),
        c_cve_ciudad = VALUES(c_cve_ciudad)
    `;

    const promises = data.map((row) => {
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
      return new Promise((resolve, reject) => {
        db_connect.query(insertQuery, values, (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });

    Promise.all(promises)
      .then(() => resolve())
      .catch((err) => reject(err));
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
    res
      .status(500)
      .json({ error: "Internal server error", msg: error.message });
  }
});

const server = app.listen(PORT, HOST, () => {
  const { address, port } = server.address();
  console.log(`Server running on http://${address}:${port}`);
});

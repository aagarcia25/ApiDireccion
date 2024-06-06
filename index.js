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
const PORT = 3001;
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



function getAllInfo({ cp}) {
  return new Promise((resolve, reject) => {

      if (!cp ) {
      return reject(new Error("No se proporcionaron los parámetros correctos"));
    }


    let insertQuery = "";
    let params = [cp];

    let  insertQuery1 = " SELECT * FROM plantilla WHERE d_codigo= ? ; ";

    let  insertQuery2 = "SELECT DISTINCT d_codigo, d_estado AS id , d_estado AS label  FROM plantilla WHERE d_codigo= ? ;"

    let  insertQuery3 = "SELECT distinct d_estado   ,d_ciudad AS id , d_ciudad AS label  FROM plantilla WHERE d_codigo= ? ;"

    let  insertQuery4 = "SELECT distinct d_ciudad   ,d_asenta AS id , d_asenta AS label  FROM plantilla WHERE d_codigo= ? ;"

   

  
    Promise.all([
      new Promise((resolve, reject) => {
        db_connect.query(insertQuery1, params, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      }),
      new Promise((resolve, reject) => {
        db_connect.query(insertQuery2, params, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      }),
      new Promise((resolve, reject) => {
        db_connect.query(insertQuery3, params, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      }),
      new Promise((resolve, reject) => {
        db_connect.query(insertQuery4, params, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      })
    ])
    .then(results => {
      // Combine all results into one object
      const combinedResults = {
        query1: results[0],
        query2: results[1],
        query3: results[2],
        query4: results[3]
      };
      resolve(combinedResults);
    })
    .catch(err => {
      reject(err);
    });
  });
}
app.get("/AllInfo", async (req, res) => {
  const { cp} = req.query;
  try {
    const result = await getAllInfo({ cp});
    const responseData = uil.buildResponse(result, true, 200, "Éxito");
    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



function insertData(data) {
  return new Promise((resolve, reject) => {
    const checkQuery = `
      SELECT COUNT(*) as count FROM plantilla WHERE d_codigo = ? AND d_asenta = ? AND d_tipo_asenta = ? AND D_mnpio = ? AND d_estado = ? AND d_ciudad = ? AND d_CP = ? AND c_estado = ? AND c_oficina = ? AND c_CP = ? AND c_tipo_asenta = ? AND c_mnpio = ? AND id_asenta_cpcons = ? AND d_zona = ? AND c_cve_ciudad = ?
    `;

    const insertQuery = `
      INSERT INTO plantilla (d_codigo, d_asenta, d_tipo_asenta, D_mnpio, d_estado, d_ciudad, d_CP, c_estado, c_oficina, c_CP, c_tipo_asenta, c_mnpio, id_asenta_cpcons, d_zona, c_cve_ciudad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const updateQuery = `
      UPDATE plantilla SET 
        d_asenta = ?, d_tipo_asenta = ?, D_mnpio = ?, d_estado = ?, d_ciudad = ?, d_CP = ?, c_estado = ?, c_oficina = ?, c_CP = ?, c_tipo_asenta = ?, c_mnpio = ?, id_asenta_cpcons = ?, d_zona = ?, c_cve_ciudad = ?
      WHERE d_codigo = ?
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

      return new Promise((resolve, reject) => {
        db_connect.query(checkQuery, values, (err, results) => {
          if (err) {
            return reject(err);
          }

          if (results[0].count > 0) {
            // Si el registro existe, actualizarlo
            db_connect.query(updateQuery, [...values.slice(1), row.d_codigo], (err) => {
              if (err) {
                return reject(err);
              }
              resolve();
            });
          } else {
            // Si el registro no existe, insertarlo
            db_connect.query(insertQuery, values, (err) => {
              if (err) {
                return reject(err);
              }
              resolve();
            });
          }
        });
      });
    });

    Promise.all(promises)
      .then(() => {
        console.log('All data inserted/updated successfully.');
        resolve();
      })
      .catch((err) => {
        console.error('Error inserting/updating data:', err);
        reject(err);
      });
  });
}
// Ruta para manejar la subida del archivo Excel
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // Obtener el buffer del archivo subido
    const buffer = req.file.buffer;

    // Leer el contenido del buffer usando xlsx
    const workbook = xlsx.read(buffer, { type: "buffer" });

    // Iterar sobre todas las hojas excepto la primera
    const sheetNames = workbook.SheetNames.slice(1); // Omitir la primera hoja
    let allData = [];

    sheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      allData = allData.concat(data);
    });

    // Filtrar los datos donde d_codigo no esté vacío
    const filteredData = allData.filter(row => row.d_codigo);

    // Insertar los datos en la base de datos
    await insertData(filteredData);
    console.log("salio del await");
    res.status(200).json({ message: "Data inserted/updated successfully" });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Internal server error", msg: error.message });
  }
});










const server = app.listen(PORT, HOST, () => {
  const { address, port } = server.address();
  console.log(`Server running on http://${address}:${port}`);
});

















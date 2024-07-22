const mysql = require(mysql);
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});
function getTables(tab, campoDesc) {
  connection.query(
    `SELECT * FROM ${tab} WHERE status = 'active' ORDER BY ${campoDesc}`,
    (err, rows) => {
      if (!err) {
        return rows
      } else {
        console.log(err);
      }
    }
  );
}

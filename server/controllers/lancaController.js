const mysql = require("mysql");

let currentRec;
let total = 0;

// Connection Pool
let connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // Máximo de conexões inativas; o valor padrão é o mesmo que "connectionLimit"
  idleTimeout: 60000, // Tempo limite das conexões inativas em milissegundos; o valor padrão é "60000"
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 60000
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
 
  console.log('connected as id ' + connection.threadId);
});

// View Lanca
exports.view = async (req, res) => {
  // lancamentos the connection
  await connection.query(
    `SELECT * FROM categorias WHERE 1=1 AND status='active' ORDER BY descricao;
  SELECT * FROM pessoas WHERE 1=1 AND status='active' ORDER BY nome;
  SELECT * FROM bancos WHERE 1=1 AND status='active' ORDER BY nome;
  SELECT * FROM operacoes WHERE 1=1 AND status='active' ORDER BY descricao;
  SELECT lan.id, lan.tipo, lan.descricao lanca_desc, 
  date_format(lan.emissao,'%d/%m/%Y') emissao, FORMAT(lan.valor,2,'de_DE') valor, 
  date_format(lan.vencimento_em,'%d/%m/%Y') vencimento_em, 
  cat.descricao nome_categoria, pes.nome nome_pessoa, pes.tipo tipo_pessoa, 
  ban.nome nome_banco, ban.saldo_anterior, ban.saldo, lan.ope_id, lan.id_origem, 
  ope.descricao descricao_ope, date_format(lan.pago_em,'%d/%m/%Y %H:%i') pago_em
  FROM lancamentos lan 
  LEFT JOIN categorias cat ON cat.id = lan.cat_id  
  LEFT JOIN pessoas pes ON pes.id = lan.pes_id  
  LEFT JOIN bancos ban ON ban.id = lan.banco_id  
  LEFT JOIN operacoes ope ON ope.id = lan.ope_id  
  WHERE 1=1 AND lan.status = "active" 
  ORDER BY lan.emissao DESC;
  `,
    (err, rows, fields) => {
      // When done with the connection, release it
      if (!err) {
        linhas = rows
        rows = linhas[4]
        ban = linhas[2]
        ope = linhas[3]
        ent = linhas[1]
        cat = linhas[0]
        total = 0;
        rows.forEach((element) => {
/*           console.log(
            element.valor,
            parseFloat(element.valor.replace(",", ".")),
            total
          ); */
          total =
            element.tipo == "R"
              ? total + parseFloat(element.valor.replace(",", "."))
              : total - parseFloat(element.valor.replace(",", "."));
        });
        total = total.toFixed(2);
        let removedLanca = req.query.removed;
        res.render("lancamento", { rows, removedLanca, total, ban, ope, cat, ent });
        // connection.end();
      } else {
        // connection.end();
        // console.log(err);
        throw err;
      }
      console.log("The data from view lancamentos table: \n", rows, total);
    }
  );
};

// Find Lanca by Search
exports.find = async (req, res) => {
  let searchTerm = req.body.search;
  let orderTerm = req.body.inlineRadioOptions1; //"lan." +
  let directTerm = req.body.inlineRadioOptions2;
  let filterTipo = !req.body.inlineRadioOptionsT
    ? ""
    : `AND lan.tipo = "${req.body.inlineRadioOptionsT}"`;

    let _filterCat =
    !req.body.filterCat || req.body.filterCat == 0
      ? ""
      : `AND lan.cat_id = ${req.body.filterCat}`;
      
  let _filterEnt =
    !req.body.filterEnt || req.body.filterEnt == 0
      ? ""
      : `AND lan.pes_id = ${req.body.filterEnt}`;

    let _filterOpe =
      !req.body.filterOpe || req.body.filterOpe == 0
        ? ""
        : `AND lan.ope_id = ${req.body.filterOpe}`;
        
    let _filterBan =
      !req.body.filterBan || req.body.filterBan == 0
        ? ""
        : `AND lan.banco_id = ${req.body.filterBan}`;
  
    let wherefiltro, dfiltro

  switch (req.body.dtFiltro) {
    case 'E': dfiltro = 'emissao'; break;
    case 'V': dfiltro = 'vencimento_em'; break;
    case 'P': dfiltro = 'pago_em'; break;
    default: dfiltro = 'emissao'; break;
  } 

  wherefiltro = (!req.body.dtinicial || !req.body.dtfinal) ? `` : `AND ${dfiltro} BETWEEN '${req.body.dtinicial}' AND '${req.body.dtfinal}'`

  console.log(req.body);

  // User the connection
  const qry = `SELECT * FROM categorias WHERE 1=1 AND status='active' ORDER BY descricao;
  SELECT * FROM pessoas WHERE 1=1 AND status='active' ORDER BY nome;
  SELECT * FROM bancos WHERE 1=1 AND status='active' ORDER BY nome;
  SELECT * FROM operacoes WHERE 1=1 AND status='active' ORDER BY descricao;
  SELECT lan.id, lan.tipo, lan.descricao lanca_desc, 
  date_format(lan.emissao,'%d/%m/%Y') emissao, FORMAT(lan.valor,2,'de_DE') valor, 
  date_format(lan.vencimento_em,'%d/%m/%Y') vencimento_em, date_format(lan.pago_em,'%d/%m/%Y %H:%i') pago_em, 
  cat.descricao nome_categoria, pes.nome nome_pessoa, pes.tipo tipo_pessoa, 
  ban.nome nome_banco, ban.saldo_anterior, ban.saldo, lan.ope_id, lan.id_origem,
  ope.descricao descricao_ope
  FROM lancamentos lan 
  LEFT JOIN categorias cat ON cat.id = lan.cat_id  
  LEFT JOIN pessoas pes ON pes.id = lan.pes_id  
  LEFT JOIN bancos ban ON ban.id = lan.banco_id  
  LEFT JOIN operacoes ope ON ope.id = lan.ope_id
  WHERE lan.status = "active" AND (pes.nome LIKE ? OR cat.descricao LIKE ? OR lan.descricao LIKE ? OR ban.nome LIKE ?) ${filterTipo} ${_filterCat} ${_filterEnt}  ${_filterOpe} ${_filterBan} 
  ${wherefiltro}
  ORDER BY ${orderTerm} ${directTerm};
  `;
  await connection.query(
    qry,
    [
      "%" + searchTerm + "%",
      "%" + searchTerm + "%",
      "%" + searchTerm + "%",
      "%" + searchTerm + "%",
    ],
    (err, rows) => {
      if (!err) {
        total = 0;
        linhas = rows
        rows = linhas[4]
        ban = linhas[2];
        ope = linhas[3];
        ent = linhas[1]
        cat = linhas[0]
        // console.log(lanca)
        rows.forEach((element) => {
/*           console.log(
            element.valor,
            parseFloat(element.valor.replace(",", ".")),
            total
          ); */
          total =
            element.tipo == "R"
              ? total + parseFloat(element.valor.replace(",", "."))
              : total - parseFloat(element.valor.replace(",", "."));
        });
        total = total.toFixed(2);
        res.render("lancamento", { rows, total, ban, ope, ent, cat });
      } else {
        console.log(err);
      }
      console.log("The data from find lancamentos table: lanca\n", linhas);
    }
  );
  // connection.end();
};

exports.form = async (req, res) => {
  var catrows, pesrows, banrows, operows;
  let arLanca = new Object();

  await connection.query(
    `SELECT date_format(emissao,'%Y-%m-%d') femissao, date_format(vencimento_em,'%Y-%m-%d') fvencimento_em, lancamentos.* 
    FROM lancamentos WHERE 1=1 AND id = 0;
    SELECT * FROM categorias WHERE status = 'active' ORDER BY descricao;
  SELECT * FROM pessoas WHERE status = 'active' ORDER BY nome;
  SELECT * FROM bancos WHERE status = 'active' ORDER BY nome;
  SELECT * FROM operacoes WHERE status = 'active' ORDER BY descricao;`,
    (err, rows) => {
      if (!err) {
/*         catrows = rows[0];
        pesrows = rows[1];
        banrows = rows[2];
        operows = rows[3]; */
        arLanca = [
          [
            {
              femissao: null,
              fvencimento_em: null,
              id: null,
              tipo: null,
              pes_id: null,
              cat_id: null,
              descricao: null,
              emissao: null,
              valor: null,
              banco_id: null,
              vencimento_em: null,
              pago_em: null,
              created_at: null,
              updated_at: null,
              status: null,
              saldo_anterior: null,
              operacao: null,
              id_origem: null,
              ope_id: null,
            },
          ],
          rows[1],
          rows[2],
          rows[3],
          rows[4],
        ];
        res.render("add-lanca", { arLanca });
        console.log(arLanca);
      } else {
        console.log(err);
      }
    }
  );
  // connection.end();
};

// Add new lancamento
exports.create = async (req, res) => {
  const {
    tipo,
    categoria,
    pessoa,
    banco,
    operacao,
    descricao,
    valor,
    emissao,
    vencimento_em,
    origem_id,
  } = req.body;

  let tipo_RD = tipo == "on" ? "D" : "R";
  let vencimentoEm = vencimento_em == "" ? null : vencimento_em;
  let id_origem = origem_id == "" ? 0 : origem_id;

  if (
    !tipo ||
    categoria.length < 1 ||
    banco.length < 1 ||
    operacao.length < 1 ||
    valor === 0 ||
    emissao.length < 1 ||
    (operacao == 2 && vencimentoEm == null)
  ) {
    res.render("add-lanca", {
      error: "Preencha todas as informações requeridas.",
    });
    return;
  }

  let qryBanco =
    operacao == 2
      ? ""
      : `UPDATE bancos SET saldo_anterior = saldo, saldo = saldo ${
          tipo == "D" ? "-" : "+"
        } ${valor}  WHERE id = ${banco};`;
  console.log(tipo, vencimentoEm, Date(), qryBanco);

  // lancamentos the connection
  await connection.query(
    `INSERT INTO lancamentos SET tipo = ?, cat_id = ?, pes_id = ?, banco_id = ?, ope_id = ?,
    emissao = ?, valor = ?, vencimento_em = ?, descricao = ?, id_origem = ?; ${qryBanco}`,
    [
      tipo,
      categoria,
      pessoa,
      banco,
      operacao,
      emissao,
      valor,
      vencimentoEm,
      descricao,
      id_origem,
    ],
    (err, rows) => {
      if (!err) {
        res.render("add-lanca", {
          alert: "Lançamento adicionado com sucesso.",
        });
      } else {
        console.log(err);
      }
      console.log("The data from form lancamentos table: \n", rows);
    }
  );
  // connection.end();
};

// Edit lancamento
exports.edit = async (req, res) => {
  let arLanca = new Object();

  // lancamentos the connection
  await connection.query(
    `SELECT date_format(emissao,'%Y-%m-%d') femissao, date_format(vencimento_em,'%Y-%m-%d') fvencimento_em, lan.id, 
  lan.tipo, lan.descricao lanca_desc, 
  date_format(lan.emissao,'%d/%m/%Y') emissao, FORMAT(lan.valor,2,'de_DE') valor, 
  date_format(lan.vencimento_em,'%d/%m/%Y') vencimento_em, lan.pago_em, 
  cat.descricao nome_categoria, pes.nome nome_pessoa, pes.tipo tipo_pessoa, 
  ban.nome nome_banco, ban.saldo_anterior, ban.saldo, lan.ope_id, lan.id_origem,
  ope.descricao descricao_ope, lan.pes_id, lan.banco_id, lan.cat_id
  FROM lancamentos lan 
  LEFT JOIN categorias cat ON cat.id = lan.cat_id  
  LEFT JOIN pessoas pes ON pes.id = lan.pes_id  
  LEFT JOIN bancos ban ON ban.id = lan.banco_id  
  LEFT JOIN operacoes ope ON ope.id = lan.ope_id WHERE 1=1 AND lan.id = ? AND lan.status = 'active' AND lan.ope_id in (1,2);
    SELECT id, descricao FROM categorias WHERE status = 'active' ORDER BY descricao;
    SELECT id, nome FROM pessoas WHERE status = 'active' ORDER BY nome;
    SELECT id, nome FROM bancos WHERE status = 'active' ORDER BY nome;
    SELECT id, descricao FROM operacoes WHERE status = 'active' ORDER BY descricao;`,
    [req.params.id],
    (err, rows) => {
      if (!err) {
        if (rows[0].length === 0) {
          res.render("edit-lanca", {
            error: `A operação deste lançamento ${req.params.id} não permite alterações !`,
          });
        } else {
          currentRec = rows[0];
          arLanca = [rows[0], rows[1], rows[2], rows[3], rows[4]];
          res.render("edit-lanca", { arLanca });
        }
      } else {
        console.log(err);
      }
      console.log("The data from edit lancamentos table: \n", arLanca);
    }
  );
  // connection.end();
};

// Update Lanca
exports.update = async (req, res) => {
  let qryBanco = "";
  let qryEstorno = "";

  const {
    tipo,
    emissao,
    categoria,
    pessoa,
    banco,
    descricao,
    operacao,
    valor,
    vencimento_em,
    origem_id,
  } = req.body;

  let objcurrentRec = currentRec[0];

  console.log(">>>>>>>>> currentRec <<<<<<<<<<", banco, operacao);
  console.log(
    // emissao,
    // categoria.value,
    // pessoa.value,
    // descricao,
    // vencimento_em.date,
    // origem_id.value
    objcurrentRec
  );

  let pessoa_id = pessoa === "" ? 0 : pessoa;
  let id_origem = origem_id === "" ? 0 : origem_id;
  let vencimentoEm = vencimento_em === "" ? null : vencimento_em;

  if (descricao.length < 1 || categoria < 1) {
    res.render("edit-lanca", { error: "Faltando informações." });
    return;
  }
  console.log(
    objcurrentRec.tipo,
    tipo,
    objcurrentRec.banco_id,
    banco,
    objcurrentRec.ope_id,
    operacao,
    objcurrentRec.valor,
    valor
  );

  if (
    objcurrentRec.tipo !== tipo ||
    objcurrentRec.banco_id !== banco ||
    objcurrentRec.ope_id !== operacao ||
    parseFloat(objcurrentRec.valor.replace(",", ".")) !== valor
  ) {
    if (objcurrentRec.ope_id == 1) {
      qryEstorno = `UPDATE bancos SET saldo_anterior = saldo, saldo = saldo ${
        objcurrentRec.tipo == "R" ? "-" : "+"
      } ${parseFloat(objcurrentRec.valor.replace(",", "."))} WHERE id = ${
        objcurrentRec.banco_id
      } AND status = 'active';`;
    }
    if (operacao == 1) {
      qryBanco = `UPDATE bancos SET saldo_anterior = saldo, saldo = saldo ${
        tipo == "R" ? "+" : "-"
      } ${valor} WHERE id = ${banco} AND status = 'active';`;
    }
  }

  // lancamentos the connection
  await connection.query(
    `START TRANSACTION; ${qryEstorno}
    UPDATE lancamentos SET 
    tipo = ?, 
    emissao = ?, 
    cat_id = ?, 
    pes_id = ?, 
    banco_id = ?, 
    descricao = ?, 
    ope_id = ?, 
    vencimento_em = ?, 
    valor = ?, 
    id_origem = ? 
    WHERE id = ? 
    AND status = 'active';
    ${qryBanco}
    COMMIT;`,
    [
      tipo,
      emissao,
      categoria,
      pessoa_id,
      banco,
      descricao,
      operacao,
      vencimentoEm,
      valor,
      id_origem,
      req.params.id,
    ],
    (err, rows) => {
      if (!err) {
        // lancamentos the connection
        connection.query(
          "SELECT * FROM lancamentos WHERE id = ?",
          [req.params.id],
          (err, rows) => {
            // When done with the connection, release it

            if (!err) {
              res.render("edit-lanca", {
                rows,
                alert: `O lançamento foi atualizado.`,
              });
            } else {
              console.log(err);
            }
            console.log("The data from update lancamentos table: \n", rows);
          }
        );
      } else {
        console.log(err);
      }
      console.log("The data from update lancamentos table: \n", rows);
    }
  );
  // connection.end();
};

// Delete Lanca
exports.delete = async (req, res) => {
  let lin = [];
  let mathOper = "";

  // Delete a record

  // User the connection
  // connection.query('DELETE FROM user WHERE id = ?', [req.params.id], (err, rows) => {

  //   if(!err) {
  //     res.redirect('/');
  //   } else {
  //     console.log(err);
  //   }
  //   console.log('The data from user table: \n', rows);

  // });

  // Hide a record
console.log(req.query, req.params, req.body)
  await connection.query(
    `SELECT tipo, 
            valor, 
            banco_id
        FROM lancamentos WHERE id = ?`,
    [req.params.id],
    (err, rows) => {
      if (!err) {
        lin = rows[0];
        mathOper = lin.tipo === "R" ? "-" : "+";
        connection.query(
          `start transaction; UPDATE bancos SET saldo_anterior = saldo, saldo = saldo ${mathOper} ? WHERE id = ?; UPDATE lancamentos SET status = ? WHERE id = ?; commit;`,
          [
            lin.valor, lin.banco_id, 'removed', req.params.id, 
          ],
          (err, rows) => {
            if (!err) {
              // console.log("The res from delete lancamentos table: \n", res);
              res.render("view-lancamento", {
                alert: `Exclusão realizada.`,
              });
            } else {
              console.log(err);
            }
          }
        );
        // console.log("The res from insert lancamentos table: \n", res);
      } else {
        console.log(err);
      }
      console.log("The data from delete lancamentos table: \n", rows);
    }
  );
  // connection.end();
};

// View lancamentos
exports.viewall = async (req, res) => {
  // lancamentos the connection
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
  console.log(req.body)
await connection.query(
    `SELECT lan.id, lan.tipo, lan.descricao lanca_desc, 
  date_format(lan.emissao,'%d/%m/%Y') emissao, FORMAT(lan.valor,2,'de_DE') valor, 
  date_format(lan.vencimento_em,'%d/%m/%Y') vencimento_em, lan.pago_em, 
  cat.descricao nome_categoria, pes.nome nome_pessoa, pes.tipo tipo_pessoa, 
  ban.nome nome_banco, ban.saldo_anterior, ban.saldo, ope.descricao descricao_ope,
  lan.id_origem, lan.saldo_anterior, lan.operacao, lan.ope_id, lan.pago_em, lan.banco_id, 
  date_format(lan.pago_em,'%d/%m/%Y %H:%i') pago_em
  FROM lancamentos lan 
  LEFT JOIN categorias cat ON cat.id = lan.cat_id  
  LEFT JOIN pessoas pes ON pes.id = lan.pes_id  
  LEFT JOIN bancos ban ON ban.id = lan.banco_id
  LEFT JOIN operacoes ope ON ope.id = lan.ope_id WHERE lan.id = ?`,
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("view-lancamento", { rows });
      } else {
        console.log(err);
      }
      console.log("The data from viewall lancamentos table: \n", rows);
    }
  );
  // connection.end();
};

exports.baixar = async (req, res) => {
  // lancamentos the connection
  pago = req.query.pg
  tipo = req.query.tp == 'R' ? '+' : '-';
  valor = parseFloat(req.query.v.replace(",", "."))
  console.log(tipo, req.query.v,req.query.b, !pago);
  if(!pago){
  await connection.query(`START TRANSACTION; UPDATE lancamentos SET pago_em = NOW() WHERE 1=1 AND status='active' AND id=?; 
    UPDATE bancos SET saldo_anterior = saldo, saldo = saldo ${tipo} ${valor} WHERE id = ${req.query.b}; COMMIT;`,
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("view-lancamento", { alert: "Baixa realizada com sucesso!" });
      } else {
        console.log(err);
      }
      console.log("The data from baixar lancamentos table: \n", rows);
    }
  );
} else{
  res.render("view-lancamento", { error: "Lançamento já está baixado!." });
}
 }
const mysql = require("mysql");

// Connection Pool
let connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  multipleStatements: true,
});

// View Lanca
exports.view = (req, res) => {
  // lancamentos the connection
  connection.query(
    `SELECT lan.id, lan.tipo, lan.descricao lanca_desc, 
  date_format(lan.emissao,'%d/%m/%Y') emissao, FORMAT(lan.valor,2,'de_DE') valor, 
  date_format(lan.vencimento_em,'%d/%m/%Y') vencimento_em, lan.pago_em, 
  cat.descricao nome_categoria, pes.nome nome_pessoa, pes.tipo tipo_pessoa, 
  ban.nome nome_banco, ban.saldo_anterior, ban.saldo, lan.ope_id, lan.id_origem, 
  ope.descricao descricao_ope
  FROM lancamentos lan 
  LEFT JOIN categorias cat ON cat.id = lan.cat_id  
  LEFT JOIN pessoas pes ON pes.id = lan.pes_id  
  LEFT JOIN bancos ban ON ban.id = lan.banco_id  
  LEFT JOIN operacoes ope ON ope.id = lan.ope_id  
  WHERE 1=1 AND lan.status = "active" 
  ORDER BY lan.emissao DESC`,
    (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        let removedLanca = req.query.removed;
        res.render("lancamento", { rows, removedLanca });
      } else {
        console.log(err);
      }
      //   console.log("The data from get(lancamentos) table: \n", rows);
    }
  );
};

// Find Lanca by Search
exports.find = (req, res) => {
  let searchTerm = req.body.search;
  let orderTerm = req.body.inlineRadioOptions1; //"lan." +
  let directTerm = req.body.inlineRadioOptions2;
  let filterTipo = (!req.body.inlineRadioOptionsT) ? "" : `AND lan.tipo = "${req.body.inlineRadioOptionsT}"`;
  let _filterOpe = (!req.body.filterOpe) ?  "" : `AND lan.ope_id = ${req.body.filterOpe}`;
  let _filterBan = (!req.body.filterBan || req.body.filterBan == 0) ?  "" : `AND lan.banco_id = ${req.body.filterBan}`;


  console.log(filterTipo, _filterOpe, _filterBan);
  
  // User the connection
  const qry = `SELECT lan.id, lan.tipo, lan.descricao lanca_desc, 
  date_format(lan.emissao,'%d/%m/%Y') emissao, FORMAT(lan.valor,2,'de_DE') valor, 
  date_format(lan.vencimento_em,'%d/%m/%Y') vencimento_em, lan.pago_em, 
  cat.descricao nome_categoria, pes.nome nome_pessoa, pes.tipo tipo_pessoa, 
  ban.nome nome_banco, ban.saldo_anterior, ban.saldo, lan.ope_id, lan.id_origem,
  ope.descricao descricao_ope
  FROM lancamentos lan 
  LEFT JOIN categorias cat ON cat.id = lan.cat_id  
  LEFT JOIN pessoas pes ON pes.id = lan.pes_id  
  LEFT JOIN bancos ban ON ban.id = lan.banco_id  
  LEFT JOIN operacoes ope ON ope.id = lan.ope_id
  WHERE lan.status = "active" AND (pes.nome LIKE ? OR cat.descricao LIKE ? OR lan.descricao LIKE ? OR ban.nome LIKE ?) ${filterTipo} ${_filterOpe} ${_filterBan} 
  ORDER BY ${orderTerm} ${directTerm}`
  connection.query(qry
    ,
    [
      "%" + searchTerm + "%",
      "%" + searchTerm + "%",
      "%" + searchTerm + "%",
      "%" + searchTerm + "%",
    ],
    (err, rows) => {
      if (!err) {
        res.render("lancamento", { rows });
      } else {
        console.log(err);
      }
      console.log("The data from lancamentos table: \n", qry, rows);
    }
  );
};

exports.form = (req, res) => {
  var catrows, pesrows, banrows, operows;
  let arLanca = new Object();

  connection.query(
    `SELECT date_format(emissao,'%Y-%m-%d') femissao, date_format(vencimento_em,'%Y-%m-%d') fvencimento_em, lancamentos.* 
    FROM lancamentos WHERE 1=1 AND id = 0;
    SELECT * FROM categorias WHERE status = 'active' ORDER BY descricao;
  SELECT * FROM pessoas WHERE status = 'active' ORDER BY nome;
  SELECT * FROM bancos WHERE status = 'active' ORDER BY nome;
  SELECT * FROM operacoes WHERE status = 'active' ORDER BY descricao;`,
    (err, rows) => {
      if (!err) {
        catrows = rows[0];
        pesrows = rows[1];
        banrows = rows[2];
        operows = rows[3];
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
};

// Add new lancamento
exports.create = (req, res) => {
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
  connection.query(
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
      console.log("The data from lancamentos table: \n", rows);
    }
  );
};

// Edit lancamento
exports.edit = (req, res) => {
  let arLanca = new Object();

  // lancamentos the connection
  connection.query(
    `SELECT date_format(emissao,'%Y-%m-%d') femissao, date_format(vencimento_em,'%Y-%m-%d') fvencimento_em, lan.id, 
    IF(lan.tipo='R','RECEITA','DESPESA') tipo, lan.descricao lanca_desc, 
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
          arLanca = [rows[0], rows[1], rows[2], rows[3], rows[4]];
          res.render("edit-lanca", { arLanca });
        }
      } else {
        console.log(err);
      }
      console.log("The data from lancamentos table: \n", arLanca);
    }
  );
};

// Update Lanca
exports.update = (req, res) => {
  const { emissao, categoria, pessoa, descricao, vencimento_em, origem_id } =
    req.body;

  console.log(
    emissao,
    categoria.value,
    pessoa.value,
    descricao,
    vencimento_em.date,
    origem_id.value
  );

  let pessoa_id = pessoa === "" ? 0 : pessoa;
  let id_origem = origem_id === "" ? 0 : origem_id;
  let vencimentoEm = vencimento_em === "" ? null : vencimento_em;

  if (descricao.length < 1 || categoria < 1) {
    res.render("edit-lanca", { error: "Faltando informações." });
    return;
  }

  // lancamentos the connection
  connection.query(
    "UPDATE lancamentos SET emissao = ?, cat_id = ?, pes_id = ?, descricao = ?, vencimento_em = ?, id_origem = ? WHERE id = ?",
    [
      emissao,
      categoria,
      pessoa_id,
      descricao,
      vencimentoEm,
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
            console.log("The data from lancamentos table: \n", rows);
          }
        );
      } else {
        console.log(err);
      }
      console.log("The data from lancamentos table: \n", rows);
    }
  );
};

// Delete Lanca
exports.delete = (req, res) => {
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

  connection.query(
    `SELECT tipo, 
            pes_id, 
            cat_id, 
            descricao, 
            emissao, 
            valor, 
            banco_id, 
            vencimento_em, 
            (SELECT saldo FROM bancos WHERE id=banco_id) saldo, 
            ope_id, 
            id id_origem 
        FROM lancamentos WHERE id = ?`,
    [req.params.id],
    (err, rows) => {
      lin = rows[0];
      console.log("ope_id => " + lin.ope_id);
      if (lin.ope_id === 3) {
        res.render("view-lancamento", rows, {
          error: `Situação do Lançamento não permite esta operação.`,
        });
        return;
      }
      mathOper = lin.tipo === "R" ? "-" : "+";
      if (!err) {
        console.log(
          lin.tipo,
          lin.pes_id,
          lin.cat_id,
          lin.descricao,
          lin.emissao,
          lin.valor,
          lin.banco_id,
          lin.vencimento_em,
          lin.saldo_anterior,
          lin.operacao,
          lin.id_origem,
          lin.valor,
          lin.banco_id
        );
        connection.query(
          `start transaction; INSERT INTO lancamentos (tipo, pes_id, cat_id, descricao, emissao, valor, banco_id, vencimento_em, saldo_anterior, ope_id, id_origem ) VALUES (
            ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?); UPDATE bancos SET saldo_anterior = saldo, saldo = saldo ${mathOper} ? WHERE id = ?; UPDATE lancamentos SET ope_id = 4 WHERE id = ?; commit;`,
          [
            lin.tipo === "R" ? "D" : "R",
            lin.pes_id,
            lin.cat_id,
            lin.descricao,
            lin.valor,
            lin.banco_id,
            lin.vencimento_em,
            lin.saldo_anterior,
            3,
            lin.id_origem,
            lin.valor,
            lin.banco_id,
            lin.id_origem,
          ],
          (err, rows) => {
            if (!err) {
              console.log("The res from insert lancamentos table: \n", res);
              res.render("view-lancamento", {
                alert: `Estorno realizado.`,
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
      console.log("The data from lancamentos table: \n", rows);
    }
  );
};

// View lancamentos
exports.viewall = (req, res) => {
  // lancamentos the connection
  connection.query(
    `SELECT lan.id, lan.tipo, lan.descricao lanca_desc, 
  date_format(lan.emissao,'%d/%m/%Y') emissao, FORMAT(lan.valor,2,'de_DE') valor, 
  date_format(lan.vencimento_em,'%d/%m/%Y') vencimento_em, lan.pago_em, 
  cat.descricao nome_categoria, pes.nome nome_pessoa, pes.tipo tipo_pessoa, 
  ban.nome nome_banco, ban.saldo_anterior, ban.saldo, ope.descricao descricao_ope,
  lan.id_origem, lan.saldo_anterior, lan.operacao, lan.ope_id
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
      console.log("The data from lancamentos table: \n", rows);
    }
  );
};

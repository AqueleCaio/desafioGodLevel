const express = require('express');
const cors = require('cors');
const {
  getTableNames,
  getTableAttributes,
  getAllRelatedTables,
  builderQuery
} = require('./DAO/BDmain');
const { helperDataReport } = require('./backController');

// Configura BigInt para serialização JSON
BigInt.prototype.toJSON = function() {
  return this.toString();
};

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Retorna lista de tabelas
app.get('/tables', async (req, res) => {
  try {
    const tabelas = await getTableNames();
    res.json(tabelas);
  } catch (error) {
    console.error('Erro ao obter tabelas:', error);
    res.status(500).json({ error: 'Erro ao obter tabelas' });
  }
});

// Retorna atributos de uma tabela específica
app.get('/attributes/:tableName', async (req, res) => {
  const { tableName } = req.params;
  try {
    const atributos = await getTableAttributes(tableName);
    res.json(atributos);
  } catch (error) {
    console.error(`Erro ao obter atributos da tabela ${tableName}:`, error);
    res.status(500).json({ error: `Erro ao obter atributos da tabela ${tableName}` });
  }
});

// Retorna todas as relações entre tabelas
app.get('/all-related-tables', async (req, res) => {
  try {
    const related = await getAllRelatedTables();
    res.json(related);
  } catch (error) {
    console.error("Erro ao buscar todas as relações:", error);
    res.status(500).json({ error: 'Erro ao buscar todas as relações' });
  }
});

// Executa consulta e retorna resultado
app.post('/query-report', async (req, res) => {
  try {
    const payload = req.body;

    // Monta as partes da query
    const {
      selectPart,
      fromPart,
      wherePart,
      groupByPart,
      havingPart,
      orderByPart
    } = helperDataReport(payload);

    // Executa a query completa
    const { result } = await builderQuery({
      selectPart,
      fromPart,
      wherePart,
      groupByPart,
      havingPart,
      orderByPart,
    });

    res.json({ result });

  } catch (err) {
    console.error('Erro ao processar /query-report:', err);
    res.status(500).json({
      error: 'Erro ao gerar relatório',
      details: err.message,
    });
  }
});

// Retorna apenas a query gerada (sem executar)
app.post('/query-to-view', async (req, res) => {
  try {
    const payload = req.body;

    // Monta as partes da query
    const {
      selectPart,
      fromPart,
      wherePart,
      groupByPart,
      havingPart,
      orderByPart
    } = helperDataReport(payload);

    // Constrói a query final
    const queryParts = [
      `SELECT ${selectPart}`,
      `FROM ${fromPart}`,
      wherePart && `WHERE ${wherePart}`,
      groupByPart && `GROUP BY ${groupByPart}`,
      havingPart && `HAVING ${havingPart}`,
      orderByPart && `ORDER BY ${orderByPart}`
    ].filter(Boolean);

    const fullQuery = queryParts.join('\n') + ';';

    res.json({ fullQuery });

  } catch (err) {
    console.error('Erro ao montar query para visualização:', err);
    res.status(500).json({
      error: 'Erro ao montar query',
      details: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
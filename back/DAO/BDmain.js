// DAO/BDmain.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Retorna todas as tabelas públicas do banco
async function getTableNames() {
  return await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name NOT LIKE '%_prisma_%'
  `;
}

// Retorna os atributos (colunas) de uma tabela
async function getTableAttributes(tableName) {
  return await prisma.$queryRaw`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = ${tableName} AND table_schema = 'public'
  `;
}

// Retorna todas as relações entre tabelas via chaves estrangeiras
async function getAllRelatedTables() {
  return await prisma.$queryRaw`
    SELECT DISTINCT
      tc.table_name AS table_name,
      ccu.table_name AS related_table
    FROM
      information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE
      tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  `;
}

// Constrói e executa query SQL baseada nas partes fornecidas
async function builderQuery({
  selectPart,
  fromPart,
  wherePart = '',
  groupByPart = '',
  havingPart = '',
  orderByPart = ''
}) {
  // Garante que todas as partes sejam strings válidas
  selectPart = selectPart || '*';
  fromPart = fromPart || '';
  wherePart = wherePart || '';
  groupByPart = groupByPart || '';
  havingPart = havingPart || '';
  orderByPart = orderByPart || '';

  // Monta a query base com as partes fornecidas
  const queryParts = [
    `SELECT ${selectPart}`,
    `FROM ${fromPart}`,
    wherePart && `WHERE ${wherePart}`,
    groupByPart && `GROUP BY ${groupByPart}`,
    havingPart && `HAVING ${havingPart}`,
    orderByPart && `ORDER BY ${orderByPart}`
  ].filter(Boolean);

  let fullQuery = queryParts.join('\n').trim();

  // Adiciona LIMIT padrão se não foi definido pelo usuário
  const hasLimit = /\blimit\b/i.test(fullQuery);
  if (!hasLimit) {
    fullQuery += `\nLIMIT 1000`;
  }

  fullQuery += ';';

  console.log('Query final montada no DAO:\n', fullQuery);
  console.log('\n----------------------------------\n');

  try {
    // Faz a consulta e manda para a variável result
    const result = await prisma.$queryRawUnsafe(fullQuery);

    console.log('Query executada com sucesso. Resultados (até 10 linhas):', result.slice(0, 10));

    return { result, fullQuery };
  } catch (err) {
    console.error('Erro ao executar query no builderQuery:', err);
    throw err;
  }
}

module.exports = {
  getTableNames,
  getTableAttributes,
  getAllRelatedTables,
  builderQuery
};
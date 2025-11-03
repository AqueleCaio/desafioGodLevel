const { getAllRelatedTables } = require('../back/DAO/BDmain');

// Verifica se o valor é numérico
function isNumeric(val) {
  return typeof val === 'number' || (!Array.isArray(val) && !isNaN(val) && val !== '' && !/^\s+$/.test(String(val)));
}

// Formata valores para query SQL
function quoteValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (isNumeric(val)) return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Normaliza array de colunas
function normalizeColumns(columns) {
  if (!columns) return [];
  return columns.map(c => (typeof c === 'string' ? c : c.column)).filter(Boolean);
}

// Normaliza array de agregações
function normalizeAggregation(aggregation) {
  if (!aggregation) return [];
  return aggregation.map(a => {
    return {
      func: (a.func || '').toUpperCase(),
      column: a.column
    };
  }).filter(a => a.func && a.column);
}

const STATIC_RELATIONS = {
  brands: {
    sub_brands: 'id',
    stores: 'id',
    channels: 'id',
    categories: 'id',
    products: 'id',
    option_groups: 'id',
    items: 'id',
    payment_types: 'id',
    coupons: 'id',
  },
  sub_brands: {
    brands: 'brand_id',
    stores: 'id',
    categories: 'id',
    products: 'id',
    option_groups: 'id',
    items: 'id',
    customers: 'id',
    sales: 'id',
  },
  stores: {
    brands: 'brand_id',
    sub_brands: 'sub_brand_id',
    customers: 'id',
    sales: 'id',
  },
  channels: {
    brands: 'brand_id',
    sales: 'id',
  },
  categories: {
    brands: 'brand_id',
    sub_brands: 'sub_brand_id',
    products: 'id',
    option_groups: 'id',
    items: 'id',
  },
  products: {
    brands: 'brand_id',
    sub_brands: 'sub_brand_id',
    categories: 'category_id',
    product_sales: 'id',
  },
  customers: {
    stores: 'store_id',
    sub_brands: 'sub_brand_id',
    sales: 'id',
  },
  sales: {
    stores: 'store_id',
    sub_brands: 'sub_brand_id',
    customers: 'customer_id',
    channels: 'channel_id',
    product_sales: 'id',
    delivery_sales: 'id',
    delivery_addresses: 'id',
    payments: 'id',
    coupon_sales: 'id',
  },
  product_sales: {
    sales: 'sale_id',
    products: 'product_id',
    item_product_sales: 'id',
  },
  delivery_sales: {
    sales: 'sale_id',
    delivery_addresses: 'id',
  },
  delivery_addresses: {
    sales: 'sale_id',
    delivery_sales: 'delivery_sale_id',
  },
  item_product_sales: {
    product_sales: 'product_sale_id',
    items: 'item_id',
    option_groups: 'option_group_id',
    item_item_product_sales: 'id',
  },
  items: {
    brands: 'brand_id',
    sub_brands: 'sub_brand_id',
    categories: 'category_id',
    item_product_sales: 'id',
    item_item_product_sales: 'id',
  },
  option_groups: {
    brands: 'brand_id',
    sub_brands: 'sub_brand_id',
    categories: 'category_id',
    item_product_sales: 'id',
    item_item_product_sales: 'id',
  },
  payments: {
    sales: 'sale_id',
    payment_types: 'payment_type_id',
  },
  payment_types: {
    brands: 'brand_id',
    payments: 'id',
  },
  coupons: {
    brands: 'brand_id',
    coupon_sales: 'id',
  },
  coupon_sales: {
    sales: 'sale_id',
    coupons: 'coupon_id',
  }
};


// Encontra condição de JOIN entre duas tabelas
function findJoinCondition(currentTable, previousTable) {
  // Verifica se tabela anterior tem FK apontando para tabela atual
  if (STATIC_RELATIONS[previousTable]?.[currentTable]) {
    const fkColumn = STATIC_RELATIONS[previousTable][currentTable];
    return `${previousTable}.${fkColumn} = ${currentTable}.id`;
  }

  // Verifica se tabela atual tem FK apontando para tabela anterior
  if (STATIC_RELATIONS[currentTable]?.[previousTable]) {
    const fkColumn = STATIC_RELATIONS[currentTable][previousTable];
    return `${currentTable}.${fkColumn} = ${previousTable}.id`;
  }

  return null;
}

// Monta parte SELECT da query
function buildSelectPart(columnsArr, aggregationArr) {
  const aggsPartArr = aggregationArr.map(a => {
    const alias = `${a.func}_${String(a.column).replace(/\./g, '_')}`;
    return `${a.func}(${a.column}) AS ${alias}`;
  });

  const columnsPartArr = columnsArr.map(c => {
    if (c.includes('.')) {
      const alias = String(c).replace(/\./g, '_');
      return `${c} AS ${alias}`;
    }
    return c;
  });

  const selectItems = [];
  if (aggsPartArr.length > 0) selectItems.push(...aggsPartArr);
  if (columnsPartArr.length > 0) selectItems.push(...columnsPartArr);
  
  return selectItems.length > 0 ? selectItems.join(', \n\t') : '*';
}

// Monta parte FROM com JOINs
function buildFromPart(tables, joinType) {
  const firstTable = typeof tables[0] === 'string' ? tables[0] : tables[0].name;
  let fromPart = firstTable;

  if (tables.length > 1) {
    for (let i = 1; i < tables.length; i++) {
      const currentTable = typeof tables[i] === 'string' ? tables[i] : tables[i].name;
      const previousTables = tables.slice(0, i).map(t => typeof t === 'string' ? t : t.name);
      
      const currentJoinType = (tables[i] && tables[i].type) ? tables[i].type.toUpperCase() : joinType;
      let joinCondition = null;
      let relationFound = false;

      // Procura relação com alguma das tabelas anteriores
      for (const prevTable of previousTables) {
        joinCondition = findJoinCondition(currentTable, prevTable);
        if (joinCondition) {
          relationFound = true;
          break;
        }
      }

      if (relationFound) {
        const joinClause = `${currentJoinType} ${currentTable} ON ${joinCondition}`;
        fromPart += `\n${joinClause}`;
      }
    }
  }

  return fromPart;
}

// Monta parte WHERE da query
function buildWherePart(filters) {
  if (!Array.isArray(filters) || filters.length === 0) {
    return '';
  }

  const conditions = filters.map(f => {
    // Detecta se é uma coluna de data/timestamp pelo nome
    const isDateColumn = f.column.toLowerCase().includes('date') || 
                        f.column.toLowerCase().includes('time') ||
                        f.column.toLowerCase().includes('created') ||
                        f.column.toLowerCase().includes('updated');

    // Se é coluna de data e usa LIKE/NOT LIKE, converte para texto
    if (isDateColumn && (f.operator?.toUpperCase() === 'LIKE' || f.operator?.toUpperCase() === 'NOT LIKE')) {
      const operator = f.operator.toUpperCase();
      
      let valueToUse = f.value;

      // Aplica formatação para operador LIKE respeitando os % do usuário
      if (typeof f.value === 'string') {
        // Se o usuário já colocou %, mantém como está
        const hasUserPercent = f.value.includes('%');
        
        if (!hasUserPercent) {
          // Se o usuário NÃO colocou %, adiciona % em ambos os lados
          valueToUse = `%${f.value}%`;
        } else {
          // Remove % extras automáticos
          // Caso 1: %%valor% → %valor
          if (f.value.startsWith('%%') && f.value.endsWith('%') && f.value.length > 3) {
            valueToUse = `%${f.value.slice(2, -1)}`;
          }
          // Caso 2: %valor%% → valor%
          else if (f.value.startsWith('%') && f.value.endsWith('%%') && f.value.length > 3) {
            valueToUse = `${f.value.slice(1, -2)}%`;
          }
          // Caso 3: %valor% → mantém %valor% (caso normal do usuário)
          else if (f.value.startsWith('%') && f.value.endsWith('%') && f.value.length > 2) {
            valueToUse = f.value; // Mantém exatamente como o usuário digitou
          }
          // Outros casos: mantém como o usuário digitou
          else {
            valueToUse = f.value;
          }
        }
      }

      // Converte a coluna de timestamp para texto usando TO_CHAR
      // Formato: YYYY-MM-DD HH24:MI:SS (pode ajustar conforme necessidade)
      if (operator === 'LIKE') {
        return `TO_CHAR(${f.column}, 'YYYY-MM-DD HH24:MI:SS') LIKE ${quoteValue(valueToUse)}`;
      } else {
        return `TO_CHAR(${f.column}, 'YYYY-MM-DD HH24:MI:SS') NOT LIKE ${quoteValue(valueToUse)}`;
      }
    }

    // Trata operador IN com array de valores (mantém original)
    if (Array.isArray(f.value)) {
      const values = f.value.map(v => quoteValue(v)).join(', ');
      return `${f.column} ${f.operator} (${values})`;
    }

    let valueToUse = f.value;

    // Verifica se o valor é referência a tabela.coluna
    const isTableRef = typeof f.value === 'string' && 
                      /^[a-z_]+\.[a-z_]+$/i.test(f.value);

    // Aplica formatação para operador LIKE em colunas não-data (mantém original)
    if (typeof f.value === 'string' && f.operator?.toUpperCase() === 'LIKE' && !isDateColumn) {
      // Se o usuário já colocou %, mantém como está
      const hasUserPercent = f.value.includes('%');
      
      if (!hasUserPercent) {
        // Se o usuário NÃO colocou %, adiciona % em ambos os lados
        valueToUse = `%${f.value}%`;
      } else {
        // Remove % extras automáticos
        // Caso 1: %%valor% → %valor
        if (f.value.startsWith('%%') && f.value.endsWith('%') && f.value.length > 3) {
          valueToUse = `%${f.value.slice(2, -1)}`;
        }
        // Caso 2: %valor%% → valor%
        else if (f.value.startsWith('%') && f.value.endsWith('%%') && f.value.length > 3) {
          valueToUse = `${f.value.slice(1, -2)}%`;
        }
        // Caso 3: %valor% → mantém %valor% (caso normal do usuário)
        else if (f.value.startsWith('%') && f.value.endsWith('%') && f.value.length > 2) {
          valueToUse = f.value; // Mantém exatamente como o usuário digitou
        }
        // Outros casos: mantém como o usuário digitou
        else {
          valueToUse = f.value;
        }
      }
    } 
    else if (f.operator === '=' && !isTableRef) {
      valueToUse = f.value.charAt(0).toUpperCase() + f.value.slice(1);
    }

    // Para referências de tabela, mantém sem aspas
    if (isTableRef) {
      return `${f.column} ${f.operator} ${f.value.toLowerCase()}`;
    }

    // Para valores normais, aplica escaping
    return `${f.column} ${f.operator} ${quoteValue(valueToUse)}`;
  });

  return conditions.join(' AND ');
}

// Monta parte GROUP BY da query
function buildGroupByPart(groupBy) {
  if (Array.isArray(groupBy) && groupBy.length > 0) {
    return `${groupBy.join(', ')}`;
  } else if (groupBy && typeof groupBy === 'string') {
    return `${groupBy}`;
  }
  return '';
}

// Monta parte HAVING da query
function buildHavingPart(having) {
  if (!having) return '';

  if (Array.isArray(having)) {
    return having
      .map(h => `${h.aggregation} ${h.operator} ${h.value}`)
      .join(' AND ');
  } else if (typeof having === 'string') {
    return having;
  }
  
  return '';
}

// Monta parte ORDER BY da query
function buildOrderByPart(orderBy, columnsArr) {
  if (!orderBy || !Array.isArray(orderBy) || orderBy.length === 0) {
    return '';
  }

  const validClauses = orderBy
    .filter(ob => {
      // Verifica se coluna existe e não está vazia
      const isValid = ob.column && ob.column.trim() !== '';
      
      // Verifica se coluna está presente nas colunas selecionadas
      const columnExists = columnsArr.some(col => {
        const colName = typeof col === 'string' ? col : col.column;
        return colName === ob.column;
      });
      
      return isValid && columnExists;
    })
    .map(ob => {
      const direction = ob.direction ? ob.direction.toUpperCase() : 'ASC';
      return `${ob.column} ${direction}`;
    });

  return validClauses.length > 0 ? `${validClauses.join(', ')}` : '';
}

// Função principal para montar partes da query
function helperDataReport(payload) {
  try {
    // Valida e extrai dados do payload
    const tables = payload.tables || [];
    if (!Array.isArray(tables) || tables.length === 0) {
      throw new Error('É necessário informar ao menos uma tabela em payload.tables');
    }

    const joinType = payload.joinType || 'INNER JOIN';
    const columnsArr = normalizeColumns(payload.columns);
    const aggregationArr = normalizeAggregation(payload.aggregation);
    const filters = Array.isArray(payload.filters) ? payload.filters : [];
    const orderBy = payload.orderBy || null;
    const having = payload.having || null;
    
    // Define GROUP BY padrão se houver agregações
    let groupBy = payload.groupBy || null;
    if (!groupBy && aggregationArr.length > 0) {
      groupBy = columnsArr.length > 0 ? [...columnsArr] : null;
    }

    // Monta as partes da query
    const selectPart = buildSelectPart(columnsArr, aggregationArr);
    const fromPart = buildFromPart(tables, joinType);
    const wherePart = buildWherePart(filters);
    const groupByPart = buildGroupByPart(groupBy);
    const havingPart = buildHavingPart(having);
    const orderByPart = buildOrderByPart(orderBy, columnsArr);

    return {
      selectPart,
      fromPart,
      wherePart,
      groupByPart,
      havingPart,
      orderByPart
    };

  } catch (err) {
    console.error('Erro ao processar dados do relatório:', err);
    throw err;
  }
}

module.exports = {
  isNumeric,
  quoteValue,
  normalizeColumns,
  normalizeAggregation,
  helperDataReport
};
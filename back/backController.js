// utilidades para sanitizar/formatar valores (mantive aqui — agora na rota)
function isNumeric(val) {
  return typeof val === 'number' || (!Array.isArray(val) && !isNaN(val) && val !== '' && !/^\s+$/.test(String(val)));
}
function quoteValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (isNumeric(val)) return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Normaliza entrada de columns/aggs/tables para arrays/strings seguros
function normalizeColumns(columns) {
  if (!columns) return [];
  return columns.map(c => (typeof c === 'string' ? c : c.column)).filter(Boolean);
}
function normalizeAggregation(aggregation) {
  if (!aggregation) return [];
  return aggregation.map(a => {
    return {
      func: (a.func || '').toUpperCase(),
      column: a.column
    };
  }).filter(a => a.func && a.column);
}

function helperDataReport(payload) {
  try {
    // ----------------------------
    // 1) Extrair e normalizar
    // ----------------------------
    const tables = payload.tables || []; // espera array de objetos {name, type?, on?} ou strings
    if (!Array.isArray(tables) || tables.length === 0) {
      return res.status(400).json({ error: 'É necessário informar ao menos uma tabela em payload.tables' });
    }
    const joinType = payload.joinType || 'INNER JOIN';
    const columnsArr = normalizeColumns(payload.columns); // array de strings
    const aggregationArr = normalizeAggregation(payload.aggregation);
    const filters = Array.isArray(payload.filters) ? payload.filters : [];
    const orderBy = payload.orderBy || null;
    const having = payload.having || null; // 👈 nova cláusula HAVING
    // groupBy pode vir como array, string ou como propriedade aggregation.groupBy já definida
    let groupBy = payload.groupBy || null;
    if (!groupBy && Array.isArray(aggregationArr) && aggregationArr.length > 0) {
      // se o front não enviou groupBy, mas tem aggregation, usa as columns como groupBy (comportamento anterior)
      groupBy = columnsArr.length > 0 ? [...columnsArr] : null;
    }

    // ----------------------------
    // 2) Montar SELECT (colunas + agregações)
    // ----------------------------

    // 🔹 Agregações com alias seguro (ex: AVG(saude.valor) AS AVG_saude_valor)
    const aggsPartArr = aggregationArr.map(a => {
      const alias = `${a.func}_${String(a.column).replace(/\./g, '_')}`;
      return `${a.func}(${a.column}) AS ${alias}`;
    });

    // 🔹 Colunas normais com alias seguro (ex: pais.nome AS pais_nome)
    const columnsPartArr = columnsArr.map(c => {
      if (c.includes('.')) {
        const alias = String(c).replace(/\./g, '_');
        return `${c} AS ${alias}`;
      }
      return c; // coluna simples sem tabela
    });

    // 🔹 Select final
    const selectItems = [];
    if (aggsPartArr.length > 0) selectItems.push(...aggsPartArr);
    if (columnsPartArr.length > 0) selectItems.push(...columnsPartArr);

    const selectPart = selectItems.length > 0 ? selectItems.join(', \n\t') : '*';



    // 🔧 Mapa de relações diretas do schema
    const RELATIONS = {
      brands: {
        sub_brands: 'brand_id',
        stores: 'brand_id',
        channels: 'brand_id',
        categories: 'brand_id',
        products: 'brand_id',
        option_groups: 'brand_id',
        items: 'brand_id',
        payment_types: 'brand_id',
        coupons: 'brand_id',
      },
      sub_brands: {
        brands: 'brand_id',
        stores: 'sub_brand_id',
        categories: 'sub_brand_id',
        products: 'sub_brand_id',
        option_groups: 'sub_brand_id',
        items: 'sub_brand_id',
        customers: 'sub_brand_id',
        sales: 'sub_brand_id',
      },
      stores: {
        brands: 'brand_id',
        sub_brands: 'sub_brand_id',
        customers: 'store_id',
        sales: 'store_id',
      },
      channels: {
        brands: 'brand_id',
        sales: 'channel_id',
      },
      categories: {
        brands: 'brand_id',
        sub_brands: 'sub_brand_id',
        products: 'category_id',
        option_groups: 'category_id',
        items: 'category_id',
      },
      products: {
        brands: 'brand_id',
        sub_brands: 'sub_brand_id',
        categories: 'category_id',
        product_sales: 'product_id',
      },
      option_groups: {
        brands: 'brand_id',
        sub_brands: 'sub_brand_id',
        categories: 'category_id',
        item_product_sales: 'option_group_id',
        item_item_product_sales: 'option_group_id',
      },
      items: {
        brands: 'brand_id',
        sub_brands: 'sub_brand_id',
        categories: 'category_id',
        item_product_sales: 'item_id',
        item_item_product_sales: 'item_id',
      },
      customers: {
        stores: 'store_id',
        sub_brands: 'sub_brand_id',
        sales: 'customer_id',
      },
      sales: {
        stores: 'store_id',
        sub_brands: 'sub_brand_id',
        customers: 'customer_id',
        channels: 'channel_id',
        product_sales: 'sale_id',
        delivery_sales: 'sale_id',
        delivery_addresses: 'sale_id',
        payments: 'sale_id',
        coupon_sales: 'sale_id',
      },
      product_sales: {
        sales: 'sale_id',
        products: 'product_id',
        item_product_sales: 'product_sale_id',
      },
      item_product_sales: {
        product_sales: 'product_sale_id',
        items: 'item_id',
        option_groups: 'option_group_id',
        item_item_product_sales: 'item_product_sale_id',
      },
      item_item_product_sales: {
        item_product_sales: 'item_product_sale_id',
        items: 'item_id',
        option_groups: 'option_group_id',
      },
      delivery_sales: {
        sales: 'sale_id',
        delivery_addresses: 'delivery_sale_id',
      },
      delivery_addresses: {
        sales: 'sale_id',
        delivery_sales: 'delivery_sale_id',
      },
      payment_types: {
        brands: 'brand_id',
        payments: 'payment_type_id',
      },
      payments: {
        sales: 'sale_id',
        payment_types: 'payment_type_id',
      },
      coupons: {
        brands: 'brand_id',
        coupon_sales: 'coupon_id',
      },
      coupon_sales: {
        sales: 'sale_id',
        coupons: 'coupon_id',
      },
    };


  // Função auxiliar para buscar recursivamente relacionamento
  function findRelationPath(fromTables, targetTable, relations, visited = new Set()) {
    for (const from of fromTables) {
      if (relations[targetTable]?.[from]) return { source: targetTable, target: from, column: relations[targetTable][from] };
      if (relations[from]?.[targetTable]) return { source: from, target: targetTable, column: relations[from][targetTable] };

      visited.add(from);

      // Explora recursivamente relações do "from"
      for (const next of Object.keys(relations[from] || {})) {
        if (!visited.has(next)) {
          const path = findRelationPath([next], targetTable, relations, visited);
          if (path) return path;
        }
      }
    }
    return null; // Nenhum caminho encontrado
  }

  // ----------------------------
  // 3) Montar FROM e JOINs seguros
  // ----------------------------
  const firstTable = typeof tables[0] === 'string' ? tables[0] : tables[0].name;
  let fromPart = firstTable;

  if (tables.length > 1) {
    for (let i = 1; i < tables.length; i++) {
      const t = tables[i];
      const name = typeof t === 'string' ? t : t.name;

      let joinClause = '';
      const type = (t && t.type) ? t.type.toUpperCase() : joinType || 'INNER JOIN';

      // 1️⃣ Se o front definir manualmente a condição
      if (t?.on?.left && t?.on?.right) {
        joinClause = `${type} ${name} ON ${t.on.left} = ${t.on.right}`;
      } else {
        // 2️⃣ Busca caminho de relação com qualquer tabela já incluída
        const includedTables = tables.slice(0, i).map(tt => (typeof tt === 'string' ? tt : tt.name));
        const path = findRelationPath(includedTables, name, RELATIONS);

        if (path) {
          const { source, target, column } = path;

          // Determina direção correta
          if (RELATIONS[source]?.[target]) {
            joinClause = `${type} ${name} ON ${name}.${column} = ${target}.id`;
          } else {
            joinClause = `${type} ${name} ON ${source}.${column} = ${name}.id`;
          }
        } else {
          console.warn(`⚠️ Nenhuma relação encontrada para ${name}, JOIN ignorado.`);
          continue;
        }
      }

      fromPart += `\n${joinClause}`;
    }
  }


    const tableNames = [
      "brands",
      "sub_brands",
      "stores",
      "channels",
      "categories",
      "products",
      "option_groups",
      "items",
      "customers",
      "sales",
      "product_sales",
      "item_product_sales",
      "item_item_product_sales",
      "delivery_sales",
      "delivery_addresses",
      "payment_types",
      "payments",
      "coupons",
      "coupon_sales"
    ];

    // ----------------------------
    // 4) Montar WHERE (valores já escapados aqui)
    // ----------------------------
    let wherePart = '';
    if (Array.isArray(filters) && filters.length > 0) {
      const conds = filters.map(f => {
        // permite operador 'IN' com array
        if (Array.isArray(f.value)) {
          const vals = f.value.map(v => quoteValue(v)).join(', ');
          return `${f.column} ${f.operator} (${vals})`;
        }

        let valToUse = f.value;

        // 🔍 Verifica se o valor é uma referência a tabela.coluna
        const lowerTables = tableNames.map(t => t.toLowerCase());
        const lowerValue = typeof f.value === 'string' ? f.value.toLowerCase() : '';

        const isTableRef =
          typeof f.value === 'string' &&
          /^[a-z_]+\.[a-z_]+$/i.test(f.value) && // formato tabela.coluna
          (
            lowerTables.some(tbl => lowerValue.startsWith(tbl + '.'))
            || true // ✅ assume que é uma referência válida mesmo que tabela não esteja na lista
          );


        // operadores especiais como LIKE
        if (typeof f.value === 'string' && f.operator?.toUpperCase() === 'LIKE') {
          valToUse = `%${f.value}%`;
        } 
        else if (f.operator === '=' && !isTableRef) {
          // capitaliza valores comuns (mas não referências a tabelas)
          valToUse = f.value.charAt(0).toUpperCase() + f.value.slice(1);
        }

        // 🔧 Se for uma tabela.coluna, deixa sem aspas e lowercase
        if (isTableRef) {
          return `${f.column} ${f.operator} ${lowerValue}`;
        }


        // caso comum: escapa valor com aspas
        return `${f.column} ${f.operator} ${quoteValue(valToUse)}`;
      });

      wherePart = conds.join(' AND ');
    }


    // ----------------------------
    // 5) Montar GROUP BY (já em forma de string)
    // ----------------------------
    let groupByPart = '';
    if (Array.isArray(groupBy) && groupBy.length > 0) {
      groupByPart = `${groupBy.join(', ')}`;
    } else if (groupBy && typeof groupBy === 'string') {
      groupByPart = `${groupBy}`;
    }


    // Monta o HAVING
    let havingPart = '';
    if (having) {
      if (Array.isArray(having)) {
        // Exemplo: [{ column: 'AVG(saude.valor)', operator: '>', value: 100 }]
        havingPart = having
          .map(h => `${h.aggregation} ${h.operator} ${h.value}`)
          .join(' AND ');
      } else if (typeof having === 'string') {
        havingPart = having; // já veio pronto do front
      }
    }


    // ----------------------------
    // 6) Montar ORDER BY (suporte a múltiplas cláusulas)
    // ----------------------------
    let orderByPart = '';
    if (orderBy && Array.isArray(orderBy) && orderBy.length > 0) {
      // transforma cada cláusula em "coluna DIREÇÃO"
      const clauses = orderBy.map(ob => {
        const col = ob.column;
        const dir = ob.direction ? ob.direction.toUpperCase() : 'ASC';
        return `${col} ${dir}`;
      });

      // junta tudo separado por vírgula
      orderByPart = clauses.join(', ');
    }


    // ----------------------------
    // 7) Retornar as partes para a rota
    // ----------------------------
    return {
      selectPart,
      fromPart,
      wherePart,
      groupByPart,
      havingPart,
      orderByPart
    };

  } catch (err) {
      console.error('Erro ao limpar dados do relatório:', err);
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
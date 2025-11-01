const { getAllRelatedTables } = require('../back/DAO/BDmain');


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

// Função para mapear relações do banco
/*
async function buildRelationsMap() {
  try {
    const relations = await getAllRelatedTables();
    const relationsMap = {};
    
    console.log('🔍 [RELATIONS] Mapeando relações do banco...');
    
    relations.forEach(row => {
      const tableName = row.table_name;
      const relatedTable = row.related_table;
      
      if (!relationsMap[tableName]) {
        relationsMap[tableName] = {};
      }
      
      // Para descobrir a coluna FK, precisamos de uma consulta adicional
      // Por enquanto, vamos assumir o padrão: table_id
      const fkColumn = `${relatedTable.replace('s', '')}_id`; // padrão comum
      relationsMap[tableName][relatedTable] = fkColumn;
      
      console.log(`🔍 [RELATIONS] ${tableName} -> ${relatedTable} via ${fkColumn}`);
    });
    
    return relationsMap;
  } catch (error) {
    console.error('❌ Erro ao mapear relações:', error);
    return {};
  }
}
*/
function helperDataReport(payload) {
  try {
    // ----------------------------
    // 1) Extrair e normalizar
    // ----------------------------
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
    
    let groupBy = payload.groupBy || null;
    if (!groupBy && Array.isArray(aggregationArr) && aggregationArr.length > 0) {
      groupBy = columnsArr.length > 0 ? [...columnsArr] : null;
    }

    // ----------------------------
    // 2) Montar SELECT (colunas + agregações)
    // ----------------------------
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
    const selectPart = selectItems.length > 0 ? selectItems.join(', \n\t') : '*';

    // ----------------------------
    // 3) Montar FROM e JOINs seguros - VERSÃO COM RELAÇÕES COMPLETAS
    // ----------------------------
    const firstTable = typeof tables[0] === 'string' ? tables[0] : tables[0].name;
    let fromPart = firstTable;

    console.log('🔍 [DEBUG] Iniciando montagem de JOINs');
    console.log('🔍 [DEBUG] Tabelas:', tables.map(t => typeof t === 'string' ? t : t.name));

    if (tables.length > 1) {
      // 🔥 RELAÇÕES COMPLETAS baseadas no seu schema
    const STATIC_RELATIONS = {
      // Brands e Sub-brands
      brands: {
        sub_brands: 'id', // sub_brands.brand_id → brands.id
        stores: 'id', // stores.brand_id → brands.id
        channels: 'id', // channels.brand_id → brands.id
        categories: 'id', // categories.brand_id → brands.id
        products: 'id', // products.brand_id → brands.id
        option_groups: 'id', // option_groups.brand_id → brands.id
        items: 'id', // items.brand_id → brands.id
        payment_types: 'id', // payment_types.brand_id → brands.id
        coupons: 'id', // coupons.brand_id → brands.id
      },
      sub_brands: {
        brands: 'brand_id', // sub_brands.brand_id → brands.id
        stores: 'id', // stores.sub_brand_id → sub_brands.id
        categories: 'id', // categories.sub_brand_id → sub_brands.id
        products: 'id', // products.sub_brand_id → sub_brands.id
        option_groups: 'id', // option_groups.sub_brand_id → sub_brands.id
        items: 'id', // items.sub_brand_id → sub_brands.id
        customers: 'id', // customers.sub_brand_id → sub_brands.id
        sales: 'id', // sales.sub_brand_id → sub_brands.id
      },
      
      // Stores
      stores: {
        brands: 'brand_id', // stores.brand_id → brands.id
        sub_brands: 'sub_brand_id', // stores.sub_brand_id → sub_brands.id
        customers: 'id', // customers.store_id → stores.id
        sales: 'id', // sales.store_id → stores.id
      },
      
      // Channels
      channels: {
        brands: 'brand_id', // channels.brand_id → brands.id
        sales: 'id', // sales.channel_id → channels.id
      },
      
      // Categories
      categories: {
        brands: 'brand_id', // categories.brand_id → brands.id
        sub_brands: 'sub_brand_id', // categories.sub_brand_id → sub_brands.id
        products: 'id', // products.category_id → categories.id
        option_groups: 'id', // option_groups.category_id → categories.id
        items: 'id', // items.category_id → categories.id
      },
      
      // Products
      products: {
        brands: 'brand_id', // products.brand_id → brands.id
        sub_brands: 'sub_brand_id', // products.sub_brand_id → sub_brands.id
        categories: 'category_id', // products.category_id → categories.id
        product_sales: 'id', // product_sales.product_id → products.id
      },
      
      // Customers
      customers: {
        stores: 'store_id', // customers.store_id → stores.id
        sub_brands: 'sub_brand_id', // customers.sub_brand_id → sub_brands.id
        sales: 'id', // sales.customer_id → customers.id
      },
      
      // Sales (VENDAS - CORRIGIDO)
      sales: {
        stores: 'store_id', // sales.store_id → stores.id
        sub_brands: 'sub_brand_id', // sales.sub_brand_id → sub_brands.id
        customers: 'customer_id', // sales.customer_id → customers.id
        channels: 'channel_id', // sales.channel_id → channels.id
        product_sales: 'id', // product_sales.sale_id → sales.id
        delivery_sales: 'id', // delivery_sales.sale_id → sales.id
        delivery_addresses: 'id', // delivery_addresses.sale_id → sales.id
        payments: 'id', // payments.sale_id → sales.id
        coupon_sales: 'id', // coupon_sales.sale_id → sales.id
      },
      
      // Product Sales
      product_sales: {
        sales: 'sale_id', // product_sales.sale_id → sales.id
        products: 'product_id', // product_sales.product_id → products.id
        item_product_sales: 'id', // item_product_sales.product_sale_id → product_sales.id
      },
      
      // Delivery Sales
      delivery_sales: {
        sales: 'sale_id', // delivery_sales.sale_id → sales.id
        delivery_addresses: 'id', // delivery_addresses.delivery_sale_id → delivery_sales.id
      },
      
      // Delivery Addresses
      delivery_addresses: {
        sales: 'sale_id', // delivery_addresses.sale_id → sales.id
        delivery_sales: 'delivery_sale_id', // delivery_addresses.delivery_sale_id → delivery_sales.id
      },
      
      // Item Product Sales
      item_product_sales: {
        product_sales: 'product_sale_id', // item_product_sales.product_sale_id → product_sales.id
        items: 'item_id', // item_product_sales.item_id → items.id
        option_groups: 'option_group_id', // item_product_sales.option_group_id → option_groups.id
        item_item_product_sales: 'id', // item_item_product_sales.item_product_sale_id → item_product_sales.id
      },
      
      // Items
      items: {
        brands: 'brand_id', // items.brand_id → brands.id
        sub_brands: 'sub_brand_id', // items.sub_brand_id → sub_brands.id
        categories: 'category_id', // items.category_id → categories.id
        item_product_sales: 'id', // item_product_sales.item_id → items.id
        item_item_product_sales: 'id', // item_item_product_sales.item_id → items.id
      },
      
      // Option Groups
      option_groups: {
        brands: 'brand_id', // option_groups.brand_id → brands.id
        sub_brands: 'sub_brand_id', // option_groups.sub_brand_id → sub_brands.id
        categories: 'category_id', // option_groups.category_id → categories.id
        item_product_sales: 'id', // item_product_sales.option_group_id → option_groups.id
        item_item_product_sales: 'id', // item_item_product_sales.option_group_id → option_groups.id
      },
      
      // Payments (CORRIGIDO - payments.sale_id → sales.id)
      payments: {
        sales: 'sale_id', // payments.sale_id → sales.id
        payment_types: 'payment_type_id', // payments.payment_type_id → payment_types.id
      },
      
      // Payment Types
      payment_types: {
        brands: 'brand_id', // payment_types.brand_id → brands.id
        payments: 'id', // payments.payment_type_id → payment_types.id
      },
      
      // Coupons
      coupons: {
        brands: 'brand_id', // coupons.brand_id → brands.id
        coupon_sales: 'id', // coupon_sales.coupon_id → coupons.id
      },
      
      // Coupon Sales
      coupon_sales: {
        sales: 'sale_id', // coupon_sales.sale_id → sales.id
        coupons: 'coupon_id', // coupon_sales.coupon_id → coupons.id
      }
    };

      for (let i = 1; i < tables.length; i++) {
        const currentTable = typeof tables[i] === 'string' ? tables[i] : tables[i].name;
        const previousTables = tables.slice(0, i).map(t => typeof t === 'string' ? t : t.name);
        
        console.log(`\n🔍 [DEBUG] Processando tabela ${i}: ${currentTable}`);
        console.log(`🔍 [DEBUG] Tabelas anteriores: ${previousTables.join(', ')}`);

        const currentJoinType = (tables[i] && tables[i].type) ? tables[i].type.toUpperCase() : joinType;
        let joinCondition = '';
        let relationFound = false;
        let lastCheckedTable = '';

        for (const prevTable of previousTables) {
          lastCheckedTable = prevTable;
          console.log(`🔍 [DEBUG] Verificando ${prevTable} <-> ${currentTable}`);
          
          // DEBUG: Mostrar relações disponíveis
          console.log(`🔍 [DEBUG] STATIC_RELATIONS[${prevTable}]:`, STATIC_RELATIONS[prevTable]);
          console.log(`🔍 [DEBUG] STATIC_RELATIONS[${currentTable}]:`, STATIC_RELATIONS[currentTable]);
          
          // Caso 1: prevTable tem FK apontando para currentTable
          if (STATIC_RELATIONS[prevTable]?.[currentTable]) {
            const fkColumn = STATIC_RELATIONS[prevTable][currentTable];
            // CORREÇÃO: prevTable.fk = currentTable.id
            joinCondition = `${prevTable}.${fkColumn} = ${currentTable}.id`;
            relationFound = true;
            console.log(`✅ [DEBUG] ${prevTable} -> ${currentTable} via ${prevTable}.${fkColumn}`);
            break;
          }

          // Caso 2: currentTable tem FK apontando para prevTable  
          if (STATIC_RELATIONS[currentTable]?.[prevTable]) {
            const fkColumn = STATIC_RELATIONS[currentTable][prevTable];
            // CORREÇÃO: currentTable.fk = prevTable.id
            joinCondition = `${currentTable}.${fkColumn} = ${prevTable}.id`;
            relationFound = true;
            console.log(`✅ [DEBUG] ${currentTable} -> ${prevTable} via ${currentTable}.${fkColumn}`);
            break;
          }
        }

        if (relationFound) {
          const joinClause = `${currentJoinType} ${currentTable} ON ${joinCondition}`;
          fromPart += `\n${joinClause}`;
          console.log(`✅ [DEBUG] JOIN adicionado: ${joinClause}`);
        } else {
          console.warn(`⚠️ [DEBUG] SEM RELAÇÃO para ${currentTable}. JOIN ignorado.`);
          
          // Tentar fallback: procurar qualquer relação possível
          console.log('🔍 [DEBUG] Tentando fallback...');
          for (const relTable in STATIC_RELATIONS) {
            if (STATIC_RELATIONS[relTable]?.[currentTable]) {
              console.log(`🔍 [DEBUG] Fallback encontrado: ${relTable} -> ${currentTable} via ${STATIC_RELATIONS[relTable][currentTable]}`);
            }
            if (STATIC_RELATIONS[currentTable]?.[relTable]) {
              console.log(`🔍 [DEBUG] Fallback encontrado: ${currentTable} -> ${relTable} via ${STATIC_RELATIONS[currentTable][relTable]}`);
            }
          }
        }
      }
    }

    console.log(`\n🔍 [DEBUG] FROM final:\n${fromPart}`);


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
  // 6) Montar ORDER BY (suporte a múltiplas cláusulas) - CORRIGIDO
  // ----------------------------
  let orderByPart = '';
  if (orderBy && Array.isArray(orderBy) && orderBy.length > 0) {
    // 🔥 CORREÇÃO: Filtrar apenas cláusulas válidas
    const validClauses = orderBy
      .filter(ob => {
        // Verifica se a coluna existe e não está vazia
        const isValid = ob.column && ob.column.trim() !== '';
        
        // 🔥 NOVO: Verifica se a coluna está presente nas colunas selecionadas
        const columnExists = columnsArr.some(col => {
          const colName = typeof col === 'string' ? col : col.column;
          return colName === ob.column;
        });
        
        if (isValid && !columnExists) {
          console.warn(`⚠️ [ORDER BY] Coluna "${ob.column}" não encontrada nas colunas selecionadas. Ignorando.`);
        }
        
        return isValid && columnExists;
      })
      .map(ob => {
        const col = ob.column;
        const dir = ob.direction ? ob.direction.toUpperCase() : 'ASC';
        return `${col} ${dir}`;
      });

    // 🔥 CORREÇÃO: Só adiciona ORDER BY se houver cláusulas válidas
    if (validClauses.length > 0) {
      orderByPart = `${validClauses.join(', ')}`;
      console.log('✅ [ORDER BY] Cláusulas aplicadas:', validClauses);
    } else {
      console.log('ℹ️ [ORDER BY] Nenhuma cláusula válida encontrada. ORDER BY ignorado.');
    }
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
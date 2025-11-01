const API_BASE_URL = 'http://localhost:5000';

let cachedTableNames = null;
let cachedRelations = null;

// 🔹 Dicionário de traduções
export const translations = {
  tables: {
    channels: "Canais",
    option_groups: "Grupos de Opções",
    items: "Itens",
    customers: "Clientes",
    product_sales: "Vendas de Produtos",
    stores: "Lojas",
    categories: "Categorias",
    products: "Produtos",
    sales: "Vendas",
    delivery_addresses: "Endereços de Entrega",
    item_product_sales: "Itens de Vendas de Produtos",
    delivery_sales: "Vendas de Entrega",
    payments: "Pagamentos",
    brands: "Marcas",
    sub_brands: "Submarcas",
    item_item_product_sales: "Itens de Itens de Vendas",
    payment_types: "Tipos de Pagamento",
    coupons: "Cupons",
    coupon_sales: "Cupons de Venda"
  },

  // 🔥 TRADUÇÕES ESPECÍFICAS PARA OS PADRÕES ENCONTRADOS
  columns: {
    // Tabelas + colunas
    items_name: 'Nome do Item',
    brands_name: 'Nome da Marca',
    products_name: 'Nome do Produto',
    categories_name: 'Nome da Categoria',
    stores_name: 'Nome da Loja',
    customers_name: 'Nome do Cliente',
    channels_name: 'Nome do Canal',
    payment_types_name: 'Nome do Tipo de Pagamento',
    coupons_name: 'Nome do Cupom',
    
    // Colunas com prefixos de tabela
    items_id: 'ID do Item',
    brands_id: 'ID da Marca',
    products_id: 'ID do Produto',
    categories_id: 'ID da Categoria',
    stores_id: 'ID da Loja',
    customers_id: 'ID do Cliente',
    sales_id: 'ID da Venda',
    payment_types_id: 'ID do Tipo de Pagamento',
    
    // Colunas de vendas e produtos
    item_product_sales_price: 'Preço do Item',
    item_product_sales_quantity: 'Quantidade do Item',
    product_sales_total_price: 'Preço Total da Venda',
    sales_value_paid: 'Valor Pago',
    sales_customer_name: 'Nome do Cliente',
    sales_total_discount: 'Desconto Total',
    sales_total_increase: 'Acréscimo Total',
    sales_delivery_fee: 'Taxa de Entrega',
    sales_service_tax_fee: 'Taxa de Serviço',
    
    // Colunas de agregação
    sum_item_product_sales_price: 'Soma do Preço dos Itens',
    sum_product_sales_total_price: 'Soma do Preço Total',
    sum_sales_value_paid: 'Soma do Valor Pago',
    avg_item_product_sales_price: 'Média do Preço dos Itens',
    avg_product_sales_total_price: 'Média do Preço Total',
    count_items_name: 'Contagem de Itens',
    count_customers_name: 'Contagem de Clientes',
    
    // Fallback: remove prefixos e usa traduções básicas
    name: 'Nome',
    id: 'ID',
    price: 'Preço',
    quantity: 'Quantidade',
    total_price: 'Preço Total',
    value_paid: 'Valor Pago',
    customer_name: 'Nome do Cliente',
    product_name: 'Nome do Produto',
    created_at: 'Data de Criação',
    updated_at: 'Última Atualização',
    status: 'Status',
    total_amount: 'Valor Total',
    base_price: 'Preço Base',
    observations: 'Observações',
    store_id: 'ID da Loja',
    sub_brand_id: 'ID da Submarca',
    brand_id: 'ID da Marca',
    category_id: 'ID da Categoria',
    sale_id: 'ID da Venda',
    item_id: 'ID do Item',
    option_group_id: 'ID do Grupo de Opções',
    delivery_sale_id: 'ID da Venda de Entrega',
    courier_id: 'ID do Entregador',
    courier_name: 'Nome do Entregador',
    courier_phone: 'Telefone do Entregador',
    courier_type: 'Tipo do Entregador',
    delivered_by: 'Entregue Por',
    delivery_type: 'Tipo de Entrega',
    discount_type: 'Tipo de Desconto',
    discount_value: 'Valor do Desconto',
    is_active: 'Ativo',
    valid_from: 'Válido de',
    valid_until: 'Válido até',
    value: 'Valor',
    payment_type_id: 'ID do Tipo de Pagamento',
    is_online: 'Online',
    currency: 'Moeda',
    cod_sale1: 'Código Venda 1',
    cod_sale2: 'Código Venda 2',
    sale_status_desc: 'Status da Venda',
    total_discount: 'Desconto Total',
    total_increase: 'Acréscimo Total',
    delivery_fee: 'Taxa de Entrega',
    service_tax_fee: 'Taxa de Serviço',
    production_seconds: 'Segundos de Produção',
    delivery_seconds: 'Segundos de Entrega',
    people_quantity: 'Quantidade de Pessoas',
    discount_reason: 'Motivo do Desconto',
    increase_reason: 'Motivo do Acréscimo',
    origin: 'Origem',
    street: 'Rua',
    number: 'Número',
    complement: 'Complemento',
    formatted_address: 'Endereço Formatado',
    neighborhood: 'Bairro',
    city: 'Cidade',
    state: 'Estado',
    country: 'País',
    postal_code: 'CEP',
    reference: 'Referência',
    email: 'Email',
    phone_number: 'Telefone',
    cpf: 'CPF',
    birth_date: 'Data de Nascimento',
    gender: 'Gênero',
    registration_origin: 'Origem do Registro',
    agree_terms: 'Aceitou os Termos',
    receive_promotions_email: 'Recebe Promoções por Email',
    receive_promotions_sms: 'Recebe Promoções por SMS',
  },

  // 🔥 NOVO: Traduções para nomes de tabelas que aparecem em colunas
  tableNames: {
    items: 'Itens',
    brands: 'Marcas',
    products: 'Produtos',
    categories: 'Categorias',
    stores: 'Lojas',
    customers: 'Clientes',
    sales: 'Vendas',
    payment_types: 'Tipos de Pagamento',
    coupons: 'Cupons',
    channels: 'Canais',
    option_groups: 'Grupos de Opções',
    product_sales: 'Vendas de Produtos',
    delivery_addresses: 'Endereços de Entrega',
    item_product_sales: 'Itens de Vendas',
    delivery_sales: 'Vendas de Entrega',
    payments: 'Pagamentos',
    sub_brands: 'Submarcas',
    item_item_product_sales: 'Itens de Vendas Detalhados',
    coupon_sales: 'Cupons de Venda'
  }
};

// 🔹 Função auxiliar para traduzir com fallback
export function translate(category, key) {
  return translations[category]?.[key] || key;
}

// 🔹 NOVA FUNÇÃO: Extrai e traduz nomes de tabelas de colunas (ModalChart)
export function extractAndTranslateTableName(columnName) {
  if (!columnName) return '';
  
  // Padrões comuns: tabela_coluna ou prefixo_tabela_coluna
  const parts = columnName.split('_');
  
  // Tenta encontrar o nome da tabela nos primeiros segmentos
  for (let i = 0; i < parts.length; i++) {
    const potentialTableName = parts.slice(0, i + 1).join('_');
    
    if (translations.tableNames[potentialTableName]) {
      return translations.tableNames[potentialTableName];
    }
    
    // Verifica também no plural/singular
    if (potentialTableName.endsWith('s')) {
      const singular = potentialTableName.slice(0, -1);
      if (translations.tableNames[singular]) {
        return translations.tableNames[singular];
      }
    }
  }
  
  return '';
}

// Função para buscar os nomes das tabelas do banco de dados
export async function getTableNames() {
  if (cachedTableNames) return cachedTableNames;

  try {
    const res = await fetch(`${API_BASE_URL}/tables`);
    cachedTableNames = await res.json();
    return cachedTableNames;
  } catch (err) {
    console.error('Erro ao buscar tabelas:', err);
    return [];
  }
}


// Função para buscar todas as relações entre tabelas
export async function getAllRelatedTables() {
  if (cachedRelations) return cachedRelations;

  try {
    const res = await fetch(`${API_BASE_URL}/all-related-tables`);
    const data = await res.json();

    // monta um grafo de relações: { tabela: [relacionadas] }
    cachedRelations = {};
    data.forEach(rel => {
      if (!cachedRelations[rel.table_name]) cachedRelations[rel.table_name] = [];
      if (!cachedRelations[rel.related_table]) cachedRelations[rel.related_table] = [];

      cachedRelations[rel.table_name].push(rel.related_table);
      cachedRelations[rel.related_table].push(rel.table_name);
    });

    return cachedRelations;
  } catch (err) {
    console.error('Erro ao buscar relações:', err);
    return {};
  }
}


// Função para buscar os atributos (colunas) de uma tabela específica
export async function getTableAttributes(tableName) {
  try {
    const res = await fetch(`${API_BASE_URL}/attributes/${tableName}`);
    return await res.json();
  } catch (err) {
    console.error('Erro ao buscar atributos:', err);
    return [];
  }
}

// Função pai para distribuir o payload
export async function handleReportGeneration(payload) {
  try {
    // Executa ambas as funções em paralelo
    const [reportResult, queryResult] = await Promise.all([
      postDataReport(payload),
      postQueryToView(payload)
    ]);

    // retorna ambos os resultados
    return {
      report: reportResult,
      query: queryResult
    };

  } catch (err) {
    console.error('Erro no processamento do relatório:', err);
    return { 
      error: 'Erro no processamento do relatório',
      report: null,
      query: null
    };
  }
}

// Suas funções originais (mantenha como estão)
export async function postDataReport(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/query-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error('Erro ao enviar dados para relatório:', err);
    return { error: 'Erro ao enviar dados para relatório' };
  }
}

// Função que envia os dados e recebe a query SQL
export async function postQueryToView(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/query-to-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const { fullQuery } = await res.json();

    return fullQuery;
  } catch (err) {
    console.error('Erro ao buscar consulta para visualização:', err);
    return '';
  }
}

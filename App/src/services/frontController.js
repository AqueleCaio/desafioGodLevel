const API_BASE_URL = 'http://localhost:5000';

let cachedTableNames = null;
let cachedRelations = null;

// Dicionário de traduções
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
    item_item_product_sales: "Itens de Vendas Detalhados",
    payment_types: "Tipos de Pagamento",
    coupons: "Cupons",
    coupon_sales: "Cupons de Venda"
  },

  columns: {
    // Atributos básicos
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
    
    // Novas traduções identificadas nos outputs
    description: 'Descrição',
    type: 'Tipo',
    pos_uuid: 'UUID do POS',
    deleted_at: 'Data de Exclusão',
    customer_id: 'ID do Cliente',
    channel_id: 'ID do Canal',
    total_amount_items: 'Valor Total dos Itens',
    latitude: 'Latitude',
    longitude: 'Longitude',
    district: 'Distrito',
    address_street: 'Rua do Endereço',
    address_number: 'Número do Endereço',
    zipcode: 'CEP',
    is_own: 'É Dono(a)',
    is_holding: 'Aguardando',
    creation_date: 'Data de Criação',
    product_id: 'ID do Produto',
    product_sale_id: 'ID da Venda de Produto',
    additional_price: 'Preço Adicional',
    amount: 'Valor',
    courier_fee: 'Taxa do Entregador',
    timing: 'Tempo',
    mode: 'Modo',
    code: 'Código',
    target: 'Alvo',
    sponsorship: 'Patrocínio',
    
    // Atributos de agregação
    sum: 'Soma',
    avg: 'Média',
    count: 'Contagem',
    min: 'Mínimo',
    max: 'Máximo'
  }
};

// Extrai nome da tabela de uma coluna
export const extractTableFromColumn = (columnId) => {
  if (!columnId) return '';
  
  const parts = columnId.split('.');
  if (parts.length === 2) {
    return parts[0];
  }
  
  const match = columnId.match(/(sum|avg|count|min|max)\((\w+)\.\w+\)/);
  if (match && match[2]) {
    return match[2];
  }
  
  return columnId;
};

// Extrai apenas o nome da coluna (sem tabela)
export const extractColumnNameOnly = (columnId) => {
  if (!columnId) return '';
  
  const parts = columnId.split('.');
  if (parts.length === 2) {
    return parts[1];
  }
  
  const match = columnId.match(/(sum|avg|count|min|max)\((\w+)\.(\w+)\)/);
  if (match && match[3]) {
    return match[3];
  }
  
  return columnId;
};

// Traduz nomes de colunas
export const translateColumnName = (columnId) => {
  if (!columnId) return '';
  
  if (translations.columns[columnId]) {
    return translations.columns[columnId];
  }
  
  const parts = columnId.split('.');
  if (parts.length === 2) {
    const [table, column] = parts;
    if (translations.columns[column]) {
      return translations.columns[column];
    }
  }
  
  const aggMatch = columnId.match(/(sum|avg|count|min|max)\((\w+)\.(\w+)\)/);
  if (aggMatch) {
    const [_, aggFunc, table, column] = aggMatch;
    
    if (translations.columns[column]) {
      const aggTranslations = {
        'sum': 'Soma',
        'avg': 'Média', 
        'count': 'Contagem',
        'min': 'Mínimo',
        'max': 'Máximo'
      };
      return `${aggTranslations[aggFunc]} ${translations.columns[column]}`;
    }
  }
  
  return columnId.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Traduz nomes de tabelas
export const translateTableName = (tableName) => {
  if (!tableName) return '';
  return translations.tables[tableName] || tableName;
};

// Extrai e traduz nomes de tabelas de colunas
export function extractAndTranslateTableName(columnName) {
  if (!columnName) return '';
  
  const parts = columnName.split('_');
  
  for (let i = 0; i < parts.length; i++) {
    const potentialTableName = parts.slice(0, i + 1).join('_');
    
    if (translations.tables[potentialTableName]) {
      return translations.tables[potentialTableName];
    }
    
    if (potentialTableName.endsWith('s')) {
      const singular = potentialTableName.slice(0, -1);
      if (translations.tables[singular]) {
        return translations.tables[singular];
      }
    }
  }
  
  return '';
}

// Busca nomes das tabelas do banco de dados
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

// Busca todas as relações entre tabelas
export async function getAllRelatedTables() {
  if (cachedRelations) return cachedRelations;

  try {
    const res = await fetch(`${API_BASE_URL}/all-related-tables`);
    const data = await res.json();

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

// Busca atributos (colunas) de uma tabela específica
export async function getTableAttributes(tableName) {
  try {
    const res = await fetch(`${API_BASE_URL}/attributes/${tableName}`);
    return await res.json();
  } catch (err) {
    console.error('Erro ao buscar atributos:', err);
    return [];
  }
}

// Processa geração de relatório distribuindo o payload
export async function handleReportGeneration(payload) {
  try {
    const [reportResult, queryResult] = await Promise.all([
      postDataReport(payload),
      postQueryToView(payload)
    ]);

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

// Envia dados para geração de relatório
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

// Envia dados e recebe query SQL para visualização
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
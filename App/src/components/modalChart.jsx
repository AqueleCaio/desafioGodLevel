import { useState, useEffect, useMemo } from 'react';
import '../styles/ModalChart.css';
import { FaTimes, FaCheck, FaTags, FaChartBar, FaSlidersH } from 'react-icons/fa';
import { translations, extractAndTranslateTableName } from '../services/frontController';

const ModalChart = ({ 
  isOpen, 
  onClose, 
  selectedCategories, 
  onCategoriesChange,
  columns = [],
  selectedValueColumns,
  onValueColumnsChange,
  rows = []
}) => {
  const [localSelectedCategories, setLocalSelectedCategories] = useState([]);
  const [localSelectedValueColumns, setLocalSelectedValueColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('categories');
  const [maxItems, setMaxItems] = useState(10);
  const [sortBy, setSortBy] = useState('value');

  // 🔥 FUNÇÃO ATUALIZADA: Formatar nome da coluna com traduções
  const formatColumnName = (columnName) => {
    if (!columnName) return '';
    
    // 1️⃣ PRIMEIRO: Busca tradução exata no dicionário
    const exactTranslation = translations.columns[columnName];
    if (exactTranslation) {
      return exactTranslation;
    }
    
    // 2️⃣ SEGUNDO: Para colunas com prefixos de agregação
    const aggregationPrefixes = ['sum_', 'avg_', 'count_', 'max_', 'min_'];
    for (const prefix of aggregationPrefixes) {
      if (columnName.startsWith(prefix)) {
        const baseColumn = columnName.replace(prefix, '');
        const baseTranslation = translations.columns[baseColumn];
        
        if (baseTranslation) {
          const prefixTranslations = {
            'sum_': `Soma de ${baseTranslation}`,
            'avg_': `Média de ${baseTranslation}`,
            'count_': `Contagem de ${baseTranslation}`,
            'max_': `Máximo de ${baseTranslation}`,
            'min_': `Mínimo de ${baseTranslation}`
          };
          return prefixTranslations[prefix];
        }
        
        // 🔥 NOVO: Se não encontrou tradução para a coluna base, tenta traduzir a tabela
        const tableName = extractAndTranslateTableName(baseColumn);
        if (tableName) {
          const columnWithoutTable = baseColumn.replace(new RegExp(`^${extractTablePrefix(baseColumn)}_?`), '');
          const columnTranslation = translations.columns[columnWithoutTable] || formatColumnNameFallback(columnWithoutTable);
          
          const prefixTranslations = {
            'sum_': `Soma de ${tableName} - ${columnTranslation}`,
            'avg_': `Média de ${tableName} - ${columnTranslation}`,
            'count_': `Contagem de ${tableName}`,
            'max_': `Máximo de ${tableName} - ${columnTranslation}`,
            'min_': `Mínimo de ${tableName} - ${columnTranslation}`
          };
          return prefixTranslations[prefix];
        }
      }
    }
    
    // 3️⃣ TERCEIRO: Tenta traduzir nome da tabela + coluna
    const tableName = extractAndTranslateTableName(columnName);
    if (tableName) {
      const columnWithoutTable = columnName.replace(new RegExp(`^${extractTablePrefix(columnName)}_?`), '');
      const columnTranslation = translations.columns[columnWithoutTable] || formatColumnNameFallback(columnWithoutTable);
      return `${tableName} - ${columnTranslation}`;
    }
    
    // 4️⃣ QUARTO: Fallback - Formatação básica
    return formatColumnNameFallback(columnName);
  };

  // 🔥 FUNÇÃO AUXILIAR: Extrai prefixo da tabela
  const extractTablePrefix = (columnName) => {
    const parts = columnName.split('_');
    for (let i = 0; i < parts.length; i++) {
      const potentialTableName = parts.slice(0, i + 1).join('_');
      if (translations.tableNames[potentialTableName]) {
        return potentialTableName;
      }
    }
    return '';
  };

  // 🔥 FUNÇÃO AUXILIAR: Formatação fallback do nome da coluna
  const formatColumnNameFallback = (columnName) => {
    const words = columnName.split('_');
    const capitalizedWords = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    return capitalizedWords.join(' ');
  };

  // 🔥 FUNÇÃO ATUALIZADA: Determinar a tabela de origem com tradução
  const getFieldTable = (fieldName) => {
    // Usa a função de extração de nome de tabela para obter a tradução
    const tableName = extractAndTranslateTableName(fieldName);
    return tableName || 'Consulta';
  };

  // 🔥 CORREÇÃO: Inicializar estados locais quando o modal abre OU quando as colunas mudam
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedCategories([...selectedCategories]);
      
      // 🔥 CORREÇÃO CRÍTICA: Filtrar apenas as métricas que ainda existem nas colunas atuais
      const availableValueColumns = selectedValueColumns.filter(column => 
        columns.some(col => {
          const colName = col.column || col.dataKey || col;
          return colName === column;
        })
      );
      setLocalSelectedValueColumns(availableValueColumns);
      
      setSearchTerm('');
      setActiveTab('categories');
      setMaxItems(10);
      setSortBy('value');
    }
  }, [isOpen, selectedCategories, selectedValueColumns, columns]);

  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.keyCode === 27) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // 🔥 CORREÇÃO: Função para detectar colunas numéricas baseada nos dados reais
  const isNumericColumn = (columnName) => {
    // Primeiro verifica se temos dados reais para analisar
    if (rows && rows.length > 0) {
      const sampleValue = rows[0][columnName];
      if (sampleValue !== undefined && sampleValue !== null) {
        // Se o valor é numérico, é uma coluna numérica
        return !isNaN(parseFloat(sampleValue)) && isFinite(sampleValue);
      }
    }

    // Fallback: padrões de nomes para colunas numéricas
    const numericPatterns = [
      /^sum_/i,
      /^avg_/i,
      /^count_/i,
      /^max_/i,
      /^min_/i,
      /_sum$/i,
      /_avg$/i,
      /_count$/i,
      /_max$/i,
      /_min$/i,
      /_price$/i,
      /_value$/i,
      /_amount$/i,
      /_quantity$/i,
      /_fee$/i,
      /_discount$/i,
      /_increase$/i,
      /_seconds$/i,
      /total_/i,
      /valor/i,
      /value/i,
      /price/i,
      /amount/i,
      /quantidade/i,
      /quantity/i
    ];
    
    const categoricalPatterns = [
      /_name$/i,
      /_desc$/i,
      /_description$/i,
      /_type$/i,
      /_status$/i,
      /_city$/i,
      /_state$/i,
      /_country$/i,
      /_street$/i,
      /_address$/i,
      /_email$/i,
      /_phone$/i,
      /_cpf$/i,
      /_gender$/i,
      /_origin$/i,
      /_code$/i,
      /_uuid$/i,
      /_zipcode$/i,
      /_postal_code$/i,
      /_date$/i,
      /_at$/i,
      /name$/i,
      /nome/i,
      /descricao/i,
      /description/i,
      /tipo/i,
      /type/i,
      /categoria/i,
      /category/i
    ];

    // Se tem padrão numérico e NÃO tem padrão categórico
    const hasNumericPattern = numericPatterns.some(pattern => pattern.test(columnName));
    const hasCategoricalPattern = categoricalPatterns.some(pattern => pattern.test(columnName));
    
    return hasNumericPattern && !hasCategoricalPattern;
  };

  // 🔥 CORREÇÃO: Função para detectar colunas categóricas baseada nos dados reais
  const isCategoricalColumn = (columnName) => {
    // Primeiro verifica se temos dados reais para analisar
    if (rows && rows.length > 0) {
      const sampleValue = rows[0][columnName];
      if (sampleValue !== undefined && sampleValue !== null) {
        // Se o valor NÃO é numérico, é uma coluna categórica
        return isNaN(parseFloat(sampleValue)) || !isFinite(sampleValue);
      }
    }

    // Fallback: padrões de nomes para colunas categóricas
    const categoricalPatterns = [
      /_name$/i,
      /_desc$/i,
      /_description$/i,
      /_type$/i,
      /_status$/i,
      /_city$/i,
      /_state$/i,
      /_country$/i,
      /_street$/i,
      /_address$/i,
      /_email$/i,
      /_phone$/i,
      /_cpf$/i,
      /_gender$/i,
      /_origin$/i,
      /_code$/i,
      /_uuid$/i,
      /_zipcode$/i,
      /_postal_code$/i,
      /_date$/i,
      /_at$/i,
      /^name$/i,
      /^type$/i,
      /^status$/i,
      /^city$/i,
      /^country$/i,
      /nome/i,
      /name/i,
      /descricao/i,
      /description/i,
      /tipo/i,
      /type/i,
      /categoria/i,
      /category/i,
      /regiao/i,
      /region/i,
      /cidade/i,
      /city/i,
      /estado/i,
      /state/i,
      /pais/i,
      /country/i
    ];

    const numericPatterns = [
      /^sum_/i,
      /^avg_/i,
      /^count_/i,
      /^max_/i,
      /^min_/i,
      /_sum$/i,
      /_avg$/i,
      /_count$/i,
      /_max$/i,
      /_min$/i,
      /_price$/i,
      /_value$/i,
      /_amount$/i,
      /_quantity$/i,
      /valor/i,
      /value/i,
      /price/i,
      /amount/i
    ];

    // Se tem padrão categórico e NÃO tem padrão numérico
    const hasCategoricalPattern = categoricalPatterns.some(pattern => pattern.test(columnName));
    const hasNumericPattern = numericPatterns.some(pattern => pattern.test(columnName));
    
    return hasCategoricalPattern && !hasNumericPattern;
  };

  // 🔥 CORREÇÃO: Detectar colunas baseado nos resultados reais da query
  const detectedColumns = useMemo(() => {
    if (!columns || columns.length === 0) {
      console.log('🔍 [DEBUG] Nenhuma coluna recebida');
      return [];
    }
    
    console.log('🔍 [DEBUG] Colunas recebidas:', columns);
    console.log('🔍 [DEBUG] Dados reais (primeira linha):', rows && rows.length > 0 ? rows[0] : 'Nenhum dado');
    
    return columns.map(col => {
      const columnName = col.column || col.dataKey || col;
      const isNumeric = isNumericColumn(columnName);
      const isCategorical = isCategoricalColumn(columnName);
      
      // Debug para verificar a detecção
      if (rows && rows.length > 0) {
        const sampleValue = rows[0][columnName];
        console.log(`🔍 [DEBUG] Coluna ${columnName}: valor=${sampleValue}, numérico=${isNumeric}, categórico=${isCategorical}`);
      }
      
      return {
        dataKey: columnName,
        name: formatColumnName(columnName), // 🔥 ATUALIZADO: Usa a nova função de formatação
        type: isNumeric ? 'number' : 'string',
        isNumeric,
        isCategorical
      };
    });
  }, [columns, rows]);

  // 🔥 CORREÇÃO: Extrair colunas numéricas
  const numericColumns = useMemo(() => {
    const numeric = detectedColumns.filter(col => col.isNumeric);
    console.log('🔍 [DEBUG] Colunas numéricas detectadas:', numeric.map(n => n.dataKey));
    return numeric;
  }, [detectedColumns]);

  // 🔥 CORREÇÃO: Extrair colunas categóricas
  const categoricalColumns = useMemo(() => {
    const categorical = detectedColumns.filter(col => col.isCategorical);
    console.log('🔍 [DEBUG] Colunas categóricas detectadas:', categorical.map(c => c.dataKey));
    return categorical;
  }, [detectedColumns]);

  // 🔥 CORREÇÃO: Mover filteredCategories para depois da definição de categoricalColumns
  const filteredCategories = useMemo(() => {
    return categoricalColumns.filter(col =>
      col.dataKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatColumnName(col.dataKey).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categoricalColumns, searchTerm]);

  // Funções de toggle (mesma lógica do primeiro código)
  const handleCategoryToggle = (category) => {
    setLocalSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(item => item !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleValueColumnToggle = (column) => {
    setLocalSelectedValueColumns(prev => {
      if (prev.includes(column)) {
        return prev.filter(item => item !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  // Funções de seleção/limpeza (mantidas do código original)
  const handleSelectAllCategories = () => {
    setLocalSelectedCategories(categoricalColumns.map(col => col.dataKey));
  };

  const handleClearAllCategories = () => {
    setLocalSelectedCategories([]);
  };

  const handleSelectAllValueColumns = () => {
    setLocalSelectedValueColumns(numericColumns.map(col => col.dataKey));
  };

  const handleClearAllValueColumns = () => {
    setLocalSelectedValueColumns([]);
  };

  // 🔥 CORREÇÃO: Função para gerar dados do gráfico usando dados REAIS com LIMITES e ORDENAÇÃO
  const generateChartData = () => {
    if (localSelectedCategories.length === 0 || localSelectedValueColumns.length === 0 || !rows || rows.length === 0) {
      console.log('🔍 [DEBUG] Dados insuficientes para gerar gráfico');
      return [];
    }

    console.log('🔍 [DEBUG] Gerando dados do gráfico com:', {
      categories: localSelectedCategories,
      metrics: localSelectedValueColumns,
      maxItems,
      sortBy,
      rowCount: rows.length
    });

    // Agrupamento de dados REAIS
    const groupedData = rows.reduce((acc, item) => {
      const key = localSelectedCategories.map(attr => item[attr] || 'N/A').join(' - ');
      
      if (!acc[key]) {
        acc[key] = { label: key };
        localSelectedValueColumns.forEach(metric => {
          acc[key][metric] = 0;
        });
      }
      
      localSelectedValueColumns.forEach(metric => {
        const value = parseFloat(item[metric]) || 0;
        acc[key][metric] += value;
      });
      
      return acc;
    }, {});

    // Converter para array e aplicar ordenação
    let result = Object.values(groupedData);
    
    console.log('🔍 [DEBUG] Dados agrupados (antes da ordenação):', result.length, 'grupos');

    // 🔥 CORREÇÃO: Aplicar ordenação baseada na configuração
    if (sortBy === 'value') {
      // Ordenar por valor (soma da primeira métrica selecionada)
      const primaryMetric = localSelectedValueColumns[0];
      result.sort((a, b) => (b[primaryMetric] || 0) - (a[primaryMetric] || 0));
      console.log('🔍 [DEBUG] Ordenado por valor (maior para menor) usando métrica:', primaryMetric);
    } else if (sortBy === 'alphabetical') {
      // Ordenar alfabeticamente pelo label
      result.sort((a, b) => a.label.localeCompare(b.label));
      console.log('🔍 [DEBUG] Ordenado alfabeticamente');
    }

    // 🔥 CORREÇÃO: Aplicar limite de itens
    if (maxItems > 0 && result.length > maxItems) {
      console.log('🔍 [DEBUG] Aplicando limite de', maxItems, 'itens. Total antes:', result.length);
      result = result.slice(0, maxItems);
      console.log('🔍 [DEBUG] Total depois do limite:', result.length);
    }

    console.log('🔍 [DEBUG] Dados finais do gráfico:', result.length, 'itens');
    return result;
  };

  const handleApply = () => {
    onCategoriesChange(localSelectedCategories);
    onValueColumnsChange(localSelectedValueColumns);
    onClose({
      categories: localSelectedCategories,
      valueColumns: localSelectedValueColumns,
      maxItems,
      sortBy,
      chartData: generateChartData()
    });
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configurar Gráfico</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes size={20} />
          </button>
        </div>

        {/* Debug Info */}
        <div className="debug-info" style={{padding: '10px', background: '#f5f5f5', fontSize: '12px', color: '#666'}}>
          <strong>Debug:</strong> {detectedColumns.length} colunas detectadas | 
          {categoricalColumns.length} categóricas | 
          {numericColumns.length} numéricas |
          {rows ? rows.length : 0} linhas de dados |
          Máx: {maxItems} itens |
          Ordenar: {sortBy === 'value' ? 'valor' : 'A-Z'} |
          Métricas selecionadas: {localSelectedValueColumns.length}
        </div>

        {/* Tabs de Navegação */}
        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <FaTags size={14} />
            Agrupamento ({categoricalColumns.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            <FaChartBar size={14} />
            Métricas ({numericColumns.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'range' ? 'active' : ''}`}
            onClick={() => setActiveTab('range')}
          >
            <FaSlidersH size={14} />
            Limites
          </button>
        </div>

        <div className="modal-body">
          {/* Tab Categorias */}
          {activeTab === 'categories' && (
            <div className="config-section">
              <div className="section-header">
                <FaTags className="section-icon" />
                <h3>Agrupar por Categorias</h3>
              </div>
              
              <p className="section-description">
                Selecione os campos categóricos para agrupar os dados no eixo X do gráfico:
              </p>

              <div className="categories-controls">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Buscar campos categóricos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                
                <div className="bulk-actions">
                  <button onClick={handleSelectAllCategories} className="bulk-btn">
                    Selecionar Todos
                  </button>
                  <button onClick={handleClearAllCategories} className="bulk-btn">
                    Limpar Seleção
                  </button>
                </div>
              </div>

              <div className="categories-list">
                {filteredCategories.map(column => (
                  <label key={column.dataKey} className="category-checkbox">
                    <input
                      type="checkbox"
                      checked={localSelectedCategories.includes(column.dataKey)}
                      onChange={() => handleCategoryToggle(column.dataKey)}
                    />
                    <span className="checkmark"></span>
                    <div className="category-info">
                      <span className="category-name">
                        {formatColumnName(column.dataKey)}
                      </span>
                      <span className="category-source">
                        ({getFieldTable(column.dataKey)})
                      </span>
                    </div>
                  </label>
                ))}
                {filteredCategories.length === 0 && (
                  <div className="no-results">
                    <p>Nenhum campo categórico encontrado</p>
                    <small>Colunas detectadas: {detectedColumns.map(c => c.dataKey).join(', ')}</small>
                  </div>
                )}
              </div>

              <div className="selection-info">
                {localSelectedCategories.length} de {categoricalColumns.length} campos categóricos selecionados
              </div>

              {localSelectedCategories.length > 0 && (
                <div className="grouping-preview">
                  <h4>Prévia do Agrupamento:</h4>
                  <p>Os dados serão agrupados por: {localSelectedCategories.map(formatColumnName).join(' → ')}</p>
                  <small>Baseado em {rows ? rows.length : 0} registros de dados reais</small>
                </div>
              )}
            </div>
          )}

          {/* Tab Métricas */}
          {activeTab === 'metrics' && (
            <div className="config-section">
              <div className="section-header">
                <FaChartBar className="section-icon" />
                <h3>Selecionar Métricas</h3>
              </div>
              
              <p className="section-description">
                Escolha quais métricas numéricas deseja visualizar no eixo Y do gráfico:
              </p>

              <div className="bulk-actions">
                <button onClick={handleSelectAllValueColumns} className="bulk-btn">
                  Selecionar Todas
                </button>
                <button onClick={handleClearAllValueColumns} className="bulk-btn">
                  Limpar Seleção
                </button>
              </div>

              <div className="metrics-list">
                {numericColumns.map(column => (
                  <label key={column.dataKey} className="metric-checkbox">
                    <input
                      type="checkbox"
                      checked={localSelectedValueColumns.includes(column.dataKey)}
                      onChange={() => handleValueColumnToggle(column.dataKey)}
                    />
                    <span className="checkmark"></span>
                    <div className="metric-info">
                      <span className="metric-name">
                        {formatColumnName(column.dataKey)}
                      </span>
                      <span className="metric-source">
                        ({getFieldTable(column.dataKey)})
                      </span>
                    </div>
                  </label>
                ))}
                {numericColumns.length === 0 && (
                  <div className="no-metrics">
                    <p>Nenhuma métrica numérica encontrada</p>
                    <small>Colunas detectadas: {detectedColumns.map(c => c.dataKey).join(', ')}</small>
                  </div>
                )}
              </div>

              <div className="selection-info">
                {localSelectedValueColumns.length} de {numericColumns.length} métricas selecionadas
              </div>

              {localSelectedValueColumns.length > 0 && (
                <div className="grouping-preview">
                  <h4>Métricas Selecionadas:</h4>
                  <p>{localSelectedValueColumns.map(formatColumnName).join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab Range/Limites */}
          {activeTab === 'range' && (
            <div className="config-section">
              <div className="section-header">
                <FaSlidersH className="section-icon" />
                <h3>Configurar Limites do Gráfico</h3>
              </div>
              
              <p className="section-description">
                Defina quantos itens mostrar no eixo X e como ordená-los:
              </p>

              <div className="range-controls">
                <div className="range-group">
                  <label className="range-label">
                    Máximo de Itens no Eixo X:
                    <span className="range-value">{maxItems} itens</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={maxItems}
                    onChange={(e) => setMaxItems(parseInt(e.target.value))}
                    className="range-slider"
                  />
                  <div className="range-labels">
                    <span>1</span>
                    <span>10</span>
                    <span>20</span>
                    <span>30</span>
                    <span>40</span>
                    <span>50</span>
                  </div>
                </div>

                <div className="sort-group">
                  <label className="sort-label">Ordenar Itens por:</label>
                  <div className="sort-options">
                    <label className="sort-option">
                      <input
                        type="radio"
                        value="value"
                        checked={sortBy === 'value'}
                        onChange={(e) => setSortBy(e.target.value)}
                      />
                      <span className="radio-checkmark"></span>
                      Valor (Maior para Menor)
                    </label>
                    <label className="sort-option">
                      <input
                        type="radio"
                        value="alphabetical"
                        checked={sortBy === 'alphabetical'}
                        onChange={(e) => setSortBy(e.target.value)}
                      />
                      <span className="radio-checkmark"></span>
                      Ordem Alfabética
                    </label>
                  </div>
                </div>
              </div>

              <div className="range-preview">
                <h4>Prévia da Configuração:</h4>
                <p>O gráfico mostrará os <strong>{maxItems} primeiros itens</strong> ordenados por <strong>
                  {sortBy === 'value' ? 'valor (maiores valores primeiro)' : 'ordem alfabética'}
                </strong>.</p>
                <p className="preview-note">
                  <strong>Nota:</strong> A ordenação por valor usa a primeira métrica selecionada ({localSelectedValueColumns.length > 0 ? formatColumnName(localSelectedValueColumns[0]) : 'Nenhuma métrica'}).
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="footer-summary">
            {activeTab === 'categories' && (
              <span>
                {localSelectedCategories.length === 0 
                  ? 'Nenhum campo categórico selecionado' 
                  : `${localSelectedCategories.length} campos para agrupamento`
                }
              </span>
            )}
            {activeTab === 'metrics' && (
              <span>{localSelectedValueColumns.length} métricas selecionadas</span>
            )}
            {activeTab === 'range' && (
              <span>Mostrar {maxItems} itens • Ordenar por {sortBy === 'value' ? 'valor' : 'A-Z'}</span>
            )}
          </div>
          
          <div className="footer-actions">
            <button onClick={handleCancel} className="btn btn-cancel">
              Cancelar
            </button>
            <button 
              onClick={handleApply} 
              className="btn btn-apply"
              disabled={localSelectedCategories.length === 0 || localSelectedValueColumns.length === 0}
            >
              <FaCheck size={16} />
              Aplicar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalChart;
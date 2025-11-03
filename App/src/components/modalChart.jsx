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

  // Resetar estados quando os dados mudam (nova consulta)
  useEffect(() => {
    if (columns && columns.length > 0) {
      setLocalSelectedCategories([]);
      setLocalSelectedValueColumns([]);
      onCategoriesChange([]);
      onValueColumnsChange([]);
    }
  }, [columns, rows]);

  // Inicializar estados locais quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedCategories([...selectedCategories]);
      
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

  // Extrai prefixo da tabela do nome da coluna
  const extractTablePrefix = (columnName) => {
    const parts = columnName.split('_');
    for (let i = 0; i < parts.length; i++) {
      const potentialTableName = parts.slice(0, i + 1).join('_');
      if (translations.tables[potentialTableName]) {
        return potentialTableName;
      }
    }
    return '';
  };

  // Formatação fallback do nome da coluna
  const formatColumnNameFallback = (columnName) => {
    const words = columnName.split('_');
    const capitalizedWords = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    return capitalizedWords.join(' ');
  };

  // Formata nome da coluna com traduções
  const formatColumnName = (columnName) => {
    if (!columnName) return '';
    
    // Busca tradução exata no dicionário
    const exactTranslation = translations.columns[columnName];
    if (exactTranslation) {
      return exactTranslation;
    }
    
    // Processa colunas com prefixos de agregação
    const aggregationPrefixes = ['sum_', 'avg_', 'count_', 'max_', 'min_'];
    for (const prefix of aggregationPrefixes) {
      if (columnName.startsWith(prefix)) {
        const baseColumn = columnName.replace(prefix, '');
        const baseTranslation = translations.columns[baseColumn];
        
        if (baseTranslation) {
          const prefixTranslations = {
            'sum_': `Soma de `,
            'avg_': `Média de `,
            'count_': `Contagem de `,
            'max_': `Máximo de `,
            'min_': `Mínimo de `
          };
          return prefixTranslations[prefix];
        }
        
        // Tenta traduzir a tabela se não encontrou tradução para coluna base
        const tableName = extractAndTranslateTableName(baseColumn);
        if (tableName) {
          const columnWithoutTable = baseColumn.replace(new RegExp(`^${extractTablePrefix(baseColumn)}_?`), '');
          const columnTranslation = translations.columns[columnWithoutTable] || formatColumnNameFallback(columnWithoutTable);
          
          const prefixTranslations = {
            'sum_': `Soma de ${columnTranslation}`,
            'avg_': `Média de ${columnTranslation}`,
            'count_': `Contagem de ${tableName}`,
            'max_': `Máximo de ${columnTranslation}`,
            'min_': `Mínimo de  ${columnTranslation}`
          };
          return prefixTranslations[prefix];
        }
      }
    }
    
    // Tenta traduzir nome da tabela + coluna
    const tableName = extractAndTranslateTableName(columnName);
    if (tableName) {
      const columnWithoutTable = columnName.replace(new RegExp(`^${extractTablePrefix(columnName)}_?`), '');
      const columnTranslation = translations.columns[columnWithoutTable] || formatColumnNameFallback(columnWithoutTable);
      return `${tableName} - ${columnTranslation}`;
    }
    
    // Fallback: formatação básica
    return formatColumnNameFallback(columnName);
  };

  // Determina a tabela de origem com tradução
  const getFieldTable = (fieldName) => {
    const tableName = extractAndTranslateTableName(fieldName);
    return tableName || 'Consulta';
  };

  // Detecta colunas numéricas baseada nos dados reais
  const isNumericColumn = (columnName) => {
    // Verifica dados reais primeiro
    if (rows && rows.length > 0) {
      const sampleValue = rows[0][columnName];
      if (sampleValue !== undefined && sampleValue !== null) {
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

    const hasNumericPattern = numericPatterns.some(pattern => pattern.test(columnName));
    const hasCategoricalPattern = categoricalPatterns.some(pattern => pattern.test(columnName));
    
    return hasNumericPattern && !hasCategoricalPattern;
  };

  // Detecta colunas categóricas baseada nos dados reais
  const isCategoricalColumn = (columnName) => {
    // Verifica dados reais primeiro
    if (rows && rows.length > 0) {
      const sampleValue = rows[0][columnName];
      if (sampleValue !== undefined && sampleValue !== null) {
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

    const hasCategoricalPattern = categoricalPatterns.some(pattern => pattern.test(columnName));
    const hasNumericPattern = numericPatterns.some(pattern => pattern.test(columnName));
    
    return hasCategoricalPattern && !hasNumericPattern;
  };

  // Detecta colunas baseado nos resultados reais da query
  const detectedColumns = useMemo(() => {
    if (!columns || columns.length === 0) {
      return [];
    }
    
    return columns.map(col => {
      const columnName = col.column || col.dataKey || col;
      const isNumeric = isNumericColumn(columnName);
      const isCategorical = isCategoricalColumn(columnName);
      
      return {
        dataKey: columnName,
        name: formatColumnName(columnName),
        type: isNumeric ? 'number' : 'string',
        isNumeric,
        isCategorical
      };
    });
  }, [columns, rows]);

  // Extrai colunas numéricas
  const numericColumns = useMemo(() => {
    return detectedColumns.filter(col => col.isNumeric);
  }, [detectedColumns]);

  // Extrai colunas categóricas
  const categoricalColumns = useMemo(() => {
    return detectedColumns.filter(col => col.isCategorical);
  }, [detectedColumns]);

  // Filtra categorias baseado no termo de busca
  const filteredCategories = useMemo(() => {
    return categoricalColumns.filter(col =>
      col.dataKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatColumnName(col.dataKey).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categoricalColumns, searchTerm]);

  // Alterna seleção de categoria
  const handleCategoryToggle = (category) => {
    setLocalSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(item => item !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Alterna seleção de coluna de valor
  const handleValueColumnToggle = (column) => {
    setLocalSelectedValueColumns(prev => {
      if (prev.includes(column)) {
        return prev.filter(item => item !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  // Seleciona todas as categorias
  const handleSelectAllCategories = () => {
    setLocalSelectedCategories(categoricalColumns.map(col => col.dataKey));
  };

  // Limpa todas as categorias
  const handleClearAllCategories = () => {
    setLocalSelectedCategories([]);
  };

  // Seleciona todas as colunas de valor
  const handleSelectAllValueColumns = () => {
    setLocalSelectedValueColumns(numericColumns.map(col => col.dataKey));
  };

  // Limpa todas as colunas de valor
  const handleClearAllValueColumns = () => {
    setLocalSelectedValueColumns([]);
  };

  // Gera dados do gráfico usando dados reais com limites e ordenação
  const generateChartData = () => {
    if (localSelectedCategories.length === 0 || localSelectedValueColumns.length === 0 || !rows || rows.length === 0) {
      return [];
    }

    // Agrupamento de dados reais
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
    
    // Aplicar ordenação baseada na configuração
    if (sortBy === 'value') {
      const primaryMetric = localSelectedValueColumns[0];
      result.sort((a, b) => (b[primaryMetric] || 0) - (a[primaryMetric] || 0));
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.label.localeCompare(b.label));
    }

    // Aplicar limite de itens
    if (maxItems > 0 && result.length > maxItems) {
      result = result.slice(0, maxItems);
    }

    return result;
  };

  // Aplica configurações do gráfico
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

  // Cancela e fecha modal
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
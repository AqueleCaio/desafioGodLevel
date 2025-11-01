import { useEffect, useRef, useState, useMemo } from 'react';
import { Chart } from 'chart.js/auto';
import '../styles/Chart.css';
import { useQuery } from '../context/queryContext';
import ModalChart from './modalChart';
import { FaChartBar, FaChartLine, FaChartPie, FaDotCircle, FaSlidersH } from 'react-icons/fa';
import { translations, extractAndTranslateTableName } from '../services/frontController';

const ChartComponent = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const { result } = useQuery();
  const { rows = [], columns = [] } = result || {};

  const [chartType, setChartType] = useState('bar');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedValueColumns, setSelectedValueColumns] = useState([]);
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

  // Detectar colunas categóricas automaticamente
  const categoricalColumns = useMemo(() => {
    if (!Array.isArray(columns)) return [];
    
    return columns.filter(col => {
      const colDataKey = col.dataKey || col.column || '';
      const isCategorical = col.type === 'string' || 
                           !colDataKey.toLowerCase().includes('valor') &&
                           !colDataKey.toLowerCase().includes('total') &&
                           !colDataKey.toLowerCase().includes('amount') &&
                           !colDataKey.toLowerCase().includes('sum') &&
                           !colDataKey.toLowerCase().includes('max') &&
                           !colDataKey.toLowerCase().includes('min') &&
                           !colDataKey.toLowerCase().includes('avg') &&
                           !colDataKey.toLowerCase().includes('count') &&
                           !colDataKey.toLowerCase().includes('id') &&
                           !colDataKey.toLowerCase().includes('ano') &&
                           !colDataKey.toLowerCase().includes('year');
      return isCategorical;
    });
  }, [columns]);

  // Detectar colunas de valor automaticamente
  const valueColumns = useMemo(() => {
    if (!Array.isArray(columns)) return [];
    
    return columns.filter(col => {
      const colDataKey = col.dataKey || col.column || '';
      const isNumeric = col.type === 'number' || 
                       colDataKey.toLowerCase().includes('valor') ||
                       colDataKey.toLowerCase().includes('total') ||
                       colDataKey.toLowerCase().includes('amount') ||
                       colDataKey.toLowerCase().includes('value') ||
                       colDataKey.toLowerCase().includes('price') ||
                       colDataKey.toLowerCase().includes('fee') ||
                       colDataKey.toLowerCase().includes('discount') ||
                       colDataKey.toLowerCase().includes('increase') ||
                       colDataKey.toLowerCase().includes('quantity') ||
                       colDataKey.toLowerCase().includes('seconds') ||
                       colDataKey.toLowerCase().includes('sum') ||
                       colDataKey.toLowerCase().includes('max') ||
                       colDataKey.toLowerCase().includes('min') ||
                       colDataKey.toLowerCase().includes('avg') ||
                       colDataKey.toLowerCase().includes('count');
      return isNumeric && !colDataKey.toLowerCase().includes('ano');
    }).map(col => col.dataKey || col.column);
  }, [columns]);

  // Selecionar automaticamente a primeira coluna de valor e primeiras categorias
  useEffect(() => {
    if (Array.isArray(valueColumns) && valueColumns.length > 0 && selectedValueColumns.length === 0) {
      setSelectedValueColumns([valueColumns[0]]);
    }
  }, [valueColumns, selectedValueColumns.length]);

  useEffect(() => {
    if (Array.isArray(categoricalColumns) && categoricalColumns.length > 0 && selectedCategories.length === 0) {
      // Selecionar os primeiros campos categóricos (não os valores)
      const firstCategories = categoricalColumns.slice(0, 2).map(col => col.dataKey || col.column);
      setSelectedCategories(firstCategories);
    }
  }, [categoricalColumns, selectedCategories.length]);

  // 🔥 CORREÇÃO: Função para manipular o fechamento do modal
  const handleModalClose = (result) => {
    if (result) {
      setSelectedCategories(result.categories || []);
      setSelectedValueColumns(result.valueColumns || []);
      
      // 🔥 APLICAR OS LIMITES E ORDENAÇÃO
      setMaxItems(result.maxItems || 10);
      setSortBy(result.sortBy || 'value');
      
      console.log('🔍 [CHART] Configurações aplicadas:', {
        maxItems: result.maxItems,
        sortBy: result.sortBy,
        categories: result.categories,
        valueColumns: result.valueColumns
      });
    }
    setModalOpen(false);
  };

  // 🔥 CORREÇÃO: Prepara dados para o gráfico COM LIMITES E ORDENAÇÃO
  const chartData = useMemo(() => {
    // 🔥 CORREÇÃO: Verificação mais segura para rows
    if (!Array.isArray(rows) || rows.length === 0 || 
        !Array.isArray(selectedCategories) || selectedCategories.length === 0 || 
        !Array.isArray(selectedValueColumns) || selectedValueColumns.length === 0) {
      return null;
    }

    console.log('🔍 [CHART] Gerando dados com:', {
      maxItems,
      sortBy,
      categories: selectedCategories,
      metrics: selectedValueColumns,
      totalRows: rows.length
    });

    // Agrupa dados pelas categorias selecionadas
    const grouped = {};
    
    rows.forEach(row => {
      // Cria uma chave única baseada nas categorias selecionadas
      const groupKey = selectedCategories.map(cat => row[cat] || 'N/A').join(' - ');
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {};
        // Inicializa todas as métricas para este grupo
        selectedValueColumns.forEach(valueCol => {
          grouped[groupKey][valueCol] = 0;
        });
      }
      
      // Soma cada valor selecionado
      selectedValueColumns.forEach(valueCol => {
        const value = parseFloat(row[valueCol]) || 0;
        grouped[groupKey][valueCol] += value;
      });
    });

    // Converter para array e aplicar ordenação
    let groupedArray = Object.entries(grouped).map(([label, values]) => ({
      label,
      ...values
    }));

    // 🔥 APLICAR ORDENAÇÃO
    if (sortBy === 'value') {
      // Ordenar por valor (soma da primeira métrica selecionada)
      const primaryMetric = selectedValueColumns[0];
      groupedArray.sort((a, b) => (b[primaryMetric] || 0) - (a[primaryMetric] || 0));
      console.log('🔍 [CHART] Ordenado por valor usando métrica:', primaryMetric);
    } else if (sortBy === 'alphabetical') {
      // Ordenar alfabeticamente pelo label
      groupedArray.sort((a, b) => a.label.localeCompare(b.label));
      console.log('🔍 [CHART] Ordenado alfabeticamente');
    }

    // 🔥 APLICAR LIMITE DE ITENS
    if (maxItems > 0 && groupedArray.length > maxItems) {
      console.log('🔍 [CHART] Aplicando limite de', maxItems, 'itens. Total antes:', groupedArray.length);
      groupedArray = groupedArray.slice(0, maxItems);
      console.log('🔍 [CHART] Total depois do limite:', groupedArray.length);
    }

    const labels = groupedArray.map(item => item.label);

    // Para gráficos de barra/linha, usamos as métricas como datasets
    if (chartType === 'bar' || chartType === 'line') {
      const datasets = [];
      
      const colors = [
        '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1',
        '#d084d0', '#ff8042', '#00bcd4', '#4caf50', '#e91e63'
      ];

      selectedValueColumns.forEach((valueCol, valueIndex) => {
        const data = groupedArray.map(item => item[valueCol]);
        
        datasets.push({
          label: formatColumnName(valueCol), // 🔥 ATUALIZADO: Usa função de formatação traduzida
          data: data,
          borderColor: colors[valueIndex % colors.length],
          backgroundColor: chartType === 'line' 
            ? 'transparent' 
            : `${colors[valueIndex % colors.length]}80`,
          borderWidth: 2,
          fill: chartType === 'line'
        });
      });

      return { labels, datasets };
    }
    
    // Para gráficos de pizza/doughnut, usamos a primeira métrica
    else if (chartType === 'pie' || chartType === 'doughnut') {
      const primaryMetric = selectedValueColumns[0];
      const data = groupedArray.map(item => item[primaryMetric]);
      
      const backgroundColors = [
        '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1',
        '#d084d0', '#ff8042', '#00bcd4', '#4caf50', '#e91e63'
      ];

      return {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderWidth: 1
        }]
      };
    }

    return null;
  }, [
    rows, 
    selectedCategories, 
    chartType, 
    selectedValueColumns,
    maxItems,
    sortBy
  ]);

  // Função para manipular mudanças nas categorias
  const handleCategoriesChange = (newCategories) => {
    setSelectedCategories(newCategories || []);
  };

  // Função para manipular mudanças nas colunas de valor
  const handleValueColumnsChange = (newValueColumns) => {
    setSelectedValueColumns(newValueColumns || []);
  };

  // 🔥 FUNÇÃO ATUALIZADA: Gerar título do gráfico com nomes traduzidos
  const generateChartTitle = () => {
    if (!Array.isArray(selectedCategories) || selectedCategories.length === 0) return 'Visualização de Dados';
    
    const translatedCategories = selectedCategories.map(formatColumnName);
    
    if (chartType === 'pie' || chartType === 'doughnut') {
      const primaryMetric = selectedValueColumns[0];
      return `${formatColumnName(primaryMetric)} por ${translatedCategories.join(', ')}`;
    } else {
      return `Visualização por ${translatedCategories.join(', ')}`;
    }
  };

  // 🔥 FUNÇÃO ATUALIZADA: Gerar label do eixo X com nomes traduzidos
  const generateXAxisLabel = () => {
    if (!Array.isArray(selectedCategories) || selectedCategories.length === 0) return 'Eixo X';
    return selectedCategories.map(formatColumnName).join(', ');
  };

  // 🔥 FUNÇÃO ATUALIZADA: Gerar label do eixo Y com nomes traduzidos
  const generateYAxisLabel = () => {
    if (!Array.isArray(selectedValueColumns) || selectedValueColumns.length === 0) return 'Valor';
    
    if (selectedValueColumns.length === 1) {
      return formatColumnName(selectedValueColumns[0]);
    } else {
      return 'Métricas';
    }
  };

  // Parte que renderiza o gráfico
  useEffect(() => {
    if (!chartData || !chartRef.current) return;

    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext('2d');
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'top',
          labels: {
            boxWidth: 12,
            font: {
              size: 11
            }
          }
        },
        title: {
          display: true,
          text: generateChartTitle() // 🔥 ATUALIZADO: Usa função com nomes traduzidos
        }
      }
    };

    // Configurações específicas para cada tipo de gráfico
    if (chartType === 'bar' || chartType === 'line') {
      options.scales = {
        x: {
          title: {
            display: true,
            text: generateXAxisLabel() // 🔥 ATUALIZADO: Usa função com nomes traduzidos
          }
        },
        y: {
          title: {
            display: true,
            text: generateYAxisLabel() // 🔥 ATUALIZADO: Usa função com nomes traduzidos
          },
          beginAtZero: true
        }
      };
    }

    chartInstance.current = new Chart(ctx, {
      type: chartType,
      data: chartData,
      options: options
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [chartData, chartType, selectedValueColumns, selectedCategories]);

  return (
    <div className="chart-wrapper">
      <div className="chart-controls">
        <div className="chart-type-selector">
          <label>Tipo de Gráfico:</label>
          <div className="chart-type-buttons">
            <button className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`} onClick={() => setChartType('bar')}>
              <FaChartBar size={18} />
            </button>
            <button className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`} onClick={() => setChartType('line')}>
              <FaChartLine size={18} />
            </button>
            <button className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`} onClick={() => setChartType('pie')}>
              <FaChartPie size={18} />
            </button>
            <button className={`chart-type-btn ${chartType === 'doughnut' ? 'active' : ''}`} onClick={() => setChartType('doughnut')}>
              <FaDotCircle size={18} />
            </button>
          </div>
        </div>

        <div className="chart-info">
          <span className="info-item">
            <strong>Agrupando por:</strong> {Array.isArray(selectedCategories) ? selectedCategories.map(formatColumnName).join(', ') : 'Nenhum'}
          </span>
          <span className="info-item">
            <strong>Métricas:</strong> {Array.isArray(selectedValueColumns) ? selectedValueColumns.map(formatColumnName).join(', ') : 'Nenhuma'}
          </span>
          <span className="info-item">
            <strong>Limite:</strong> {maxItems} itens • <strong>Ordenação:</strong> {sortBy === 'value' ? 'Valor' : 'A-Z'}
          </span>
        </div>

        <button className="config-btn" onClick={() => setModalOpen(true)}>
          <FaSlidersH size={16} /> Configurar gráfico
        </button>
      </div>

      <div className="chart-canvas-container">
        {chartData ? (
          <canvas ref={chartRef}></canvas>
        ) : (
          <div className="no-data-message">
            <p>Selecione categorias e métricas para visualizar o gráfico</p>
          </div>
        )}
      </div>

      {/* Modal de Configurações */}
      <ModalChart
        isOpen={modalOpen}
        onClose={handleModalClose}
        selectedCategories={selectedCategories}
        onCategoriesChange={handleCategoriesChange}
        columns={columns}
        selectedValueColumns={selectedValueColumns}
        onValueColumnsChange={handleValueColumnsChange}
        rows={rows}
      />
    </div>
  );
};

export default ChartComponent;
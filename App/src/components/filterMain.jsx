import React, { useState, useEffect } from 'react';
import '../styles/Filters.css';
import question from '../../public/assets/tooltip.png';
import { getTableNames, 
         getTableAttributes, 
         getAllRelatedTables, 
         handleReportGeneration } from '../services/frontController';
import { useQuery } from '../context/queryContext';

import Tables from './filter/tables';
import TypeJoin from './filter/typeJoin';
import Columns from './filter/columns';
import Agregation from './filter/agreggation';
import FiltersSection from './filter/filters';
import OrderBy from './filter/orderBy';

import { FaBars, FaTimes } from 'react-icons/fa';

function FilterMain() {
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedTables, setSelectedTables] = useState([]);
  const [tables, setTables] = useState([]);
  const [having, setHaving] = useState([]);
  const [relations, setRelations] = useState({});
  const [availableTables, setAvailableTables] = useState([]);
  const [columns, setColumns] = useState([]);
  const [joinType, setJoinType] = useState('INNER JOIN');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedAgg, setSelectedAgg] = useState([{ func: null, column: null }]);
  const [filters, setFilters] = useState([]);
  const [orderBy, setOrderBy] = useState([{ column: null, direction: 'ASC' }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingDots, setLoadingDots] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [tableError, setTableError] = useState(false); // Estado para controle de erro

  // Animação dos pontos de carregamento
  useEffect(() => {
    let interval;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev === '...') return '';
          return prev + '.';
        });
      }, 500);
    } else {
      setLoadingDots('');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  // Alterna menu de filtros
  const toggleFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  // Fecha filtros ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isFiltersOpen && !event.target.closest('.filters') && !event.target.closest('.menu-toggle')) {
        setIsFiltersOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFiltersOpen]);

  // Carrega nomes das tabelas
  useEffect(() => {
    async function fetchTables() {
      const data = await getTableNames();
      const formatted = data.map(t => ({ name: t.table_name, label: t.table_name }));
      setTables(formatted);
      setAvailableTables(formatted);
    }
    fetchTables();
  }, []);

  // Carrega relações entre tabelas
  useEffect(() => {
    const loadData = async () => {
      const rels = await getAllRelatedTables();
      setRelations(rels);
    };
    loadData();
  }, []);

  // Carrega atributos das tabelas selecionadas
  useEffect(() => {
    async function fetchColumns() {
      const allColumns = [];
      for (const table of selectedTables) {
        const cols = await getTableAttributes(table);
        cols.forEach(col => {
          allColumns.push({
            id: `${table}.${col.column_name}`,
            name: `${table}.${col.column_name}`
          });
        });
      }
      setColumns(allColumns);
    }

    if (selectedTables.length > 0) {
      fetchColumns();
    } else {
      setColumns([]);
    }
  }, [selectedTables]);

  // Atualiza tabelas disponíveis quando selectedTables muda
  useEffect(() => {
    updateAvailableTables(null, selectedTables);
  }, [selectedTables, tables]);

  // Remove erro quando tabela é selecionada
  useEffect(() => {
    if (selectedTables.length > 0 && tableError) {
      setTableError(false);
    }
  }, [selectedTables, tableError]);

  // Filtra colunas apropriadas para agregação
  const aggregatableColumns = columns.filter(col => {
    const lower = col.name.toLowerCase();
    const type = col.type?.toLowerCase?.() || '';

    const invalid = /(name|description|uuid|reason|street|city|state|country|email|cpf|phone|gender|origin|code|type|created_at|deleted_at|updated_at)/i.test(lower);
    const validNumericType = /(int|float|decimal|double)/i.test(type);
    const validNumericName = /(valor|value|amount|price|fee|quantity|total|seconds|population|renda|indice|taxa|id)/i.test(lower);

    return !invalid && (validNumericType || validNumericName);
  });

  // Remove tabela da seleção
  const removeTable = (tableName) => {
    const updatedTables = selectedTables.filter(t => t !== tableName);
    setSelectedTables(updatedTables);

    const updatedColumns = selectedColumns.filter(col => !col.startsWith(`${tableName}.`));
    setSelectedColumns(updatedColumns);

    updateAvailableTables(updatedTables[updatedTables.length - 1], updatedTables);
  };

  // Atualiza tabelas disponíveis com base nas selecionadas
  const updateAvailableTables = (tableName, currentSelectedTables = selectedTables) => {
    if (!relations || !tables) return;

    const allRelated = new Set();
    currentSelectedTables.forEach(selTable => {
      const related = relations[selTable] || [];
      related.forEach(r => allRelated.add(r));
    });

    const available = tables.filter(t => 
      allRelated.has(t.name) && !currentSelectedTables.includes(t.name)
    );

    if (currentSelectedTables.length === 0) {
      setAvailableTables(tables);
    } else {
      setAvailableTables(available);
    }
  };

  // Alterna seleção de colunas
  const toggleColumn = (columnId) => {
    if (selectedColumns.includes(columnId)) {
      setSelectedColumns(selectedColumns.filter(c => c !== columnId));
    } else {
      setSelectedColumns([...selectedColumns, columnId]);
    }
  };

  // Opções disponíveis para ordenação
  const orderableOptions = [
    ...(selectedColumns || []).map(col => ({
      id: typeof col === 'string' ? col : col.column || col.id,
      label: typeof col === 'string' ? col : col.name || col.column || col.id
    })),
    ...(selectedAgg || [])
      .filter(a => a.func && a.column)
      .map(a => ({
        id: `${a.func}(${a.column})`,
        label: `${a.func}(${a.column})`
      }))
  ];

  const { setQuery, setResult } = useQuery();

  // Gera relatório com os filtros configurados
  const handleGenerateReport = async () => {
    // Valida se há tabelas selecionadas
    if (selectedTables.length === 0) {
      setTableError(true);
      // Rola a tela até a seção de tabelas
      const tablesSection = document.querySelector('.section');
      if (tablesSection) {
        tablesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsGenerating(true);
    
    try {
      const validFilters = filters.filter(filter => 
        filter && filter.column && filter.value
      );
      
      const validOrderBy = orderBy.filter(ob => 
        ob && ob.column
      );

      const validAggregation = selectedAgg.filter(agg => 
        agg && agg.func && agg.column
      );

      const payload = {
        tables: selectedTables.map(name => ({ name })),
        joinType,
        columns: selectedColumns.map(col => ({ column: col })),
        aggregation: validAggregation || [], 
        having: having || [],
        filters: validFilters,
        ...(validOrderBy.length > 0 ? { orderBy: validOrderBy } : {})
      };

      const result = await handleReportGeneration(payload);

      setQuery(result.query);
      setResult({
        rows: result.report?.result || [],
        columns: result.report?.result?.length
          ? Object.keys(result.report.result[0]).map(key => ({ dataKey: key, label: key, width: 120 }))
          : []
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Botão hamburger para mobile */}
      <button 
        className={`menu-toggle ${isFiltersOpen ? 'active' : ''}`}
        onClick={toggleFilters}
        aria-label="Abrir menu de filtros"
      >
        {isFiltersOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Painel de filtros */}
      <div className={`filters ${isFiltersOpen ? 'filters-open' : ''}`}>
        <div className="filters-header">
          <h2 className="filters-title">Configurar Relatório</h2>
          <button 
            className="filters-close"
            onClick={() => setIsFiltersOpen(false)}
            aria-label="Fechar menu"
          >
            <FaTimes size={16} />
          </button>
        </div>

        <Tables
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          selectedTables={selectedTables}
          setSelectedTables={setSelectedTables}
          availableTables={availableTables}
          removeTable={removeTable}
          updateAvailableTables={updateAvailableTables}
          hasError={tableError}
        />

        <TypeJoin 
          joinType={joinType} 
          setJoinType={setJoinType} 
          question={question} 
        />

        <Columns
          columns={columns}
          selectedColumns={selectedColumns}
          toggleColumn={toggleColumn}
        />

        <Agregation 
          columns={aggregatableColumns} 
          selectedAgg={selectedAgg} 
          setSelectedAgg={setSelectedAgg}
          setSelectedHaving={setHaving} 
          question={question} 
        />

        <FiltersSection 
          columns={columns} 
          setFilters={setFilters} 
        />

        <OrderBy 
          columns={orderableOptions} 
          orderBy={orderBy} 
          setOrderBy={setOrderBy} 
        />

        <button 
          className={`generate-report-button ${isGenerating ? 'generating' : ''}`}
          onClick={handleGenerateReport}
          disabled={isGenerating}
        >
          <span>{isGenerating ? '⏳' : '📊'}</span>
          {isGenerating ? `Gerando${loadingDots}` : 'Gerar Relatório'}
        </button>
      </div>

      {/* Overlay para mobile */}
      {isFiltersOpen && <div className="filters-overlay"></div>}
    </>
  );
}

export default FilterMain;
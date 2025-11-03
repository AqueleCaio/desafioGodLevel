import React, { useState, useEffect } from 'react';
import { 
  extractTableFromColumn, 
  translateColumnName,
  translateTableName 
} from '../../services/frontController';

function Filters({ columns = [], filters = [], setFilters }) {
  // Estado interno para gerenciar os filtros
  const [localFilters, setLocalFilters] = useState([
    { column: '', operator: '=', value: '', logic: 'AND' }
  ]);

  // Sincroniza com as props quando mudam
  useEffect(() => {
    if (Array.isArray(filters) && filters.length > 0) {
      setLocalFilters(filters);
    }
  }, [filters]);

  // Atualiza o componente pai quando os filtros mudam
  useEffect(() => {
    const validFilters = localFilters.filter(f => f.column && f.value !== '');
    setFilters(validFilters);
  }, [localFilters, setFilters]);

  // Agrupa colunas por tabela
  const groupedColumns = React.useMemo(() => {
    const groups = {};
    
    if (!Array.isArray(columns)) return groups;
    
    columns.forEach(column => {
      if (!column || !column.id) return;
      
      const tableName = extractTableFromColumn(column.id);
      
      if (!groups[tableName]) {
        groups[tableName] = [];
      }
      
      groups[tableName].push({
        id: column.id,
        name: translateColumnName(column.id),
        originalName: column.id,
        tableName: tableName
      });
    });
    
    return groups;
  }, [columns]);

  // Reseta automaticamente quando colunas mudam
  React.useEffect(() => {
    if (!Array.isArray(columns) || columns.length === 0) {
      setLocalFilters([{ column: '', operator: '=', value: '', logic: 'AND' }]);
      return;
    }
    
    // Remove filtros que referenciam colunas que não existem mais
    const validFilters = localFilters.filter(filter => {
      if (!filter || !filter.column) return true;
      return columns.some(col => col && col.id === filter.column);
    });
    
    if (validFilters.length !== localFilters.length) {
      setLocalFilters(validFilters.length > 0 ? validFilters : [{ column: '', operator: '=', value: '', logic: 'AND' }]);
    }
  }, [columns]);

  // Formata o valor do filtro (especial para LIKE)
  const formatFilterValue = (operator, value) => {
    if (operator === 'LIKE') {
      if (value.startsWith('%') && value.endsWith('%')) {
        return `contém "${value.slice(1, -1)}"`;
      } else if (value.startsWith('%')) {
        return `termina com "${value.slice(1)}"`;
      } else if (value.endsWith('%')) {
        return `começa com "${value.slice(0, -1)}"`;
      } else {
        return `contém "${value}"`;
      }
    }
    return value;
  };

  // Formata o operador de forma amigável
  const formatOperator = (operator) => {
    const operatorMap = {
      '=': 'igual a',
      '!=': 'diferente de',
      '>': 'maior que',
      '<': 'menor que',
      '>=': 'maior ou igual a',
      '<=': 'menor ou igual a',
      'LIKE': 'que'
    };
    return operatorMap[operator] || operator;
  };

  // Formata a lógica
  const formatLogic = (logic) => {
    return logic === 'AND' ? 'E' : 'OU';
  };

  // Extrai nome da tabela e atributo
  const getTableAndAttribute = (columnId) => {
    const tableName = extractTableFromColumn(columnId);
    const attributeName = translateColumnName(columnId);
    const translatedTableName = translateTableName(tableName);
    
    return {
      tableName: translatedTableName,
      attributeName: attributeName
    };
  };

  // Atualiza um campo específico do filtro
  const updateFilter = (index, key, value) => {
    const updated = [...localFilters];
    if (updated[index]) {
      updated[index][key] = value;
      setLocalFilters(updated);
    }
  };

  // Adiciona novo filtro
  const addFilter = () => {
    setLocalFilters([
      ...localFilters,
      { column: '', operator: '=', value: '', logic: 'AND' }
    ]);
  };

  // Remove filtro
  const removeFilter = (index) => {
    if (localFilters.length <= 1) return;
    
    const newFilters = localFilters.filter((_, i) => i !== index);
    setLocalFilters(newFilters);
  };

  return (
    <div className="section">
      <h3 className="section-title">Filtros</h3>

      {/* Feedback visual dos filtros ativos */}
      {Array.isArray(localFilters) && localFilters.some(filter => filter?.column && filter?.value) && (
        <div className="filters-preview" style={{ marginBottom: '20px' }}>
          <div className="preview-header">
            <span className="preview-title">Filtros aplicados:</span>
            <span className="preview-count">
              {localFilters.filter(f => f.column && f.value).length}
            </span>
          </div>
          <div className="filters-preview-content">
            {localFilters
              .filter(filter => filter?.column && filter?.value)
              .map((filter, index) => {
                const { tableName, attributeName } = getTableAndAttribute(filter.column);
                
                return (
                  <div key={index} className="filter-preview-item">
                    {index > 0 && (
                      <span className="filter-logic-badge">
                        {formatLogic(filter.logic)}
                      </span>
                    )}
                    <span className="filter-text">
                      <strong>{attributeName}</strong> de <strong>{tableName}</strong> que{' '}
                      {filter.operator === 'LIKE' ? (
                        <span className="like-pattern">
                          {formatFilterValue(filter.operator, filter.value)}
                        </span>
                      ) : (
                        <span>
                          {formatOperator(filter.operator)} <strong>{filter.value}</strong>
                        </span>
                      )}
                    </span>
                  </div>
                );
              })
            }
          </div>
        </div>
      )}

      {localFilters.map((filter, index) => (
        <div key={index} className="filter-column">
          {/* Coluna para filtro */}
          <select
            className="filter-select"
            value={filter?.column || ''}
            onChange={e => updateFilter(index, 'column', e.target.value)}
          >
            <option value="">Selecionar Coluna</option>
            {Object.keys(groupedColumns).length > 0 && 
              Object.entries(groupedColumns).map(([tableName, tableColumns]) => (
                <optgroup key={tableName} label={translateTableName(tableName)}>
                  {tableColumns.map(column => (
                    <option key={column.id} value={column.id}>
                      {column.name}
                    </option>
                  ))}
                </optgroup>
              ))
            }
          </select>

          {/* Operador */}
          <select
            className="filter-select-operator"
            value={filter?.operator || '='}
            onChange={e => updateFilter(index, 'operator', e.target.value)}
          >
            <option value="=">=</option>
            <option value="!=">≠</option>
            <option value=">">{'>'}</option>
            <option value="<">{'<'}</option>
            <option value=">=">{'>='}</option>
            <option value="<=">{'<='}</option>
            <option value="LIKE">LIKE</option>
          </select>

          {/* Valor com dica para LIKE */}
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="filter-input"
              placeholder="Valor"
              value={filter?.value || ''}
              onChange={e => updateFilter(index, 'value', e.target.value)}
            />
            {filter?.operator === 'LIKE' && !filter?.value?.includes('%') && (
              <div className="like-hint">
                💡 Dica: Use % para buscar padrões (ex: A% para começa com A,
                 %Z para termina com Z, 
                 b para contém b)
              </div>
            )}
          </div>

          {/* Lógica (AND/OR) - apenas para filtros adicionais */}
          {index > 0 && (
            <select
              className="filter-select-logic"
              value={filter?.logic || 'AND'}
              onChange={e => updateFilter(index, 'logic', e.target.value)}
            >
              <option value="AND">E</option>
              <option value="OR">OU</option>
            </select>
          )}

          {/* Botão remover */}
          {localFilters.length > 1 && (
            <button
              className="filter-remove"
              onClick={() => removeFilter(index)}
            >
              X
            </button>
          )}
        </div>
      ))}

      {/* Botão adicionar filtro */}
      <button className="filter-add" onClick={addFilter}>
        Adicionar Filtro
      </button>

      {Object.keys(groupedColumns).length === 0 && (
        <div className="no-columns-message">
          <p>Nenhuma coluna disponível para filtros</p>
        </div>
      )}
    </div>
  );
}

export default Filters;
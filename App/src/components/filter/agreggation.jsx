import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  extractTableFromColumn, 
  translateColumnName,
  translateTableName 
} from '../../services/frontController';

function Agregation({ columns = [], selectedAgg = [], setSelectedAgg, setSelectedHaving, question }) {
  const [aggregations, setAggregations] = useState([{ func: '', column: '' }]);
  const [havingClauses, setHavingClauses] = useState([]);
  
  // Refs para comparar mudanças
  const prevHavingRef = useRef([]);

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
        originalName: column.id
      });
    });
    
    return groups;
  }, [columns]);

  // Agregações traduzidas para o dropdown de HAVING
  const translatedAggregations = React.useMemo(() => {
    return aggregations
      .filter(a => a.func && a.column)
      .map(a => {
        const columnName = translateColumnName(a.column);
        return {
          original: `${a.func}(${a.column})`,
          translated: `${a.func}(${columnName})`
        };
      });
  }, [aggregations]);

  // Reseta automaticamente quando colunas mudam
  useEffect(() => {
    if (!Array.isArray(columns)) return;
    
    // Se não há colunas disponíveis, reseta as agregações
    if (columns.length === 0) {
      setAggregations([{ func: '', column: '' }]);
      setHavingClauses([]);
      return;
    }
    
    // Remove agregações que referenciam colunas não disponíveis
    const validAggregations = aggregations.filter(agg => {
      if (!agg.column) return true;
      return columns.some(col => col && col.id === agg.column);
    });
    
    // Se todas as agregações ficaram inválidas, reseta para vazio
    if (validAggregations.length === 0 && aggregations.length > 0) {
      setAggregations([{ func: '', column: '' }]);
    } else if (validAggregations.length !== aggregations.length) {
      setAggregations(validAggregations);
    }
  }, [columns]);

  // Atualiza agregações no componente pai apenas quando necessário
  useEffect(() => {
    if (!setSelectedAgg) return;
    
    const validAgg = aggregations.filter(a => a.func && a.column);
    
    // Evita atualização desnecessária comparando com o estado anterior
    const hasChanged = JSON.stringify(validAgg) !== JSON.stringify(selectedAgg);
    
    if (hasChanged) {
      setSelectedAgg(validAgg);
    }
  }, [aggregations, selectedAgg, setSelectedAgg]);

  // Atualiza having no componente pai apenas quando realmente mudar
  useEffect(() => {
    if (!setSelectedHaving) return;
    
    const hasChanged = JSON.stringify(havingClauses) !== JSON.stringify(prevHavingRef.current);
    
    if (hasChanged) {
      setSelectedHaving(havingClauses);
      prevHavingRef.current = havingClauses;
    }
  }, [havingClauses, setSelectedHaving]);

  // Atualiza uma agregação específica
  const updateAggregation = useCallback((index, key, value) => {
    setAggregations(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index][key] = value;
      }
      return updated;
    });
  }, []);

  // Adiciona nova agregação
  const addAggregation = useCallback(() => {
    setAggregations(prev => [...prev, { func: '', column: '' }]);
  }, []);

  // Remove agregação
  const removeAggregation = useCallback((index) => {
    setAggregations(prev => {
      if (prev.length <= 1) {
        return [{ func: '', column: '' }];
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Adiciona cláusula HAVING
  const addHavingClause = useCallback(() => {
    setHavingClauses(prev => [...prev, { aggregation: '', operator: '=', value: '' }]);
  }, []);

  // Remove cláusula HAVING
  const removeHavingClause = useCallback((index) => {
    setHavingClauses(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Atualiza cláusula HAVING
  const updateHaving = useCallback((index, key, value) => {
    setHavingClauses(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index][key] = value;
      }
      return updated;
    });
  }, []);

  return (
    <div className="section">
      <h3 className="section-title">Funções de Agregação</h3>

      {/* Lista de agregações */}
      {aggregations.map((agg, index) => (
        <div key={index} className="filter-column">
          {/* Função de agregação */}
          <select
            className="filter-select"
            value={agg.func || ''}
            onChange={e => updateAggregation(index, 'func', e.target.value)}
          >
            <option value="">Funções</option>
            <option value="COUNT">COUNT</option>
            <option value="SUM">SUM</option>
            <option value="AVG">AVG</option>
            <option value="MAX">MAX</option>
            <option value="MIN">MIN</option>
          </select>

          {/* Coluna agrupada por tabela */}
          <select
            className="filter-select"
            value={agg.column || ''}
            onChange={e => updateAggregation(index, 'column', e.target.value)}
          >
            <option value="">Selecionar Coluna</option>
            
            {/* Renderiza grupos de colunas por tabela */}
            {Object.entries(groupedColumns).map(([tableName, tableColumns]) => (
              <optgroup 
                key={tableName} 
                label={translateTableName(tableName)}
              >
                {tableColumns.map(column => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Botão de remover */}
          {aggregations.length > 1 && (
            <button
              className="filter-remove"
              onClick={() => removeAggregation(index)}
            >
              X
            </button>
          )}
        </div>
      ))}

      {/* Botões de ação */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
        <button className="filter-add" onClick={addAggregation}>
          Adicionar Agregação
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className="filter-add"
            onClick={addHavingClause}
            disabled={translatedAggregations.length === 0}
          >
            Adicionar HAVING
          </button>
          
          {/* Tooltip para HAVING */}
          <div className="tooltip-container">
            <span className="tooltip-icon">
              <img src={question} alt="?" />
            </span>
            <div className="tooltip-text">
              <strong>HAVING - Filtro em Agregações</strong><br /><br />
              O <strong>HAVING</strong> é usado para filtrar resultados de funções de agregação<br />
              (COUNT, SUM, AVG, MAX, MIN) após o GROUP BY.<br /><br />
              
              <strong>📌 Quando usar:</strong><br />
              • Filtrar totais (ex: SUM(valor) &gt; 1000)<br />
              • Filtrar contagens (ex: COUNT(*) &gt;= 5)<br />
              • Filtrar médias (ex: AVG(nota) &gt; 7)<br /><br />
              
              <strong>💡 Dica:</strong> WHERE filtra antes da agregação,<br />
              HAVING filtra depois da agregação.
            </div>
          </div>
        </div>
      </div>

      {/* Seção HAVING com agregações traduzidas */}
      {havingClauses.length > 0 && (
        <div>
          <div className="table-group-header" style={{ marginTop: '20px', marginBottom: '10px' }}>
            <h4 className="table-group-title" style={{ fontSize: '0.9rem', margin: 0 }}>
              Cláusulas HAVING
            </h4>
            <span className="table-columns-count">
              {havingClauses.length} condiç{havingClauses.length !== 1 ? 'ões' : 'ão'}
            </span>
          </div>

          {havingClauses.map((having, index) => (
            <div key={index} className="filter-column" id="#container_having">
              {/* Seleção da agregação com nomes traduzidos */}
              <select
                className="filter-select"
                value={having.aggregation || ''}
                onChange={e => updateHaving(index, 'aggregation', e.target.value)}
              >
                <option value="">Selecionar Agregação</option>
                {translatedAggregations.map((agg, i) => (
                  <option key={i} value={agg.original}>
                    {agg.translated}
                  </option>
                ))}
              </select>

              {/* Operador */}
              <select
                className="filter-select"
                id="operators"
                value={having.operator || '='}
                onChange={e => updateHaving(index, 'operator', e.target.value)}
              >
                <option value="=">=</option>
                <option value=">">{'>'}</option>
                <option value="<">{'<'}</option>
                <option value=">=">{'>='}</option>
                <option value="<=">{'<='}</option>
                <option value="<>">{'<>'}</option>
              </select>

              {/* Valor */}
              <input
                type="text"
                className="filter-input"
                id="value"
                placeholder="Valor"
                value={having.value || ''}
                onChange={e => updateHaving(index, 'value', e.target.value)}
              />

              <button
                className="filter-remove"
                onClick={() => removeHavingClause(index)}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mensagem quando não há colunas */}
      {Object.keys(groupedColumns).length === 0 && (
        <div className="no-columns-message">
          <p>Nenhuma coluna disponível para agregação</p>
        </div>
      )}
    </div>
  );
}

export default Agregation;
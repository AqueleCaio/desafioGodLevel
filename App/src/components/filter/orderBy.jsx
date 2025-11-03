import React from 'react';
import { 
  extractTableFromColumn, 
  translateColumnName,
  translateTableName 
} from '../../services/frontController';

function OrderBy({ columns = [], orderBy = [], setOrderBy }) {
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

  // Reseta automaticamente quando colunas mudam
  React.useEffect(() => {
    if (!Array.isArray(orderBy) || !Array.isArray(columns)) return;
    
    // Verifica se precisa resetar
    const shouldReset = columns.length === 0 && 
                      orderBy.length > 0 && 
                      !(orderBy.length === 1 && !orderBy[0]?.column);
    
    if (shouldReset) {
      setOrderBy([{ column: '', direction: 'ASC' }]);
      return;
    }
    
    // Remove ordenações que referenciam colunas não disponíveis
    if (columns.length > 0) {
      const validOrderBy = orderBy.filter(order => {
        if (!order || !order.column) return true;
        return columns.some(col => col && col.id === order.column);
      });
      
      // Só atualiza se realmente houver mudanças
      if (validOrderBy.length !== orderBy.length) {
        setOrderBy(validOrderBy.length > 0 ? validOrderBy : [{ column: '', direction: 'ASC' }]);
      }
    }
  }, [columns]);

  // Atualiza um campo específico de ordenação
  const updateOrderBy = (index, key, value) => {
    if (!Array.isArray(orderBy)) return;
    
    const updated = [...orderBy];
    if (updated[index]) {
      updated[index][key] = value;
      setOrderBy(updated);
    }
  };

  // Adiciona nova ordenação
  const addOrderBy = () => {
    const currentOrderBy = Array.isArray(orderBy) ? orderBy : [];
    setOrderBy([
      ...currentOrderBy,
      { column: '', direction: 'ASC' }
    ]);
  };

  // Remove ordenação
  const removeOrderBy = (index) => {
    if (!Array.isArray(orderBy) || orderBy.length <= 1) return;
    
    const newOrderBy = orderBy.filter((_, i) => i !== index);
    setOrderBy(newOrderBy);
  };

  return (
    <div className="section">
      <h3 className="section-title">Ordenação</h3>

      {Array.isArray(orderBy) && orderBy.map((order, index) => (
        <div key={index} className="filter-column">
          {/* Coluna para ordenação */}
          <select
            className="filter-select"
            value={order?.column || ''}
            onChange={e => updateOrderBy(index, 'column', e.target.value)}
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

          {/* Direção da ordenação */}
          <select
            className="filter-select-operator"
            value={order?.direction || 'ASC'}
            onChange={e => updateOrderBy(index, 'direction', e.target.value)}
          >
            <option value="ASC">ASC</option>
            <option value="DESC">DESC</option>
          </select>

          {/* Botão remover */}
          {Array.isArray(orderBy) && orderBy.length > 1 && (
            <button
              className="filter-remove"
              onClick={() => removeOrderBy(index)}
            >
              X
            </button>
          )}
        </div>
      ))}

      {/* Botão adicionar ordenação */}
      <button className="filter-add" onClick={addOrderBy}>
        Adicionar Ordenação
      </button>

      {Object.keys(groupedColumns).length === 0 && (
        <div className="no-columns-message">
          <p>Nenhuma coluna disponível para ordenação</p>
        </div>
      )}

      {/* Informações sobre a ordenação atual */}
      {Array.isArray(orderBy) && orderBy.some(order => order?.column) && (
        <div className="grouping-preview" style={{ marginTop: '15px' }}>
          <h4>Ordem Definida:</h4>
          <p>
            {orderBy
              .filter(order => order?.column)
              .map((order, index) => (
                <span key={index}>
                  {index > 0 && ' → '}
                  <strong>{translateColumnName(order.column)}</strong> 
                  {' '}({order.direction === 'ASC' ? 'Crescente' : 'Decrescente'})
                </span>
              ))
            }
          </p>
        </div>
      )}
    </div>
  );
}

export default OrderBy;
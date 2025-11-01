import React from 'react';

function OrderBy({ columns, orderBy, setOrderBy }) {

  // Atualiza uma cláusula específica
  const handleColumnChange = (index, value) => {
    const updated = [...orderBy];
    if (value === '') {
      // 🔥 CORREÇÃO: Se selecionar vazio, remove a coluna mas mantém o objeto
      updated[index] = { column: null, direction: updated[index].direction || 'ASC' };
    } else {
      updated[index].column = value;
    }
    setOrderBy(updated);
  };

  const handleDirectionChange = (index, value) => {
    const updated = [...orderBy];
    updated[index].direction = value;
    setOrderBy(updated);
  };

  // Adiciona uma nova cláusula de ORDER BY
  const addOrderClause = () => {
    setOrderBy([...orderBy, { column: null, direction: 'ASC' }]);
  };

  // Remove cláusula
  const removeOrderClause = (index) => {
    const updated = orderBy.filter((_, i) => i !== index);
    setOrderBy(updated);
  };

  // 🔥 CORREÇÃO: Limpar completamente quando não há cláusulas válidas
  const clearAllOrderBy = () => {
    setOrderBy([]);
  };

  return (
    <div className="section">
      <h3 className="section-title">Ordenação</h3>

      {orderBy.map((ob, index) => (
        <div key={index} className="filter-column">
          <select
            className="filter-select"
            value={ob.column || ''}
            onChange={e => handleColumnChange(index, e.target.value)}
          >
            <option value="">Selecione uma coluna</option>
            {columns.map((opt, i) => (
              <option key={opt.id || opt.column || i} value={opt.id || opt.column}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={ob.direction || 'ASC'}
            onChange={e => handleDirectionChange(index, e.target.value)}
          >
            <option value="ASC">ASC</option>
            <option value="DESC">DESC</option>
          </select>

          <button className="filter-remove" onClick={() => removeOrderClause(index)}>X</button>
        </div>
      ))}

      <div className="filter-actions">
        <button className="filter-add" onClick={addOrderClause}>
          Adicionar Ordenação
        </button>
        
      </div>

      {/* 🔥 DEBUG: Mostrar estado atual */}
      <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
        <strong>Debug orderBy:</strong> {JSON.stringify(orderBy)}
      </div>
    </div>
  );
}

export default OrderBy;
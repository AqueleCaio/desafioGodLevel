import React from 'react';
import { 
  extractTableFromColumn, 
  translateColumnName,
  translateTableName 
} from '../../services/frontController';

function Columns({ columns, selectedColumns, toggleColumn }) {
  // 🔥 Agrupa colunas por tabela
  const groupedColumns = React.useMemo(() => {
    const groups = {};
    
    columns.forEach(column => {
      const tableName = extractTableFromColumn(column.id);
      
      if (!groups[tableName]) {
        groups[tableName] = [];
      }
      
      groups[tableName].push({
        id: column.id,
        name: translateColumnName(column.id), // 🔥 Traduz apenas o atributo
        originalName: column.id
      });
    });
    
    return groups;
  }, [columns]);

  // 🔥 AGREGA COLUNAS SELECIONADAS POR TABELA
  const selectedGroupedColumns = React.useMemo(() => {
    const groups = {};
    
    selectedColumns.forEach(columnId => {
      const tableName = extractTableFromColumn(columnId);
      const columnName = translateColumnName(columnId);
      
      if (!groups[tableName]) {
        groups[tableName] = [];
      }
      
      groups[tableName].push(columnName);
    });
    
    return groups;
  }, [selectedColumns]);

  return (
    <div className="section">
      <h3 className="section-title">
        <span>📊</span>
        Colunas para Exibir
      </h3>

      {/* 🔥 SEÇÃO DISCRETA DE COLUNAS SELECIONADAS */}
      {selectedColumns.length > 0 && (
        <div className="selected-columns-preview">
          <div className="preview-header">
            <span className="preview-title">Colunas selecionadas:</span>
            <span className="preview-count">{selectedColumns.length}</span>
          </div>
          <div className="preview-content">
            {Object.entries(selectedGroupedColumns).map(([tableName, columnNames]) => (
              <div key={tableName} className="preview-table-group">
                <span className="preview-table-name">
                  {translateTableName(tableName)}:
                </span>
                <span className="preview-columns-list">
                  {columnNames.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 🔥 Renderiza grupos de colunas por tabela */}
      {Object.entries(groupedColumns).map(([tableName, tableColumns]) => (
        <div key={tableName} className="table-column-group">
          <div className="table-group-header">
            <h4 className="table-group-title">
              {translateTableName(tableName)} {/* 🔥 Traduz o nome da tabela */}
            </h4>
            <span className="table-columns-count">
              {tableColumns.length} coluna{tableColumns.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="checkbox-group table-checkbox-group">
            {tableColumns.map(column => (
              <label key={column.id} className={`checkbox-label ${selectedColumns.includes(column.id) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={selectedColumns.includes(column.id)}
                  onChange={() => toggleColumn(column.id)}
                />
                <span className="checkbox-text">{column.name}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      
      {/* Caso não haja colunas */}
      {Object.keys(groupedColumns).length === 0 && (
        <div className="no-columns-message">
          <p>Nenhuma coluna disponível para exibição</p>
        </div>
      )}
    </div>
  );
}

export default Columns;
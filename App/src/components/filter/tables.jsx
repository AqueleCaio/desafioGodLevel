import { translations } from '../../services/frontController';

function Tables({ 
  selectedTable, 
  setSelectedTable, 
  selectedTables, 
  setSelectedTables, 
  availableTables, 
  removeTable, 
  updateAvailableTables,
  hasError
}) {
  // Garante que só tenha valores únicos
  const uniqueTables = [...new Set(
    availableTables.map(t => (typeof t === 'string' ? t : t.name))
  )];

  // Traduz nome da tabela
  const translateTable = (tableName) => {
    return translations.tables[tableName] || tableName;
  };

  return (
    <div className={`section ${hasError ? 'section-error' : ''}`}>
      <h3 className="section-title">
        <span>📋</span>
        Tabelas Disponíveis
        {hasError && <span className="error-marker">*</span>}
      </h3>
      
      {hasError && (
        <div className="error-message">
          Selecione pelo menos uma tabela para gerar o relatório
        </div>
      )}
      
      <div className="dropbox_tables">
        <select
          className={`filter-select ${hasError ? 'input-error' : ''}`}
          value={selectedTable || ''}
          onChange={(e) => setSelectedTable(e.target.value)}
          disabled={uniqueTables.length === 0}
        >
          <option value="">
            {uniqueTables.length === 0 ? 'Nenhuma opção disponível' : 'Tabelas'}
          </option>
          {uniqueTables.map((tableName) => (
            <option key={tableName} value={tableName}>
              {translateTable(tableName)}
            </option>
          ))}
        </select>

        <div className="selected-tables-container">
          {selectedTables.map(table => (
            <div key={table} className="selected-table-badge">
              {translateTable(table)}
              <button 
                onClick={() => removeTable(table)}
                className='remove_button'
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          className="add-button"
          onClick={() => {
            if (selectedTable && !selectedTables.includes(selectedTable)) {
              const newTables = [...selectedTables, selectedTable];
              setSelectedTables(newTables);
              updateAvailableTables(selectedTable, newTables);
              setSelectedTable('');
            }
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default Tables;
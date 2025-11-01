import { translations } from '../../services/frontController';

function Tables({ selectedTable, setSelectedTable, selectedTables, setSelectedTables, availableTables, removeTable, updateAvailableTables }) {
  // garante que só tenha valores únicos
  const uniqueTables = [...new Set(
    availableTables.map(t => (typeof t === 'string' ? t : t.name))
  )];

  // Função para pegar tradução da tabela
  const translateTable = (tableName) => {
    return translations.tables[tableName] || tableName; // retorna tradução ou o próprio nome se não houver
  };

  return (
    <div className="section">
      <h3 className="section-title">
        <span>📋</span>
        Tabelas Disponíveis
      </h3>
      
      <div className="dropbox_tables">
        <select
          className="filter-select"
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

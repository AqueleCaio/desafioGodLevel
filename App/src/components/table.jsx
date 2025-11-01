import React, { useMemo } from 'react';
import { useQuery } from '../context/queryContext';
import { translations, extractAndTranslateTableName } from '../services/frontController';
import '../styles/Table.css';

function Table() {
  const { result } = useQuery();
  const { rows = [], columns = [] } = result || {};

  // 🔥 FUNÇÃO ATUALIZADA PARA TRADUZIR NOMES DE COLUNAS
  const translateColumnName = (columnName) => {
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
          const columnTranslation = translations.columns[columnWithoutTable] || formatColumnName(columnWithoutTable);
          
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
      const columnTranslation = translations.columns[columnWithoutTable] || formatColumnName(columnWithoutTable);
      return `${tableName} - ${columnTranslation}`;
    }
    
    // 4️⃣ QUARTO: Fallback - Formatação básica
    return formatColumnName(columnName);
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

  // 🔥 FUNÇÃO AUXILIAR: Formata nome da coluna
  const formatColumnName = (columnName) => {
    const words = columnName.split('_');
    const capitalizedWords = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    return capitalizedWords.join(' ');
  };

  // 🔥 COLUNAS COM LABELS TRADUZIDOS
  const translatedColumns = useMemo(() => {
    return columns.map(col => ({
      ...col,
      label: translateColumnName(col.dataKey || col.column || '')
    }));
  }, [columns]);

  // 🧩 Pré-tratamento dos dados (mantido igual)
  const processedRows = useMemo(() => {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    return rows.map(row => {
      const newRow = {};

      for (const col of columns) {
        const key = col.dataKey || col.column;
        let value = row[key];

        if (value === null || value === undefined) {
          newRow[key] = '';
        } 
        else if (typeof value === 'number') {
          if (key.toLowerCase().includes('ano') || key.toLowerCase().endsWith('_id')) {
            newRow[key] = Math.round(value);
          } else {
            newRow[key] = value.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          }
        } 
        else {
          newRow[key] = value;
        }
      }

      return newRow;
    });
  }, [rows, columns]);

  // Define altura máxima se houver mais de 15 linhas
  const maxRowsVisible = 15;
  const rowHeight = 40;
  const tableHeight = rows.length > maxRowsVisible ? maxRowsVisible * rowHeight : 'auto';

  if (!rows.length || !columns.length) {
    return (
      <div className="tabela">
        <h2>Resultados do Relatório</h2>
        <p>Nenhum dado disponível.</p>
      </div>
    );
  }

  console.log('Colunas traduzidas:', translatedColumns);

  return (
    <div className="tabela">
      <h2>Resultados do Relatório</h2>
      <div
        className="table-container"
        style={{
          maxHeight: tableHeight,
          overflowY: rows.length > maxRowsVisible ? 'auto' : 'visible',
        }}
      >
        <table>
          <thead>
            <tr>
              {translatedColumns.map((col) => (
                <th key={col.dataKey || col.column}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedRows.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => {
                  const key = col.dataKey || col.column;
                  return <td key={key}>{row[key]}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
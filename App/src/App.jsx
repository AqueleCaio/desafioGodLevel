import React, { useState } from 'react';
import FilterMain from './components/filterMain';
import SQLCode from './components/code';
import ChartComponent from './components/chart';
import Table from './components/table';

import './App.css';
import { QueryProvider } from './context/queryContext';

function App() {
  return (
    <QueryProvider>
      <div className="app-container">
        <div className="app-content">
          <FilterMain />
          <div className="app-right-panel">
            <SQLCode/>
            <ChartComponent />
            <Table/>
          </div>
        </div>
      </div>
    </QueryProvider>
  );
}

export default App;

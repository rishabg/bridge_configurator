import React from 'react';
import './App.css';
import IpConfigurator from './components/IpConfigurator';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>iLab Bridge Network Configurator</h1>
      </header>
      <main>
        <IpConfigurator />
      </main>
    </div>
  );
}

export default App;

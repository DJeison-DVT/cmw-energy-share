import React, { useEffect } from 'react';
import './App.css';
import MapChart from './components/MapChart';

function App() {
  useEffect(() => {
    document.title = "Renewable Country Shares";
  }, []);

  return (
    <div className="App">
      <h1>Renewable Energy Shares Visualization</h1>
      <MapChart />
    </div>
  );
}

export default App;

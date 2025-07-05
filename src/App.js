import React from 'react';
// Supprimez cette ligne si vous n'avez pas besoin de App.css
// import './App.css';
import GraphInterface from './components/GraphInterface';

function App() {
  return (
    <div className="bg-gray-100 p-2 sm:p-4 md:p-6">
      <div className="container mx-auto bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-center">Graphe - Recherche de Chemins</h1>
        <GraphInterface />
      </div>
    </div>
  );
}

export default App;
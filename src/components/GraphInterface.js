import React, { useState, useEffect } from 'react';
import GraphPath from '../utils/GraphPath';

const GraphInterface = () => {
  const [vertexCount, setVertexCount] = useState(16);
  const [edges, setEdges] = useState([]);
  const [pathType, setPathType] = useState('min');
  const [startVertex, setStartVertex] = useState(0);
  const [endVertex, setEndVertex] = useState(15);
  const [edgeWeight, setEdgeWeight] = useState(1);
  const [result, setResult] = useState('');

  useEffect(() => {
    addDefaultEdges();
  }, []);

  useEffect(() => {
    // Mettre à jour endVertex quand vertexCount change
    if (endVertex >= vertexCount) {
      setEndVertex(vertexCount - 1);
    }
  }, [vertexCount, endVertex]);

  const addDefaultEdges = () => {
    const defaultEdges = [
      { source: 0, destination: 1, weight: 10 },    // x1 -> x2
      { source: 1, destination: 2, weight: 15 },    // x2 -> x3
      { source: 1, destination: 3, weight: 8 },     // x2 -> x4
      { source: 2, destination: 10, weight: 16 },   // x3 -> x11
      { source: 2, destination: 5, weight: 1 },     // x3 -> x6
      { source: 3, destination: 4, weight: 6 },     // x4 -> x5
      { source: 3, destination: 2, weight: 8 },     // x4 -> x3
      { source: 4, destination: 8, weight: 1 },     // x5 -> x9
      { source: 5, destination: 4, weight: 5 },     // x6 -> x5
      { source: 5, destination: 6, weight: 4 },     // x6 -> x7
      { source: 6, destination: 7, weight: 1 },     // x7 -> x8
      { source: 6, destination: 10, weight: 8 },    // x7 -> x11
      { source: 7, destination: 6, weight: 1 },     // x8 -> x7
      { source: 7, destination: 9, weight: 2 },     // x8 -> x10
      { source: 8, destination: 9, weight: 4 },     // x9 -> x10
      { source: 8, destination: 7, weight: 3 },     // x9 -> x8
      { source: 9, destination: 11, weight: 7 },    // x10 -> x12
      { source: 10, destination: 11, weight: 6 },   // x11 -> x12
      { source: 10, destination: 12, weight: 12 },  // x11 -> x13
      { source: 11, destination: 14, weight: 9 },   // x12 -> x15
      { source: 12, destination: 13, weight: 3 },   // x13 -> x14
      { source: 13, destination: 15, weight: 3 },   // x14 -> x16
      { source: 14, destination: 13, weight: 5 },   // x15 -> x14
      { source: 14, destination: 15, weight: 6 }    // x15 -> x16
    ];

    setEdges(defaultEdges);
  };

  const handleAddEdge = () => {
    if (startVertex !== endVertex) {
      const newEdge = {
        source: parseInt(startVertex),
        destination: parseInt(endVertex),
        weight: parseInt(edgeWeight)
      };
      setEdges([...edges, newEdge]);
    }
  };

  const calculatePath = () => {
    const graph = new GraphPath(vertexCount, pathType);
    
    // Ajouter toutes les arêtes
    edges.forEach(edge => {
      graph.addEdge(edge.source, edge.destination, edge.weight);
    });

    // Supprimer les cycles si chemin maximal
    if (pathType === 'max') {
      graph.removeCycles();
    }

    const paths = graph.findPath(parseInt(startVertex));
    const pathResult = graph.reconstructPath(parseInt(startVertex), parseInt(endVertex));

    const resultText = `
Chemin ${pathType === 'min' ? 'minimal' : 'maximal'} de x${parseInt(startVertex)+1} à x${parseInt(endVertex)+1}:

Longueur totale : ${paths[endVertex]}

Chemin :
${[parseInt(startVertex), ...pathResult.path.map(p => p.to)].map(v => `x${v+1}`).join(' -> ')}

Détails des étapes :
${pathResult.path.map(step => `x${step.from+1} -> x${step.to+1} (poids: ${step.weight})`).join('\n')}`;

    setResult(resultText);
  };

  // Générer les options pour les sélecteurs de sommets
  const vertexOptions = [];
  for (let i = 0; i < vertexCount; i++) {
    vertexOptions.push(
      <option key={i} value={i}>{`x${i+1}`}</option>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-2">Nombre de Sommets :</label>
          <input 
            type="number" 
            min="2" 
            max="20" 
            className="w-full p-2 border rounded" 
            value={vertexCount}
            onChange={(e) => setVertexCount(parseInt(e.target.value))}
          />
        </div>
        <div>
          <label className="block mb-2">Type de Chemin :</label>
          <select 
            className="w-full p-2 border rounded"
            value={pathType}
            onChange={(e) => setPathType(e.target.value)}
          >
            <option value="min">Chemin Minimal</option>
            <option value="max">Chemin Maximal</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block mb-2">Sommet Départ :</label>
          <select 
            className="w-full p-2 border rounded"
            value={startVertex}
            onChange={(e) => setStartVertex(parseInt(e.target.value))}
          >
            {vertexOptions}
          </select>
        </div>
        <div>
          <label className="block mb-2">Sommet Arrivée :</label>
          <select 
            className="w-full p-2 border rounded"
            value={endVertex}
            onChange={(e) => setEndVertex(parseInt(e.target.value))}
          >
            {vertexOptions}
          </select>
        </div>
        <div>
          <label className="block mb-2">Poids de l'Arête :</label>
          <input 
            type="number" 
            className="w-full p-2 border rounded" 
            value={edgeWeight}
            onChange={(e) => setEdgeWeight(parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <button 
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          onClick={handleAddEdge}
        >
          Ajouter Arête
        </button>
        <button 
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
          onClick={calculatePath}
        >
          Trouver Chemin
        </button>
      </div>

      <div className="mb-4 border p-2 min-h-[100px]">
        {edges.length === 0 ? (
          <p className="text-gray-500">Arêtes du graphe : (aucune)</p>
        ) : (
          <p>
            Arêtes du graphe :<br />
            {edges.map((edge, index) => (
              <span key={index}>
                x{edge.source+1} -&gt; x{edge.destination+1} (poids: {edge.weight})
                <br />
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded">
        <h2 className="font-bold mb-2">Résultats :</h2>
        <pre className="whitespace-pre-wrap">{result}</pre>
      </div>
    </div>
  );
};

export default GraphInterface;
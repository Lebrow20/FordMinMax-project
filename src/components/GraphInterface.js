import React, { useState, useEffect } from 'react';
import GraphPath from '../utils/GraphPath';
import GraphVisualization from './GraphVisualization';
import Swal from 'sweetalert2';

const GraphInterface = () => {
  const [vertexCount, setVertexCount] = useState(16);
  const [edges, setEdges] = useState([]);
  const [pathType, setPathType] = useState('min');
  const [startVertex, setStartVertex] = useState(0);
  const [endVertex, setEndVertex] = useState(15);
  const [edgeWeight, setEdgeWeight] = useState(1);
  const [result, setResult] = useState('');
  const [pathResult, setPathResult] = useState(null);
  // Ajouter un nouvel état pour stocker les étapes de calcul
  const [calculationSteps, setCalculationSteps] = useState([]);

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

    // Stocker le résultat du chemin pour la visualisation
    setPathResult(pathResult);

    // Transformer toutes les étapes de calcul pour le tableau
    const allCalculationSteps = graph.allSteps.map(step => {
      const i = step.from + 1; // +1 pour afficher x1 au lieu de x0
      const j = step.to + 1;
      const weight = step.weight;

      // Formater les valeurs pour l'affichage
      const prevValueDisplay = step.prevValue === Infinity ? '∞' :
        step.prevValue === -Infinity ? '-∞' :
          step.prevValue;
      const newValueDisplay = step.newValue === Infinity ? '∞' :
        step.newValue === -Infinity ? '-∞' :
          step.newValue;

      // Calculer λj - λi pour la comparaison selon l'algorithme
      const lambdaI = step.from === parseInt(startVertex) ? 0 :
        graph.allSteps.filter(s => s.to === step.from && s.isUpdated)
          .reduce((latest, s) => s.iteration > latest.iteration ? s : latest, { iteration: 0 }).newValue ||
        (pathType === 'min' ? Infinity : 0);

      const formattedLambdaI = lambdaI === Infinity ? '∞' :
        lambdaI === -Infinity ? '-∞' :
          lambdaI;

      // Calculer la différence λj - λi avec le résultat
      let diffResult;
      if (prevValueDisplay === '∞' || formattedLambdaI === '∞') {
        diffResult = '∞';
      } else if (prevValueDisplay === '-∞' || formattedLambdaI === '-∞') {
        diffResult = '-∞';
      } else {
        diffResult = step.prevValue - lambdaI;
      }

      const diffValue = `${prevValueDisplay} - ${formattedLambdaI} = ${diffResult}`;

      // Formater la nouvelle valeur selon l'algorithme
      const valueUpdate = step.isUpdated ?
        `${formattedLambdaI} + ${weight} = ${newValueDisplay}` :
        prevValueDisplay;

      return {
        i,
        j,
        diffValue: diffValue,
        weight,
        newValue: valueUpdate,
        isUpdated: step.isUpdated
      };
    });

    setCalculationSteps(allCalculationSteps);

    const resultText = `
Chemin ${pathType === 'min' ? 'minimal' : 'maximal'} de x${parseInt(startVertex) + 1} à x${parseInt(endVertex) + 1}:

Longueur totale : ${paths[endVertex]}

Chemin :
${[parseInt(startVertex), ...pathResult.path.map(p => p.to)].map(v => `x${v + 1}`).join(' -> ')}

Détails des étapes :
${pathResult.path.map(step => `x${step.from + 1} -> x${step.to + 1} (poids: ${step.weight})`).join('\n')}`;

    setResult(resultText);
  };

  // Générer les options pour les sélecteurs de sommets
  const vertexOptions = [];
  for (let i = 0; i < vertexCount; i++) {
    vertexOptions.push(
      <option key={i} value={i}>{`x${i + 1}`}</option>
    );
  }

  const handleEdgeUpdate = (updatedEdge) => {
    // Ouvrir directement la popup SweetAlert2
    openEditPopup(updatedEdge);
  };

  const handleEdgeDelete = (edgeToDelete) => {
    // Ouvrir directement la popup de confirmation
    openDeletePopup(edgeToDelete);
  };

  // Fonction pour mettre à jour l'arc après confirmation dans la popup
  const updateEdge = (edge, newWeight) => {
    const newEdges = edges.map(e => {
      if (e.source === edge.source && e.destination === edge.destination) {
        return { ...e, weight: newWeight };
      }
      return e;
    });
    setEdges(newEdges);

    // Recalculer automatiquement le chemin
    setTimeout(() => calculatePath(), 100);
  };

  // Fonction pour supprimer l'arc après confirmation
  const deleteEdge = (edge) => {
    const newEdges = edges.filter(e =>
      !(e.source === edge.source && e.destination === edge.destination)
    );
    setEdges(newEdges);

    // Recalculer automatiquement le chemin
    setTimeout(() => calculatePath(), 100);
  };

  // Fonction pour ouvrir la popup de modification avec SweetAlert2
  const openEditPopup = (edge) => {
    Swal.fire({
      title: `Modifier l'arc x${edge.source + 1} → x${edge.destination + 1}`,
      html: `
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Poids de l'arc :</label>
          <input id="swal-input-weight" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" value="${edge.weight}">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Mettre à jour',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      focusConfirm: false,
      preConfirm: () => {
        const weight = document.getElementById('swal-input-weight').value;
        if (!weight || isNaN(weight) || parseInt(weight) <= 0) {
          Swal.showValidationMessage('Veuillez entrer un poids valide (nombre positif)');
          return false;
        }
        return parseInt(weight);
      }
    }).then((result) => {
      if (result.isConfirmed) {
        updateEdge(edge, result.value);
        Swal.fire({
          title: 'Mis à jour!',
          text: `L'arc a été modifié avec un poids de ${result.value}.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  // Fonction pour ouvrir la popup de confirmation de suppression
  const openDeletePopup = (edge) => {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      html: `Voulez-vous vraiment supprimer l'arc <strong>x${edge.source + 1} → x${edge.destination + 1}</strong> (poids: ${edge.weight})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        deleteEdge(edge);
        Swal.fire({
          title: 'Supprimé!',
          text: 'L\'arc a été supprimé.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  return (
    <div>
      {/* Partie fixe en haut de l'écran */}
      <div className="fixed top-0 left-0 right-0 bg-white z-10 p-4 shadow-md overflow-x-auto">
        <h1 className="text-2xl font-bold text-center mb-4">Graphe - Recherche de Chemins</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
      </div>

      {/* Espace pour compenser la hauteur de la partie fixe */}
      <div className="pt-[280px] md:pt-[240px] sm:pt-[320px]"></div>

      {/* Contenu défilable */}
      <div className="mb-4 border p-2 min-h-[100px] bg-gray-50 rounded">
        {edges.length === 0 ? (
          <p className="text-gray-500">Arêtes du graphe : (aucune)</p>
        ) : (
          <div>
            <h3 className="font-bold mb-2">Arêtes du graphe :</h3>
            <div className="grid grid-cols-1 gap-2">
              {edges.map((edge, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded shadow-sm hover:bg-blue-50">
                  <span className="font-medium">
                    x{edge.source + 1} <span className="text-blue-500">→</span> x{edge.destination + 1} <span className="text-gray-600 ml-2">(poids: {edge.weight})</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm flex items-center"
                      onClick={() => openEditPopup(edge)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Modifier
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm flex items-center"
                      onClick={() => openDeletePopup(edge)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ajouter la visualisation du graphe */}
      <div className="mb-4">
        <GraphVisualization
          vertices={vertexCount}
          edges={edges}
          path={pathResult}
          pathType={pathType}
          onEdgeUpdate={handleEdgeUpdate}
          onEdgeDelete={handleEdgeDelete}
        />
      </div>

      {/* Tableau des étapes de calcul */}
      {calculationSteps.filter(step => step.isUpdated).length > 0 && (
        <div className="mt-4 mb-4 overflow-x-auto">
          <h2 className="font-bold mb-2">Étapes de calcul :</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-green-500 text-white">
                  <th className="py-2 px-4 border">i</th>
                  <th className="py-2 px-4 border">j</th>
                  <th className="py-2 px-4 border">λ<sub>j</sub> - λ<sub>i</sub></th>
                  <th className="py-2 px-4 border">v(x<sub>i</sub>, x<sub>j</sub>)</th>
                  <th className="py-2 px-4 border">λ<sub>j</sub> = λ<sub>i</sub> + v(x<sub>i</sub>, x<sub>j</sub>)</th>
                </tr>
              </thead>
              <tbody>
                {calculationSteps.filter(step => step.isUpdated).map((step, index) => (
                  <tr key={index} className="border hover:bg-gray-50 bg-green-100">
                    <td className="py-2 px-4 border text-center">{step.i}</td>
                    <td className="py-2 px-4 border text-center">{step.j}</td>
                    <td className="py-2 px-4 border text-center">{step.diffValue}</td>
                    <td className="py-2 px-4 border text-center">{step.weight}</td>
                    <td className="py-2 px-4 border">{step.newValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-gray-50 rounded">
        <h2 className="font-bold mb-2">Résultats :</h2>
        <pre className="whitespace-pre-wrap">{result}</pre>
      </div>
    </div>
  );
};

export default GraphInterface;
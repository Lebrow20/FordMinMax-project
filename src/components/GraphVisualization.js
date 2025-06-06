import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const GraphVisualization = ({ vertices, edges, path, pathType, onEdgeUpdate, onEdgeDelete }) => {
  const svgRef = useRef(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [editWeight, setEditWeight] = useState('');

  useEffect(() => {
    if (!edges.length) return;

    // Nettoyer le SVG précédent
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 1200;
    const height = 600;
    const nodeRadius = 30;

    // Créer le SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Créer les données pour les nœuds
    const nodes = Array.from({ length: vertices }, (_, i) => ({ id: i }));

    // Définir des positions fixes pour chaque nœud
    const nodePositions = {
      0: { x: 70, y: 250 },     // x1 (bleu)
      1: { x: 200, y: 250 },    // x2
      2: { x: 300, y: 350 },    // x3
      3: { x: 300, y: 150 },    // x4
      4: { x: 450, y: 120 },    // x5
      5: { x: 450, y: 250 },    // x6
      6: { x: 550, y: 280 },    // x7
      7: { x: 650, y: 180 },    // x8
      8: { x: 550, y: 120 },    // x9
      9: { x: 650, y: 280 },    // x10
      10: { x: 550, y: 400 },   // x11
      11: { x: 750, y: 280 },   // x12
      12: { x: 750, y: 400 },   // x13
      13: { x: 850, y: 280 },   // x14
      14: { x: 950, y: 180 },   // x15
      15: { x: 1100, y: 250 }   // x16 (bleu)
    };

    // Appliquer les positions fixes aux nœuds
    nodes.forEach(node => {
      if (nodePositions[node.id]) {
        node.x = nodePositions[node.id].x;
        node.y = nodePositions[node.id].y;
        node.fx = node.x;
        node.fy = node.y;
      }
    });

    // Créer les arcs directement à partir des arêtes
    const arcs = edges.map(edge => ({
      source: nodes.find(n => n.id === edge.source),
      target: nodes.find(n => n.id === edge.destination),
      weight: edge.weight,
      isPathEdge: false,
      sourceId: edge.source,
      targetId: edge.destination
    }));

    // Détecter les arcs bidirectionnels et ajuster leur courbure
    arcs.forEach((arc, i) => {
      // Chercher un arc inverse
      const reverseArc = arcs.find((other, j) =>
        j !== i &&
        other.sourceId === arc.targetId &&
        other.targetId === arc.sourceId
      );

      if (reverseArc) {
        // Si c'est le premier arc de la paire (index plus petit), courber vers le haut
        // Si c'est le second arc, courber vers le bas
        const isFirstArc = arcs.indexOf(arc) < arcs.indexOf(reverseArc);
        arc.curve = isFirstArc ? -0.15 : 0.15;
      } else {
        // Arc simple, pas de courbure
        arc.curve = 0;
      }
    });

    // Marquer les arcs qui font partie du chemin
    if (path && path.path) {
      arcs.forEach(arc => {
        arc.isPathEdge = path.path.some(p =>
          p.from === arc.source.id && p.to === arc.target.id
        );
      });
    }

    // Définir les marqueurs de flèches avec différentes couleurs
    const defs = svg.append('defs');

    // Flèche normale
    defs.append('marker')
      .attr('id', 'arrow-normal')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', nodeRadius + 12)
      .attr('refY', 0)
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#666');

    // Flèche pour chemin minimal (rouge)
    defs.append('marker')
      .attr('id', 'arrow-min')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', nodeRadius + 12)
      .attr('refY', 0)
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#ff0000');

    // Flèche pour chemin maximal (vert)
    defs.append('marker')
      .attr('id', 'arrow-max')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', nodeRadius + 12)
      .attr('refY', 0)
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#00ff00');

    // Fonction pour créer le chemin d'arc courbe
    const createArcPath = (d) => {
      if (d.curve === 0) {
        // Arc droit
        return `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`;
      } else {
        // Arc courbe - utiliser une courbure plus subtile
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Point de contrôle au milieu avec un décalage perpendiculaire
        const midX = (d.source.x + d.target.x) / 2;
        const midY = (d.source.y + d.target.y) / 2;

        // Vecteur perpendiculaire normalisé
        const perpX = -dy / distance;
        const perpY = dx / distance;

        // Décalage du point de contrôle (plus petit pour une courbure subtile)
        const offsetDistance = Math.min(distance * 0.2, 40); // Limiter le décalage
        const controlX = midX + perpX * d.curve * offsetDistance;
        const controlY = midY + perpY * d.curve * offsetDistance;

        return `M ${d.source.x} ${d.source.y} Q ${controlX} ${controlY} ${d.target.x} ${d.target.y}`;
      }
    };

    // Dessiner les arcs
    const pathElements = svg.append('g')
      .selectAll('path')
      .data(arcs)
      .enter().append('path')
      .attr('d', createArcPath)
      .attr('stroke-width', 1) // Augmenter légèrement l'épaisseur pour faciliter le clic
      .attr('stroke', d => {
        if (d.isPathEdge) {
          return pathType === 'min' ? '#ff0000' : '#00ff00';
        }
        return '#999';
      })
      .attr('fill', 'none')
      .attr('marker-end', d => {
        if (d.isPathEdge) {
          return pathType === 'min' ? 'url(#arrow-min)' : 'url(#arrow-max)';
        }
        return 'url(#arrow-normal)';
      })
      .style('cursor', 'pointer') // Changer le curseur pour indiquer que c'est cliquable
      .on('click', (event, d) => {
        // Trouver l'arête correspondante dans le tableau edges
        const edge = edges.find(e =>
          e.source === d.sourceId &&
          e.destination === d.targetId
        );

        if (edge) {
          setSelectedEdge(edge);
          setEditWeight(edge.weight.toString());
        }
      })
      .on('mouseover', function () {
        d3.select(this)
          .attr('stroke-width', 1) // Épaissir l'arc au survol
          .attr('stroke-opacity', 0.8);
      })
      .on('mouseout', function () {
        d3.select(this)
          .attr('stroke-width', 1)
          .attr('stroke-opacity', 1);
      });

    // Fonction pour calculer la position du texte sur l'arc courbe
    const getTextPosition = (d) => {
      if (d.curve === 0) {
        // Position pour arc droit avec petit décalage
        const midX = (d.source.x + d.target.x) / 2;
        const midY = (d.source.y + d.target.y) / 2;
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return {
          x: midX + (dy * 12) / distance,
          y: midY - (dx * 12) / distance
        };
      } else {
        // Position pour arc courbe
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const midX = (d.source.x + d.target.x) / 2;
        const midY = (d.source.y + d.target.y) / 2;

        const perpX = -dy / distance;
        const perpY = dx / distance;

        // Même calcul que pour l'arc mais pour le texte
        const offsetDistance = Math.min(distance * 0.2, 40);
        const controlX = midX + perpX * d.curve * offsetDistance;
        const controlY = midY + perpY * d.curve * offsetDistance;

        // Position du texte sur la courbe (milieu de la courbe quadratique)
        const t = 0.5;
        const x = (1 - t) * (1 - t) * d.source.x + 2 * (1 - t) * t * controlX + t * t * d.target.x;
        const y = (1 - t) * (1 - t) * d.source.y + 2 * (1 - t) * t * controlY + t * t * d.target.y;

        return { x, y };
      }
    };

    // Ajouter les poids des arcs
    const arcText = svg.append('g')
      .selectAll('text')
      .data(arcs)
      .enter().append('text')
      .text(d => d.weight)
      .attr('font-size', 16)
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('x', d => getTextPosition(d).x)
      .attr('y', d => getTextPosition(d).y)
      .style('pointer-events', 'none'); // Éviter que le texte n'interfère avec les clics sur l'arc

    // Dessiner les nœuds
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', nodeRadius)
      .attr('stroke', '#d62728')
      .attr('stroke-width', 2)
      .attr('fill', d => {
        if (d.id === 0 || d.id === 15) {
          return '#1f77b4'; // Bleu pour x1 et x16
        }
        if (path && path.path) {
          if (d.id === path.path[0]?.from) return '#1f77b4';
          if (d.id === path.path[path.path.length - 1]?.to) return '#1f77b4';
          if (path.path.some(p => p.from === d.id || p.to === d.id)) return '#ffcc00';
        }
        return 'white';
      })
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    // Ajouter les étiquettes des nœuds
    const nodeText = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => `x${d.id + 1}`)
      .attr('font-size', 14)
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', d => (d.id === 0 || d.id === 15) ? 'white' : 'black')
      .attr('x', d => d.x)
      .attr('y', d => d.y);

  }, [vertices, edges, path, pathType, setSelectedEdge]);

  const handleUpdateEdge = () => {
    if (selectedEdge && onEdgeUpdate) {
      onEdgeUpdate({
        ...selectedEdge,
        weight: parseInt(editWeight)
      });
      setSelectedEdge(null);
    }
  };

  const handleDeleteEdge = () => {
    if (selectedEdge && onEdgeDelete) {
      onEdgeDelete(selectedEdge);
      setSelectedEdge(null);
    }
  };

  const handleCancel = () => {
    setSelectedEdge(null);
  };

  return (
    <div className="border rounded p-4 bg-white">
      <h2 className="font-bold mb-2">Visualisation du Graphe :</h2>
      <svg ref={svgRef} className="w-full" style={{ minHeight: '600px' }}></svg>

      {selectedEdge && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Modifier l'arc : x{selectedEdge.source + 1} → x{selectedEdge.destination + 1}</h3>
          <div className="flex items-center gap-4">
            <div>
              <label className="block mb-1">Poids :</label>
              <input
                type="number"
                className="p-2 border rounded"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleUpdateEdge}
              >
                Mettre à jour
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={handleDeleteEdge}
              >
                Supprimer
              </button>
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                onClick={handleCancel}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphVisualization;
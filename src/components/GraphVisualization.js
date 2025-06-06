import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const GraphVisualization = ({ vertices, edges, path, pathType }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!edges.length) return;
    
    // Nettoyer le SVG précédent
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = 1200; // Augmentation de la largeur pour plus d'espace
    const height = 600; // Augmentation de la hauteur pour plus d'espace
    const nodeRadius = 30; // Augmentation de la taille des nœuds
    
    // Créer le SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    // Créer les données pour les nœuds et les liens
    const nodes = Array.from({ length: vertices }, (_, i) => ({ id: i }));
    const links = edges.map(edge => ({
      source: edge.source,
      target: edge.destination,
      weight: edge.weight
    }));
    
    // Définir des positions fixes pour chaque nœud avec plus d'espace entre eux
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
      15: { x: 1100, y: 250 }   // x16 (bleu) - déplacé plus à droite
    };
    
    // Appliquer les positions fixes aux nœuds
    nodes.forEach(node => {
      if (nodePositions[node.id]) {
        node.x = nodePositions[node.id].x;
        node.y = nodePositions[node.id].y;
        // Fixer les positions
        node.fx = node.x;
        node.fy = node.y;
      }
    });
    
    // Créer une simulation minimale juste pour établir les liens
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id))
      .alphaDecay(0.1)
      .alpha(0.1);
    
    // Dessiner les liens avec une épaisseur plus importante
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke-width', 3) // Augmentation de l'épaisseur des liens
      .attr('stroke', d => {
        // Vérifier si ce lien fait partie du chemin trouvé
        if (path && path.path) {
          return path.path.some(p => p.from === d.source.id && p.to === d.target.id) ? 
            (pathType === 'min' ? '#ff0000' : '#00ff00') : '#999';
        }
        return '#999';
      });
    
    // Ajouter les flèches pour les liens dirigés avec une taille plus importante
    svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', nodeRadius + 12) // Ajustement pour la nouvelle taille des nœuds
      .attr('refY', 0)
      .attr('markerWidth', 10) // Augmentation de la taille des flèches
      .attr('markerHeight', 10) // Augmentation de la taille des flèches
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#666'); // Couleur plus foncée pour les flèches
    
    link.attr('marker-end', 'url(#arrow)');
    
    // Dessiner les poids des liens avec une taille plus importante
    const linkText = svg.append('g')
      .selectAll('text')
      .data(links)
      .enter().append('text')
      .text(d => d.weight)
      .attr('font-size', 20) // Augmentation de la taille de police
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle');
    
    // Dessiner les nœuds avec une taille plus importante
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', nodeRadius)
      .attr('stroke', '#d62728')
      .attr('stroke-width', 2)
      .attr('fill', d => {
        // Colorer de la même façon le nœud de départ et d'arrivée
        if (d.id === 0 || d.id === 15) {
          return '#1f77b4'; // Bleu pour x1 et x16
        }
        // Colorer les nœuds du chemin si un chemin est trouvé
        if (path && path.path) {
          if (d.id === path.path[0]?.from) return '#1f77b4'; // Départ
          if (d.id === path.path[path.path.length - 1]?.to) return '#1f77b4'; // Arrivée
          if (path.path.some(p => p.from === d.id || p.to === d.id)) return '#ffcc00'; // Nœuds du chemin
        }
        return 'white'; // Nœuds normaux en blanc avec contour rouge
      });
    
    // Ajouter les étiquettes des nœuds avec une taille plus importante
    const nodeText = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => `x${d.id + 1}`)
      .attr('font-size', 14) // Augmentation de la taille de police
      .attr('font-weight', 'bold') // Texte en gras
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', d => {
        // Texte en blanc pour les nœuds bleus, en noir pour les autres
        return (d.id === 0 || d.id === 15) ? 'white' : 'black';
      });
    
    // Positionner immédiatement tous les éléments
    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
    
    nodeText
      .attr('x', d => d.x)
      .attr('y', d => d.y);
    
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
    
    // Positionner les textes des poids des liens avec un décalage plus important
    linkText
      .attr('x', d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const midX = (d.source.x + d.target.x) / 2;
        // Décaler davantage le texte perpendiculairement à la ligne
        return midX + (dy * 0.25) / Math.sqrt(dx * dx + dy * dy);
      })
      .attr('y', d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const midY = (d.source.y + d.target.y) / 2;
        // Décaler davantage le texte perpendiculairement à la ligne
        return midY - (dx * 0.25) / Math.sqrt(dx * dx + dy * dy);
      });
    
    // Arrêter la simulation immédiatement
    simulation.stop();
    
  }, [vertices, edges, path, pathType]);

  return (
    <div className="border rounded p-4 bg-white">
      <h2 className="font-bold mb-2">Visualisation du Graphe :</h2>
      <svg ref={svgRef} className="w-full" style={{ minHeight: '500px' }}></svg>
    </div>
  );
};

export default GraphVisualization;
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

// Couleurs personnalisées pour le thème
const customRed = '#1b8fff';   // Rouge attractif
const customGreen = '#43aa8b'; // Vert personnalisé

const GraphVisualization = ({ vertices, edges, path, pathType, onEdgeUpdate, onEdgeDelete, lambdas }) => {
  const svgRef = useRef(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  // Ajout d'un état pour stocker les positions personnalisées
  const [customPositions, setCustomPositions] = useState({});

  // Fonction pour gérer le redimensionnement
  const handleResize = () => {
    if (!edges.length || !svgRef.current) return;
    renderGraph();
  };

  // Fonction principale de rendu du graphe
  const renderGraph = () => {
    if (!edges.length || !svgRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const containerWidth = svgRef.current.parentElement.clientWidth;
    const width = Math.min(containerWidth, 1200);
    const height = Math.min(width / 2, 600);
    const nodeRadius = Math.max(15, Math.min(30, width / 40));

    const scaleX = width / 1200;
    const scaleY = height / 600;

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const nodes = Array.from({ length: vertices }, (_, i) => ({ id: i }));

    let baseNodePositions = {};
    if (vertices <= 16) {
      baseNodePositions = {
        0: { x: 70, y: 250 },
        1: { x: 200, y: 250 },
        2: { x: 300, y: 350 },
        3: { x: 300, y: 150 },
        4: { x: 450, y: 120 },
        5: { x: 450, y: 250 },
        6: { x: 550, y: 280 },
        7: { x: 650, y: 180 },
        8: { x: 550, y: 120 },
        9: { x: 650, y: 280 },
        10: { x: 550, y: 400 },
        11: { x: 750, y: 280 },
        12: { x: 750, y: 400 },
        13: { x: 850, y: 280 },
        14: { x: 950, y: 180 },
        15: { x: 1100, y: 250 }
      };
    } else if (vertices >= 17 && vertices <= 20) {
      baseNodePositions = {
        0: { x: 70, y: 250 },
        1: { x: 200, y: 80 },
        2: { x: 200, y: 420 },
        3: { x: 350, y: 80 },
        4: { x: 350, y: 250 },
        5: { x: 350, y: 420 },
        6: { x: 500, y: 80 },
        7: { x: 500, y: 250 },
        8: { x: 500, y: 420 },
        9: { x: 650, y: 80 },
        10: { x: 650, y: 250 },
        11: { x: 650, y: 420 },
        12: { x: 800, y: 80 },
        13: { x: 800, y: 250 },
        14: { x: 800, y: 420 },
        15: { x: 950, y: 80 },
        16: { x: 950, y: 250 },
        17: { x: 950, y: 420 },
        18: { x: 1100, y: 150 },
        19: { x: 1100, y: 350 }
      };
    } else {
      // Pour les autres cas, tu peux garder la logique dynamique ou adapter selon besoin
      // ...placement dynamique...
    }

    // Utiliser la position personnalisée si elle existe, sinon la position de base
    const nodePositions = {};
    Object.keys(baseNodePositions).forEach(id => {
      if (customPositions[id]) {
        nodePositions[id] = customPositions[id];
      } else {
        nodePositions[id] = {
          x: baseNodePositions[id].x * scaleX,
          y: baseNodePositions[id].y * scaleY
        };
      }
    });

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
      const reverseArc = arcs.find((other, j) =>
        j !== i &&
        other.sourceId === arc.targetId &&
        other.targetId === arc.sourceId
      );
      if (reverseArc) {
        const isFirstArc = arcs.indexOf(arc) < arcs.indexOf(reverseArc);
        arc.curve = isFirstArc ? -0.15 : 0.15;
      } else {
        arc.curve = 0;
      }
    });

    if (path && path.path) {
      arcs.forEach(arc => {
        arc.isPathEdge = path.path.some(p =>
          p.from === arc.source.id && p.to === arc.target.id
        );
      });
    }

    const defs = svg.append('defs');
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
      .attr('fill', '#43aa8b');
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
      .attr('fill', '#e63946');

    const createArcPath = (d) => {
      if (d.curve === 0) {
        return `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`;
      } else {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const midX = (d.source.x + d.target.x) / 2;
        const midY = (d.source.y + d.target.y) / 2;
        const perpX = -dy / distance;
        const perpY = dx / distance;
        const offsetDistance = Math.min(distance * 0.2, 40);
        const controlX = midX + perpX * d.curve * offsetDistance;
        const controlY = midY + perpY * d.curve * offsetDistance;
        return `M ${d.source.x} ${d.source.y} Q ${controlX} ${controlY} ${d.target.x} ${d.target.y}`;
      }
    };

    svg.append('g')
      .selectAll('path')
      .data(arcs)
      .enter().append('path')
      .attr('d', createArcPath)
      .attr('stroke-width', 1)
      .attr('stroke', d => {
        if (d.isPathEdge) {
          return pathType === 'min' ? customGreen : customRed;
        }
        return '#90caf9'; // bleu clair pour les autres arcs
      })
      .attr('fill', 'none')
      .attr('marker-end', d => {
        if (d.isPathEdge) {
          return pathType === 'min' ? 'url(#arrow-min)' : 'url(#arrow-max)';
        }
        return 'url(#arrow-normal)';
      })
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        const edge = edges.find(e =>
          e.source === d.sourceId &&
          e.destination === d.targetId
        );
        if (edge && onEdgeUpdate) {
          onEdgeUpdate(edge);
        }
      })
      .on('mouseover', function () {
        d3.select(this)
          .attr('stroke-width', 1)
          .attr('stroke-opacity', 0.8);
      })
      .on('mouseout', function () {
        d3.select(this)
          .attr('stroke-width', 1)
          .attr('stroke-opacity', 1);
      });

    const getTextPosition = (d) => {
      if (d.curve === 0) {
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
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const midX = (d.source.x + d.target.x) / 2;
        const midY = (d.source.y + d.target.y) / 2;
        const perpX = -dy / distance;
        const perpY = dx / distance;
        const offsetDistance = Math.min(distance * 0.2, 40);
        const controlX = midX + perpX * d.curve * offsetDistance;
        const controlY = midY + perpY * d.curve * offsetDistance;
        const t = 0.5;
        const x = (1 - t) * (1 - t) * d.source.x + 2 * (1 - t) * t * controlX + t * t * d.target.x;
        const y = (1 - t) * (1 - t) * d.source.y + 2 * (1 - t) * t * controlY + t * t * d.target.y;
        return { x, y };
      }
    };

    svg.append('g')
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
      .style('pointer-events', 'auto')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        const edge = edges.find(e =>
          e.source === d.sourceId &&
          e.destination === d.targetId
        );
        if (edge && onEdgeUpdate) {
          onEdgeUpdate(edge);
        }
      })
      .on('mouseover', function () {
        d3.select(this)
          .attr('font-size', 18)
          .attr('fill', '#0066cc');
      })
      .on('mouseout', function () {
        d3.select(this)
          .attr('font-size', 16)
          .attr('fill', '#333');
      });

    // --- DRAG & DROP POUR LES NOEUDS ---
    function drag(simNodes) {
      return d3.drag()
        .on('start', function (event, d) {
          d3.select(this).raise().attr('stroke', '#222');
        })
        .on('drag', function (event, d) {
          d.x = Math.max(nodeRadius, Math.min(width - nodeRadius, event.x));
          d.y = Math.max(nodeRadius, Math.min(height - nodeRadius, event.y));
          setCustomPositions(prev => ({
            ...prev,
            [d.id]: { x: d.x, y: d.y }
          }));
        })
        .on('end', function (event, d) {
          d3.select(this).attr('stroke', '#d62728');
        });
    }

    svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', nodeRadius)
      .attr('stroke', '#d62728')
      .attr('stroke-width', 2)
      .attr('fill', d => {
        if (d.id === 0 || d.id === 15) {
          return '#1976d2'; // bleu foncé pour début/fin
        }
        if (path && path.path) {
          if (d.id === path.path[0]?.from) return '#1976d2';
          if (d.id === path.path[path.path.length - 1]?.to) return '#1976d2';
          if (path.path.some(p => p.from === d.id || p.to === d.id)) {
            return pathType === 'min' ? customGreen : customRed;
          }
        }
        return 'white';
      })
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .call(drag(nodes));

    // Affichage du nom des sommets
    svg.append('g')
      .selectAll('text.node-label')
      .data(nodes)
      .enter().append('text')
      .attr('class', 'node-label')
      .text(d => `x${d.id + 1}`)
      .attr('font-size', 14)
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', d => (d.id === 0 || d.id === 15) ? 'white' : '#1a237e')
      .attr('x', d => d.x)
      .attr('y', d => d.y);

    // Affichage des valeurs lambda en sub au-dessus de chaque sommet
    if (lambdas && Array.isArray(lambdas)) {
      svg.append('g')
        .selectAll('text.lambda-label')
        .data(nodes)
        .enter().append('text')
        .attr('class', 'lambda-label')
        .attr('font-size', 16)
        .attr('font-weight', 'bold')
        .attr('fill', '#ffb300') // Jaune doré pour lambda
        .attr('text-anchor', 'middle')
        .attr('x', d => d.x)
        .attr('y', d => d.y - nodeRadius - 12) // Positionné au-dessus du sommet
        .each(function (d) {
          const value = lambdas[d.id] !== undefined && lambdas[d.id] !== Infinity
            ? lambdas[d.id]
            : (lambdas[d.id] === Infinity ? '∞' : '');
          d3.select(this)
            .html(null)
            .append('tspan')
            .text('λ')
            .append('tspan')
            .attr('baseline-shift', 'sub')
            .attr('font-size', 12)
            .text(d.id + 1);
          d3.select(this)
            .append('tspan')
            .text(` = ${value}`);
        });
    }
  };

  // Mettre à jour le graphe à chaque changement de positions personnalisées
  useEffect(() => {
    renderGraph();
    // eslint-disable-next-line
  }, [vertices, edges, path, pathType, customPositions]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line
  }, [edges.length]);

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
    <div className="border rounded p-4 bg-white w-full overflow-hidden">
      <h2 className="font-bold mb-2">Visualisation du Graphe :</h2>
      <div className="w-full overflow-auto">
        <svg ref={svgRef} className="w-full" style={{ minHeight: '400px', maxHeight: '80vh' }}></svg>
      </div>
    </div>
  );
};

export default GraphVisualization;
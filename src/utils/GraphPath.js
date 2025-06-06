class GraphPath {
  constructor(vertices, type = 'min') {
    this.vertices = vertices;
    this.edges = [];
    this.predecessors = new Array(vertices).fill(null);
    this.type = type;
  }

  addEdge(source, destination, weight) {
    this.edges.push({ source, destination, weight });
  }

  removeCycles() {
    if (this.type === 'max') {
      let cycleFound = true;
      while (cycleFound) {
        cycleFound = false;
        const visited = new Set();
        const pathStack = [];
        let cycle = null;

        const findCycle = (vertex) => {
          if (pathStack.includes(vertex)) {
            const cycleStart = pathStack.indexOf(vertex);
            cycle = pathStack.slice(cycleStart);
            return;
          }

          visited.add(vertex);
          pathStack.push(vertex);

          const connectedEdges = this.edges.filter(edge => edge.source === vertex);
          for (const edge of connectedEdges) {
            if (!cycle) findCycle(edge.destination);
            if (cycle) return;
          }

          pathStack.pop();
        };

        for (let i = 0; i < this.vertices; i++) {
          if (!visited.has(i)) {
            findCycle(i);
            if (cycle) {
              cycleFound = true;
              break;
            }
          }
        }

        if (cycle) {
          const cycleEdges = [];
          for (let j = 0; j < cycle.length; j++) {
            const source = cycle[j];
            const destination = cycle[(j + 1) % cycle.length];

            const edge = this.edges.find(e => e.source === source && e.destination === destination);
            if (edge) cycleEdges.push(edge);
          }

          if (cycleEdges.length > 0) {
            const minEdge = cycleEdges.reduce((min, edge) => edge.weight < min.weight ? edge : min);
            this.edges = this.edges.filter(e => !(e.source === minEdge.source && e.destination === minEdge.destination));
          }
        }
      }
    }
    return this;
  }

  findPath(start) {
    const distances = new Array(this.vertices).fill(this.type === 'min' ? Infinity : -Infinity);
    this.predecessors = new Array(this.vertices).fill(null);
    distances[start] = 0;

    const MAX_ITERATIONS = this.vertices * 2;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      let updated = false;
      
      for (const edge of this.edges) {
        const u = edge.source;
        const v = edge.destination;
        const weight = edge.weight;

        const compareCondition = this.type === 'min' 
          ? (distances[u] !== Infinity && distances[u] + weight < distances[v])
          : (distances[u] !== -Infinity && distances[u] + weight > distances[v]);

        if (compareCondition) {
          distances[v] = distances[u] + weight;
          this.predecessors[v] = u;
          updated = true;
        }
      }

      if (!updated) break;
    }

    return distances;
  }

  reconstructPath(start, end) {
    const path = [];
    let current = end;
    let totalWeight = 0;

    if (this.predecessors[end] === null && start !== end) {
      return { path: [], totalWeight: 0 };
    }

    while (current !== start) {
      const prevVertex = this.predecessors[current];
      
      const edge = this.edges.find(e => 
        e.source === prevVertex && 
        e.destination === current
      );

      if (edge) {
        path.unshift({
          from: prevVertex,
          to: current,
          weight: edge.weight
        });
        totalWeight += edge.weight;
      }

      current = prevVertex;
    }

    return { path, totalWeight };
  }
}

export default GraphPath;
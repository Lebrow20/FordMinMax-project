class GraphPath {
  constructor(vertices, type = 'min') {
    this.vertices = vertices;
    this.edges = [];
    this.predecessors = new Array(vertices).fill(null);
    this.type = type;
    // Ajouter un tableau pour stocker toutes les étapes de calcul
    this.allSteps = [];
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
    // Initialisation selon l'algorithme demandé
    const distances = new Array(this.vertices).fill(this.type === 'min' ? Infinity : 0);
    this.predecessors = new Array(this.vertices).fill(null);
    distances[start] = 0;

    // Réinitialiser le tableau des étapes
    this.allSteps = [];

    const MAX_ITERATIONS = this.vertices * 2;
    let iteration = 1;
    let updated = true;

    while (updated && iteration <= MAX_ITERATIONS) {
      updated = false;

      // Parcourir toutes les arêtes pour appliquer l'algorithme
      for (const edge of this.edges) {
        const i = edge.source; // xi
        const j = edge.destination; // xj
        const weight = edge.weight; // v(xi, xj)

        // Condition selon l'algorithme (MIN ou MAX)
        const compareCondition = this.type === 'min'
          ? (distances[j] > distances[i] + weight) // Pour MIN: λj > λi + v(xi, xj)
          : (distances[j] < distances[i] + weight); // Pour MAX: λj < λi + v(xi, xj)

        // Vérifier si i > j et la condition spéciale pour recommencer
        const specialCondition = i > j && (
          this.type === 'min'
            ? (distances[j] - distances[i] > weight) // Pour MIN: λj - λi > v(xi, xj)
            : (distances[j] - distances[i] < weight)  // Pour MAX: λj - λi < v(xi, xj)
        );

        // Enregistrer l'étape avant la mise à jour potentielle
        const prevValue = distances[j];
        const newValue = distances[i] + weight;

        if (compareCondition || specialCondition) {
          // Stocker l'étape de calcul avec mise à jour
          this.allSteps.push({
            iteration: iteration,
            from: i,
            to: j,
            prevValue: prevValue,
            weight: weight,
            newValue: newValue,
            isUpdated: true
          });

          // Mettre à jour la valeur et le prédécesseur
          distances[j] = newValue;
          this.predecessors[j] = i;
          updated = true;

          // Si condition spéciale (i > j), on recommence à partir de j
          if (specialCondition) {
            // On pourrait implémenter une logique spécifique ici si nécessaire
          }
        }
        // Nous n'enregistrons plus les étapes sans mise à jour
      }

      iteration++;
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
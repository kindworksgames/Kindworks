export class NavigationGraph {
  constructor(nodes, links) {
    this.nodes = new Map();
    this.edges = new Map();
    for (const node of nodes || []) {
      if (!node?.id || this.nodes.has(node.id)) throw new TypeError(`Duplicate or missing navigation node: ${node?.id || "unknown"}.`);
      this.nodes.set(node.id, Object.freeze({ ...node }));
      this.edges.set(node.id, new Set());
    }
    for (const [a, b] of links || []) {
      if (!this.nodes.has(a) || !this.nodes.has(b)) throw new TypeError(`Unknown navigation link: ${a} / ${b}.`);
      this.edges.get(a).add(b);
      this.edges.get(b).add(a);
    }
  }

  getNode(id) {
    return this.nodes.get(id) || null;
  }

  hasNode(id) {
    return this.nodes.has(id);
  }

  areLinked(a, b) {
    return Boolean(this.edges.get(a)?.has(b));
  }

  findPath(startId, targetId, { blockedEdge = null } = {}) {
    if (startId === targetId && this.nodes.has(startId)) return [startId];
    if (!this.nodes.has(startId) || !this.nodes.has(targetId)) return [];
    const queue = [startId];
    const previous = new Map([[startId, null]]);
    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      for (const next of this.edges.get(current) || []) {
        if (blockedEdge?.(this.nodes.get(current), this.nodes.get(next))) continue;
        if (previous.has(next)) continue;
        previous.set(next, current);
        if (next === targetId) {
          const path = [targetId];
          let cursor = current;
          while (cursor) {
            path.push(cursor);
            cursor = previous.get(cursor);
          }
          return path.reverse();
        }
        queue.push(next);
      }
    }
    return [];
  }

  validate() {
    const errors = [];
    for (const [id, neighbours] of this.edges) {
      if (!neighbours.size) errors.push(`${id} is isolated.`);
      for (const neighbour of neighbours) if (!this.edges.get(neighbour)?.has(id)) errors.push(`${id} → ${neighbour} is not bidirectional.`);
    }
    const firstId = this.nodes.keys().next().value;
    const visited = new Set(firstId ? [firstId] : []);
    const queue = firstId ? [firstId] : [];
    for (let index = 0; index < queue.length; index += 1) {
      for (const next of this.edges.get(queue[index]) || []) if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
    if (visited.size !== this.nodes.size) errors.push(`Navigation graph has ${this.nodes.size - visited.size} unreachable nodes.`);
    return {
      ok: errors.length === 0,
      errors,
      nodeCount: this.nodes.size,
      linkCount: [...this.edges.values()].reduce((sum, values) => sum + values.size, 0) / 2,
      connectedNodeCount: visited.size,
    };
  }
}

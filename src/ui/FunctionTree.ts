export interface FunctionNode {
  readonly id: string;
  readonly label: string;
  readonly open?: boolean;
  /** Trusted application markup only; never interpolate user-entered content. */
  readonly content?: string;
  readonly children?: readonly FunctionNode[];
}

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]!));

export function renderFunctionTree(nodes: readonly FunctionNode[]): string {
  const seen = new Set<string>();
  const render = (node: FunctionNode): string => {
    if (seen.has(node.id)) throw new Error(`Duplicate function node: ${node.id}`);
    seen.add(node.id);
    return `<details class="function-node" id="function-${escapeHtml(node.id)}"${node.open ? ' open' : ''}>
      <summary>${escapeHtml(node.label)}</summary>
      <div class="function-node-content">${node.content ?? ''}${node.children?.map(render).join('') ?? ''}</div>
    </details>`;
  };
  return nodes.map(render).join('');
}

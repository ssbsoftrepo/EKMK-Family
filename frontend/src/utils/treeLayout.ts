import { FamilyMember } from '../types/family';

export interface LayoutNode {
  id: string;
  primary: FamilyMember;
  spouse?: FamilyMember;
  generation: number;
  x: number;
  y: number;
  width: number;
  height: number;
  children: LayoutNode[];
  isCollapsed: boolean;
  totalDescendants: number;
  branchId: string;
}

export interface TreeEdge {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  branchId: string;
  isHighlighted?: boolean;
}

export interface TreeLayoutResult {
  nodes: LayoutNode[];
  edges: TreeEdge[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

const CARD_WIDTH_SINGLE = 150;
const CARD_WIDTH_COUPLE = 320;
const CARD_HEIGHT = 180;
const LEVEL_GAP_Y = 85;
const SIBLING_GAP_X = 35;
const BRANCH_GAP_X = 65;

/**
 * Builds the hierarchical family tree from relationship data.
 * Does not depend on insertion order.
 */
export function buildFamilyTreeLayout(
  allMembers: FamilyMember[],
  collapsedNodeIds: Set<string>,
  activeBranchFilter: string | null = null,
  activeGenFilter: number | null = null,
  highlightedPersonId: string | null = null
): TreeLayoutResult {
  const memberMap = new Map<string, FamilyMember>();
  allMembers.forEach((m) => memberMap.set(m.id, m));

  // Find root members: Gen 1 members who don't have fatherId and motherId in dataset
  // To avoid duplicate root trees for married couple, pair them up
  const processedRoots = new Set<string>();
  const rootPairs: Array<{ primary: FamilyMember; spouse?: FamilyMember }> = [];

  // Sort by generation ascending so Gen 1 is at root
  const sortedMembers = [...allMembers].sort((a, b) => a.generation - b.generation);

  for (const m of sortedMembers) {
    if (processedRoots.has(m.id)) continue;
    
    // Check if this member is a root (no known parents in our database)
    const hasParents = (m.fatherId && memberMap.has(m.fatherId)) || (m.motherId && memberMap.has(m.motherId));
    if (!hasParents && m.generation === 1) {
      processedRoots.add(m.id);
      let spouse: FamilyMember | undefined;
      if (m.spouseId && memberMap.has(m.spouseId)) {
        spouse = memberMap.get(m.spouseId);
        processedRoots.add(m.spouseId);
      }
      rootPairs.push({ primary: m, spouse });
    }
  }

  // Fallback: if no gen 1 roots found (e.g. custom tree), take all with no parents
  if (rootPairs.length === 0) {
    for (const m of sortedMembers) {
      if (processedRoots.has(m.id)) continue;
      const hasParents = (m.fatherId && memberMap.has(m.fatherId)) || (m.motherId && memberMap.has(m.motherId));
      if (!hasParents) {
        processedRoots.add(m.id);
        let spouse: FamilyMember | undefined;
        if (m.spouseId && memberMap.has(m.spouseId)) {
          spouse = memberMap.get(m.spouseId);
          processedRoots.add(m.spouseId);
        }
        rootPairs.push({ primary: m, spouse });
      }
    }
  }

  // Helper to get child members for a couple/person
  function getChildren(primary: FamilyMember, spouse?: FamilyMember): FamilyMember[] {
    const childIdSet = new Set<string>();
    
    // Check direct childIds array
    primary.childIds?.forEach((cid) => childIdSet.add(cid));
    spouse?.childIds?.forEach((cid) => childIdSet.add(cid));

    // Also check reverse parent pointers
    for (const other of allMembers) {
      if (
        (other.fatherId && (other.fatherId === primary.id || other.fatherId === spouse?.id)) ||
        (other.motherId && (other.motherId === primary.id || other.motherId === spouse?.id))
      ) {
        childIdSet.add(other.id);
      }
    }

    const children: FamilyMember[] = [];
    childIdSet.forEach((cid) => {
      const child = memberMap.get(cid);
      if (child && child.id !== primary.id && child.id !== spouse?.id) {
        children.push(child);
      }
    });

    // Sort children by birth date or ID
    return children.sort((a, b) => {
      if (a.birthDate && b.birthDate) {
        return a.birthDate.localeCompare(b.birthDate);
      }
      return a.id.localeCompare(b.id);
    });
  }

  // Recursively construct tree nodes
  const visitedMemberIds = new Set<string>();

  function createNode(
    primary: FamilyMember,
    spouse?: FamilyMember,
    currentGen: number = 1
  ): LayoutNode {
    visitedMemberIds.add(primary.id);
    if (spouse) visitedMemberIds.add(spouse.id);

    const isCollapsed = collapsedNodeIds.has(primary.id) || (spouse && collapsedNodeIds.has(spouse.id));
    const width = spouse ? CARD_WIDTH_COUPLE : CARD_WIDTH_SINGLE;
    const height = CARD_HEIGHT;

    const childMembers = isCollapsed ? [] : getChildren(primary, spouse);
    const childNodes: LayoutNode[] = [];

    // Group child members with their respective spouses
    const processedChildIds = new Set<string>();

    for (const c of childMembers) {
      if (processedChildIds.has(c.id)) continue;
      processedChildIds.add(c.id);

      let childSpouse: FamilyMember | undefined;
      if (c.spouseId && memberMap.has(c.spouseId)) {
        childSpouse = memberMap.get(c.spouseId);
        processedChildIds.add(c.spouseId);
      }

      childNodes.push(createNode(c, childSpouse, currentGen + 1));
    }

    // Calculate total descendants recursively
    let totalDesc = childMembers.length;
    for (const cn of childNodes) {
      totalDesc += cn.totalDescendants;
    }

    return {
      id: primary.id,
      primary,
      spouse,
      generation: currentGen,
      x: 0,
      y: (currentGen - 1) * (CARD_HEIGHT + LEVEL_GAP_Y),
      width,
      height,
      children: childNodes,
      isCollapsed: !!isCollapsed,
      totalDescendants: totalDesc,
      branchId: primary.branchId || 'root',
    };
  }

  // Build tree hierarchy for all roots
  const rootNodes: LayoutNode[] = rootPairs.map((rp) =>
    createNode(rp.primary, rp.spouse, rp.primary.generation || 1)
  );

  // Position calculation:
  // Step 1: calculate subtree bounding widths for each node
  const subtreeWidths = new Map<string, number>();

  function computeSubtreeWidth(node: LayoutNode): number {
    if (node.children.length === 0 || node.isCollapsed) {
      subtreeWidths.set(node.id, node.width);
      return node.width;
    }

    const gap = node.generation === 1 ? BRANCH_GAP_X : SIBLING_GAP_X;
    let childrenTotalWidth = 0;
    for (let i = 0; i < node.children.length; i++) {
      childrenTotalWidth += computeSubtreeWidth(node.children[i]);
      if (i < node.children.length - 1) {
        childrenTotalWidth += gap;
      }
    }

    const totalWidth = Math.max(node.width, childrenTotalWidth);
    subtreeWidths.set(node.id, totalWidth);
    return totalWidth;
  }

  rootNodes.forEach(computeSubtreeWidth);

  // Step 2: assign x coordinates based on subtree widths
  function assignCoordinates(node: LayoutNode, leftX: number) {
    const totalSubtreeWidth = subtreeWidths.get(node.id) || node.width;
    
    // Center node within its subtree slot
    node.x = leftX + (totalSubtreeWidth - node.width) / 2;

    if (node.children.length > 0 && !node.isCollapsed) {
      const gap = node.generation === 1 ? BRANCH_GAP_X : SIBLING_GAP_X;
      let childrenTotalWidth = 0;
      for (let i = 0; i < node.children.length; i++) {
        childrenTotalWidth += subtreeWidths.get(node.children[i].id) || node.children[i].width;
        if (i < node.children.length - 1) {
          childrenTotalWidth += gap;
        }
      }

      // Starting X position for children to be centered relative to the subtree
      let currentChildLeft = leftX + (totalSubtreeWidth - childrenTotalWidth) / 2;

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        assignCoordinates(child, currentChildLeft);
        currentChildLeft += (subtreeWidths.get(child.id) || child.width) + gap;
      }
    }
  }

  let currentRootLeft = 100;
  for (const root of rootNodes) {
    assignCoordinates(root, currentRootLeft);
    currentRootLeft += (subtreeWidths.get(root.id) || root.width) + BRANCH_GAP_X * 2;
  }

  // Flatten nodes and generate connecting edges
  const flatNodes: LayoutNode[] = [];
  const edges: TreeEdge[] = [];

  function collectNodesAndEdges(node: LayoutNode) {
    flatNodes.push(node);

    if (node.children.length > 0 && !node.isCollapsed) {
      const parentCenterX = node.x + node.width / 2;
      const parentBottomY = node.y + node.height;

      for (const child of node.children) {
        const childCenterX = child.x + child.width / 2;
        const childTopY = child.y;

        const isEdgeHighlighted =
          highlightedPersonId === node.primary.id ||
          highlightedPersonId === node.spouse?.id ||
          highlightedPersonId === child.primary.id ||
          highlightedPersonId === child.spouse?.id;

        edges.push({
          id: `edge-${node.id}-${child.id}`,
          fromX: parentCenterX,
          fromY: parentBottomY,
          toX: childCenterX,
          toY: childTopY,
          branchId: child.branchId,
          isHighlighted: isEdgeHighlighted,
        });

        collectNodesAndEdges(child);
      }
    }
  }

  rootNodes.forEach(collectNodesAndEdges);

  // Compute overall bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  if (flatNodes.length === 0) {
    minX = 0;
    maxX = 1000;
    minY = 0;
    maxY = 800;
  } else {
    for (const node of flatNodes) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x + node.width);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y + node.height);
    }
  }

  // Filter nodes if activeBranchFilter or activeGenFilter is active (or flag them)
  // We keep flatNodes intact but can mark opacity / visibility in UI
  return {
    nodes: flatNodes,
    edges,
    bounds: {
      minX: minX - 100,
      maxX: maxX + 100,
      minY: Math.max(0, minY - 60),
      maxY: maxY + 150,
      width: Math.max(1200, maxX - minX + 200),
      height: Math.max(800, maxY - minY + 250),
    },
  };
}

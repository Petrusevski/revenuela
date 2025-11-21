// server/src/ai/toolHandlers.ts
import { prisma } from "../db";

async function ensureWorkspace(workspaceId: string) {
  const id = workspaceId || "demo-workspace";

  const ws = await prisma.workspace.upsert({
    where: { id },
    update: {},
    create: {
      id,
      name: "Demo Workspace",
      slug: id
    }
  });

  return ws;
}

export async function handleCreateWorkflow(args: any) {
  const { workspaceId, name, description } = args;

  // Make sure the workspace exists (or create it)
  const ws = await ensureWorkspace(workspaceId);

  const wf = await prisma.workflow.create({
    data: {
      workspaceId: ws.id,
      name,
      description: description ?? null
    }
  });

  return { workflowId: wf.id };
}

export async function handleAddWorkflowNode(args: any) {
  const { workflowId, appId, nodeId, type, name, positionX, positionY, config } = args;

  const node = await prisma.workflowNode.create({
    data: {
      workflowId,
      type,
      name,
      positionX: positionX ?? 0,
      positionY: positionY ?? 0,
      config: JSON.stringify({
        appId,
        nodeId,
        config: config ?? {}
      })
    }
  });

  return { nodeDbId: node.id };
}

export async function handleAddWorkflowEdge(args: any) {
  const { workflowId, fromNodeId, toNodeId, conditionLabel } = args;

  const edge = await prisma.workflowEdge.create({
    data: {
      workflowId,
      fromNodeId,
      toNodeId,
      conditionLabel: conditionLabel ?? null
    }
  });

  return { edgeId: edge.id };
}

// server/src/ai/tools.ts

export const revenuelaTools = [
  {
    type: "function",
    function: {
      name: "create_workflow",
      description: "Create a new workflow in Revenuela and return its ID.",
      parameters: {
        type: "object",
        properties: {
          workspaceId: { type: "string" },
          name: { type: "string" },
          description: { type: "string" }
        },
        required: ["workspaceId", "name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_workflow_node",
      description: "Add a node (trigger/action/utility) to a workflow.",
      parameters: {
        type: "object",
        properties: {
          workflowId: { type: "string" },
          appId: { type: "string" },
          nodeId: { type: "string" },
          type: { type: "string" }, // e.g. "trigger" | "action"
          name: { type: "string" },
          positionX: { type: "number" },
          positionY: { type: "number" },
          config: { type: "object", additionalProperties: true }
        },
        required: ["workflowId", "appId", "nodeId", "type", "name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_workflow_edge",
      description: "Connect two nodes inside a workflow.",
      parameters: {
        type: "object",
        properties: {
          workflowId: { type: "string" },
          fromNodeId: { type: "string" },
          toNodeId: { type: "string" },
          conditionLabel: { type: "string" }
        },
        required: ["workflowId", "fromNodeId", "toNodeId"]
      }
    }
  }
] as any; // keep typing simple so TS doesn't block us

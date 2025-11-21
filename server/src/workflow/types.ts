// server/src/workflow/types.ts
export type AuthType = "apiKey" | "oauth2" | "basic" | "none";

export type CredentialField = {
  key: string;
  label: string;
  type: "string" | "password" | "select";
  required: boolean;
  helperText?: string;
};

export type NodeIOField = {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "json" | "datetime";
  required?: boolean;
  description?: string;
};

export type NodeKind = "trigger" | "action" | "utility";

export type NodeDefinition = {
  id: string;
  kind: NodeKind;
  name: string;
  description: string;
  input?: NodeIOField[];
  output?: NodeIOField[];
};

export type AppDefinition = {
  id: string;
  displayName: string;
  category: string; // e.g. "prospecting", "crm", "messaging"
  auth: {
    type: AuthType;
    credentialFields: CredentialField[];
  };
  nodes: NodeDefinition[];
};

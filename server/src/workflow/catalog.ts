// server/src/workflow/catalog.ts
import type { AppDefinition } from "./types";

export const APP_CATALOG: AppDefinition[] = [
  // 1. Clay
  {
    id: "clay",
    displayName: "Clay",
    category: "prospecting",
    auth: {
      type: "apiKey",
      credentialFields: [
        {
          key: "apiKey",
          label: "Clay API Key",
          type: "password",
          required: true,
          helperText: "Found in Clay → Settings → API Keys."
        }
      ]
    },
    nodes: [
      {
        id: "clay.new_row_webhook",
        kind: "trigger",
        name: "New/Updated row (Webhook)",
        description:
          "Trigger when a row is created or updated in a Clay table and sent to Revenuela via webhook.",
        output: [
          { key: "rowId", label: "Clay Row ID", type: "string" },
          { key: "tableId", label: "Table ID", type: "string" },
          { key: "email", label: "Email", type: "string" },
          { key: "company", label: "Company", type: "string" },
          { key: "domain", label: "Domain", type: "string" },
          { key: "raw", label: "Raw Row JSON", type: "json" }
        ]
      },
      {
        id: "clay.enrich_person",
        kind: "action",
        name: "Enrich person",
        description:
          "Given an email or LinkedIn URL, enrich contact data using Clay.",
        input: [
          {
            key: "email",
            label: "Email",
            type: "string",
            required: false,
            description: "Email address to enrich."
          },
          {
            key: "linkedinUrl",
            label: "LinkedIn URL",
            type: "string",
            required: false,
            description: "LinkedIn profile URL to enrich."
          }
        ],
        output: [
          { key: "fullName", label: "Full name", type: "string" },
          { key: "jobTitle", label: "Job title", type: "string" },
          { key: "company", label: "Company", type: "string" },
          { key: "location", label: "Location", type: "string" },
          { key: "raw", label: "Raw enrichment JSON", type: "json" }
        ]
      }
    ]
  },

  // 2. HubSpot
  {
    id: "hubspot",
    displayName: "HubSpot",
    category: "crm",
    auth: {
      type: "oauth2",
      credentialFields: [
        {
          key: "accessToken",
          label: "Access Token",
          type: "password",
          required: true,
          helperText: "Generated via OAuth2 Connect HubSpot flow."
        }
      ]
    },
    nodes: [
      {
        id: "hubspot.new_contact",
        kind: "trigger",
        name: "New contact",
        description: "Trigger when a new contact is created in HubSpot.",
        output: [
          { key: "contactId", label: "Contact ID", type: "string" },
          { key: "email", label: "Email", type: "string" },
          { key: "firstName", label: "First name", type: "string" },
          { key: "lastName", label: "Last name", type: "string" },
          { key: "raw", label: "Raw contact JSON", type: "json" }
        ]
      },
      {
        id: "hubspot.create_or_update_contact",
        kind: "action",
        name: "Create or update contact",
        description:
          "Upsert a contact in HubSpot, matching by email or another unique identifier.",
        input: [
          { key: "email", label: "Email", type: "string", required: true },
          { key: "firstName", label: "First name", type: "string" },
          { key: "lastName", label: "Last name", type: "string" },
          { key: "company", label: "Company", type: "string" },
          { key: "lifecycleStage", label: "Lifecycle stage", type: "string" },
          {
            key: "properties",
            label: "Extra properties (JSON)",
            type: "json"
          }
        ],
        output: [
          { key: "contactId", label: "Contact ID", type: "string" },
          { key: "raw", label: "Raw response JSON", type: "json" }
        ]
      },
      {
        id: "hubspot.create_deal",
        kind: "action",
        name: "Create deal",
        description: "Create a deal associated with a HubSpot contact/company.",
        input: [
          {
            key: "dealName",
            label: "Deal name",
            type: "string",
            required: true
          },
          { key: "amount", label: "Amount", type: "number" },
          { key: "stage", label: "Stage", type: "string" },
          {
            key: "associatedContactId",
            label: "Associated contact ID",
            type: "string"
          }
        ],
        output: [
          { key: "dealId", label: "Deal ID", type: "string" },
          { key: "raw", label: "Raw response JSON", type: "json" }
        ]
      }
    ]
  },

  // 3. Slack
  {
    id: "slack",
    displayName: "Slack",
    category: "messaging",
    auth: {
      type: "oauth2",
      credentialFields: [
        {
          key: "botToken",
          label: "Bot User OAuth Token",
          type: "password",
          required: true,
          helperText: "Starts with xoxb-"
        }
      ]
    },
    nodes: [
      {
        id: "slack.post_message",
        kind: "action",
        name: "Post message",
        description: "Send a message to a Slack channel.",
        input: [
          {
            key: "channelId",
            label: "Channel ID or name",
            type: "string",
            required: true
          },
          {
            key: "text",
            label: "Message text",
            type: "string",
            required: true
          },
          {
            key: "threadTs",
            label: "Thread timestamp",
            type: "string",
            description: "If provided, post as a reply in a thread."
          }
        ],
        output: [{ key: "ts", label: "Message timestamp", type: "string" }]
      }
    ]
  },

  // 4. Stripe
  {
    id: "stripe",
    displayName: "Stripe",
    category: "billing",
    auth: {
      type: "apiKey",
      credentialFields: [
        {
          key: "secretKey",
          label: "Stripe Secret Key",
          type: "password",
          required: true,
          helperText: "Starts with sk_live_ or sk_test_."
        }
      ]
    },
    nodes: [
      {
        id: "stripe.checkout_completed_webhook",
        kind: "trigger",
        name: "Checkout session completed (Webhook)",
        description: "Trigger when a Stripe checkout session completes.",
        output: [
          { key: "customerId", label: "Customer ID", type: "string" },
          { key: "email", label: "Customer email", type: "string" },
          { key: "amountTotal", label: "Amount total", type: "number" },
          { key: "currency", label: "Currency", type: "string" },
          { key: "raw", label: "Raw Stripe event", type: "json" }
        ]
      },
      {
        id: "stripe.create_subscription",
        kind: "action",
        name: "Create subscription",
        description: "Create a subscription for an existing Stripe customer.",
        input: [
          {
            key: "customerId",
            label: "Customer ID",
            type: "string",
            required: true
          },
          {
            key: "priceId",
            label: "Price ID",
            type: "string",
            required: true
          },
          { key: "trialDays", label: "Trial days", type: "number" }
        ],
        output: [
          { key: "subscriptionId", label: "Subscription ID", type: "string" },
          { key: "status", label: "Subscription status", type: "string" }
        ]
      }
    ]
  },

  // 5. Generic HTTP / Webhook
  {
    id: "http",
    displayName: "HTTP / Webhook",
    category: "utility",
    auth: {
      type: "none",
      credentialFields: []
    },
    nodes: [
      {
        id: "http.webhook_trigger",
        kind: "trigger",
        name: "Incoming webhook",
        description:
          "Trigger the workflow when an HTTP POST is received at a generated URL.",
        output: [
          { key: "headers", label: "Headers", type: "json" },
          { key: "body", label: "Body", type: "json" },
          { key: "query", label: "Query params", type: "json" }
        ]
      },
      {
        id: "http.request",
        kind: "action",
        name: "HTTP Request",
        description: "Make a generic HTTP request to any API.",
        input: [
          {
            key: "method",
            label: "Method",
            type: "string",
            required: true
          },
          { key: "url", label: "URL", type: "string", required: true },
          { key: "headers", label: "Headers (JSON)", type: "json" },
          { key: "body", label: "Body (JSON)", type: "json" }
        ],
        output: [
          { key: "status", label: "Status code", type: "number" },
          { key: "responseHeaders", label: "Response headers", type: "json" },
          { key: "responseBody", label: "Response body", type: "json" }
        ]
      }
    ]
  }
];

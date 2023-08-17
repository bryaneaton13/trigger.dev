import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { createExpressServer } from "@trigger.dev/express";
import { z } from "zod";
import { Airtable, Collaborator } from "@trigger.dev/airtable";

export const client = new TriggerClient({
  id: "job-catalog",
  apiKey: process.env["TRIGGER_API_KEY"],
  apiUrl: process.env["TRIGGER_API_URL"],
  verbose: false,
  ioLogLocalEnabled: true,
});

const airtable = new Airtable({
  id: "airtable",
  token: process.env["AIRTABLE_TOKEN"],
});

type Status = "Live" | "Complete" | "In progress" | "Planning" | "In reviews";

type LaunchGoalsAndOkRs = {
  "Launch goals"?: string;
  DRI?: Collaborator;
  Team?: string;
  Status?: "On track" | "In progress" | "At risk";
  "Key results"?: Array<string>;
  "Features (from 💻 Features table)"?: Array<string>;
  "Status (from 💻 Features)": Array<Status>;
};

client.defineJob({
  id: "airtable-example-1",
  name: "Airtable Example 1: getRecords",
  version: "0.1.0",
  trigger: eventTrigger({
    name: "airtable.example",
    schema: z.object({
      baseId: z.string(),
      tableName: z.string(),
    }),
  }),
  integrations: {
    airtable,
  },
  run: async (payload, io, ctx) => {
    const records = await io.airtable
      .base(payload.baseId)
      .table<LaunchGoalsAndOkRs>(payload.tableName)
      .getRecords("muliple records", { fields: ["Status"] });

    await io.logger.log(records[0].fields.Status ?? "no status");

    const aRecord = await io.airtable
      .base(payload.baseId)
      .table<LaunchGoalsAndOkRs>(payload.tableName)
      .getRecord("single", records[0].id);
  },
});

createExpressServer(client);

import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as fs from "fs";
import { InsertAgent } from "../drizzle/schema";
import * as XLSX from "xlsx";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  agents: router({
    importData: publicProcedure.mutation(async () => {
      const count = await db.getAgentCount();
      if (count > 0) {
        return { success: true, message: "Data already imported", imported: 0 };
      }

      try {
        const excelPath = "/home/ubuntu/Agent_List_Final.xlsx";
        if (!fs.existsSync(excelPath)) {
          return { success: false, message: "Source file not found", imported: 0 };
        }

        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        const agentData: InsertAgent[] = data.map((row: any) => ({
          type: row["Type"] || "C",
          agentCode: row["Agent Code"] || "",
          companyName: row["Company Name"] || "",
          address: row["Address"] || "",
          phone: row["Phone"] || "",
          lineCode: row["Line Code"] || "",
          lineName: row["Line Name"] || "",
          rawDetails: row["Raw Details"] || "",
        }));

        await db.insertAgents(agentData);
        return { success: true, message: "Data imported successfully", imported: agentData.length };
      } catch (error) {
        console.error("Import error:", error);
        return { success: false, message: "Import failed", imported: 0 };
      }
    }),

    search: publicProcedure
      .input(
        z.object({
          searchTerm: z.string().optional().default(""),
          typeFilter: z.string().optional().default(""),
          hasLineCode: z.boolean().optional().nullable(),
          page: z.number().optional().default(1),
          pageSize: z.number().optional().default(50),
        })
      )
      .query(async ({ input }) => {
        const offset = (input.page - 1) * input.pageSize;
        const [agents, total] = await Promise.all([
          db.searchAgents(input.searchTerm, input.typeFilter, input.hasLineCode, input.pageSize, offset),
          db.countAgents(input.searchTerm, input.typeFilter, input.hasLineCode),
        ]);
        return {
          agents,
          total,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(total / input.pageSize),
        };
      }),

      getAgentWithLines: publicProcedure
  .input(z.object({ agentCode: z.string() }))
  .query(async ({ input }) => {
    return await db.getAgentWithAllLines(input.agentCode);
  }),

getStats: publicProcedure
  .query(async () => {
    return await db.getTotalStats();
  }),

getById: publicProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    return await db.getAgentById(input.id);
  }),

create: publicProcedure
  .input(
    z.object({
      agentCode: z.string(),
      companyName: z.string(),
      lineCode: z.string().optional(),
      lineName: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      type: z.string().optional().default("DPA"),
      rawDetails: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const result = await db.insertAgents([input]);
    return { success: result > 0, count: result };
  }),

update: publicProcedure
  .input(
    z.object({
      id: z.number(),
      agentCode: z.string().optional(),
      companyName: z.string().optional(),
      lineCode: z.string().optional(),
      lineName: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      type: z.string().optional(),
      rawDetails: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { id, ...updates } = input;
    const success = await db.updateAgent(id, updates);
    return { success };
  }),

delete: publicProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    const success = await db.deleteAgent(input.id);
    return { success };
  }),


    exportCSV: publicProcedure
      .input(
        z.object({
          searchTerm: z.string().optional().default(""),
          typeFilter: z.string().optional().default(""),
          hasLineCode: z.boolean().optional().nullable(),
        })
      )
      .query(async ({ input }) => {
        const agents = await db.searchAgents(input.searchTerm, input.typeFilter, input.hasLineCode, 10000, 0);
        
        const headers = ["Type", "Agent Code", "Company Name", "Address", "Phone", "Line Code", "Line Name"];
        const rows = agents.map((agent: any) => [
          agent.type,
          agent.agentCode,
          agent.companyName,
          agent.address || "",
          agent.phone || "",
          agent.lineCode || "",
          agent.lineName || "",
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
        ].join("\n");

        return { csv: csvContent, count: agents.length };
      }),

    exportExcel: publicProcedure
      .input(
        z.object({
          searchTerm: z.string().optional().default(""),
          typeFilter: z.string().optional().default(""),
          hasLineCode: z.boolean().optional().nullable(),
        })
      )
      .query(async ({ input }) => {
        const agents = await db.searchAgents(input.searchTerm, input.typeFilter, input.hasLineCode, 10000, 0);
        
        const data = agents.map((agent: any) => ({
          Type: agent.type,
          "Agent Code": agent.agentCode,
          "Company Name": agent.companyName,
          Address: agent.address || "",
          Phone: agent.phone || "",
          "Line Code": agent.lineCode || "",
          "Line Name": agent.lineName || "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Agents");

        const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
        return { buffer: buffer.toString("base64"), count: agents.length };
      }),
  }),
});

export type AppRouter = typeof appRouter;

import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, agents, InsertAgent } from "../drizzle/schema";
import { like, or, and, isNotNull, isNull } from "drizzle-orm";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

console.log("DATABASE_URL =", process.env.DATABASE_URL);
console.log("OAUTH_SERVER_URL =", process.env.OAUTH_SERVER_URL);

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAgentCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: agents.id }).from(agents);
  return result.length > 0 ? result[0].count : 0;
}


export async function searchAgents(
  searchTerm: string = "",
  typeFilter: string = "",
  hasLineCode: boolean | null = null,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  let query: any = db.select().from(agents);
  const conditions: any[] = [];

  if (searchTerm) {
    const searchLike = `%${searchTerm}%`;
    conditions.push(
      or(
        like(agents.companyName, searchLike),
        like(agents.agentCode, searchLike),
        like(agents.phone, searchLike),
        like(agents.lineCode, searchLike),        // ← Line Code
        like(agents.lineName, searchLike)         // ← Line Name
      )
    );
  }

  if (typeFilter) {
    conditions.push(eq(agents.type, typeFilter));
  }

  if (hasLineCode === true) {
    conditions.push(isNotNull(agents.lineCode));
  } else if (hasLineCode === false) {
    conditions.push(
      or(
        eq(agents.lineCode, ""),
        isNull(agents.lineCode)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const result = await query.limit(limit).offset(offset);
  return result;
}

export async function countAgents(
  searchTerm: string = "",
  typeFilter: string = "",
  hasLineCode: boolean | null = null
) {
  const db = await getDb();
  if (!db) return 0;

  let query: any = db.select({ count: agents.id }).from(agents);
  const conditions: any[] = [];

  if (searchTerm) {
    const searchLike = `%${searchTerm}%`;
    conditions.push(
      or(
        like(agents.companyName, searchLike),
        like(agents.agentCode, searchLike),
        like(agents.phone, searchLike)
      )
    );
  }

  if (typeFilter) {
    conditions.push(eq(agents.type, typeFilter));
  }

  if (hasLineCode === true) {
    conditions.push(isNotNull(agents.lineCode));
  } else if (hasLineCode === false) {
    conditions.push(
      or(
        eq(agents.lineCode, ""),
        isNull(agents.lineCode)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const result = await query;
  return result.length > 0 ? result[0].count : 0;

};
  // Get agent with all their represented lines
export async function getAgentWithAllLines(agentCode: string) {
  const db = await getDb();
  if (!db) return null;

  const agentRecords = await db
    .select()
    .from(agents)
    .where(eq(agents.agentCode, agentCode));

  if (agentRecords.length === 0) return null;

  const agent = agentRecords[0];
  const lines = agentRecords.map((r) => ({
    lineCode: r.lineCode,
    lineName: r.lineName,
  }));

  return { agent, lines };
}


// Get statistics
export async function getTotalStats() {
  const db = await getDb();
  if (!db) return { totalAgents: 0, uniqueAgents: 0, uniqueLines: 0 };

  const [totalResult, uniqueAgentsResult, uniqueLinesResult] = await Promise.all([
    db.select({ count: sql`COUNT(*)` }).from(agents),
    db.selectDistinct({ agentCode: agents.agentCode }).from(agents),
    db.selectDistinct({ lineCode: agents.lineCode }).from(agents).where(isNotNull(agents.lineCode)),
  ]);

  return {
    totalAgents: (totalResult[0]?.count as number) || 0,
    uniqueAgents: uniqueAgentsResult.length,
    uniqueLines: uniqueLinesResult.length,
  };
}

// Get agent by ID
export async function getAgentById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Update agent
export async function updateAgent(id: number, updates: any) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(agents).set(updates).where(eq(agents.id, id));
    return true;
  } catch (error) {
    console.error("Update error:", error);
    return false;
  }
}

// Delete agent
export async function deleteAgent(id: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(agents).where(eq(agents.id, id));
    return true;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}

// Insert agents (batch)
export async function insertAgents(records: any[]) {
  const db = await getDb();
  if (!db) return 0;

  try {
    await db.insert(agents).values(records);
    return records.length;
  } catch (error) {
    console.error("Insert error:", error);
    return 0;
  }
}



import { eq } from "drizzle-orm";
import { readBookmarks, rememberDuckPlace, type BookmarkGraph } from "@duck-dating/shared";
import type { Db } from "./index";
import * as schema from "./schema";

/**
 * Move bookmarks that still sit on a visit-exit choice forward to the next conversation.
 * Leaves every other bookmark, and never changes the line the player is currently reading.
 */
export async function rewriteExitBookmarks(db: Db, graph: BookmarkGraph): Promise<number> {
  const rows = await db.select().from(schema.playerProgress);
  let updated = 0;
  for (const row of rows) {
    const bookmarks = readBookmarks(row.bookmarks);
    let changed = false;
    const next = { ...bookmarks };
    for (const [characterId, mark] of Object.entries(bookmarks)) {
      const stored = rememberDuckPlace(
        {},
        {
          nodeId: mark.nodeId,
          characterId,
          conversationId: mark.conversationId,
          exchangeCount: mark.exchangeCount,
          consecutiveConversations: mark.consecutiveConversations,
        },
        graph
      )[characterId];
      if (!stored || stored.nodeId === mark.nodeId) continue;
      next[characterId] = stored;
      changed = true;
    }
    if (!changed) continue;
    await db
      .update(schema.playerProgress)
      .set({ bookmarks: next })
      .where(eq(schema.playerProgress.playerId, row.playerId));
    updated += 1;
  }
  return updated;
}

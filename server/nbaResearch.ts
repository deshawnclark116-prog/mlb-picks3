import type { Request, Response } from 'express';
import originalFrozenOpeningWeek from '../docs/nba_v1_opening_week_research.json';
import { parseNbaResearch } from '../src/nba/research.ts';

/**
 * Serve only the already-committed Oct 19 pre-tipoff research snapshot.
 * No ESPN calls at request time, no sportsbook API or odds quota consumption,
 * no regenerated/hindsight predictions, no dependency on mlb-picks2/Render.
 */
export function nbaResearchHandler() {
  return (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=120');
    try {
      return res.json(parseNbaResearch(originalFrozenOpeningWeek));
    } catch (error) {
      console.error('[NBA frozen research] validation failed', error);
      return res.status(503).json({
        error: 'NBA_RESEARCH_UNAVAILABLE',
        details: 'The frozen research artifact failed source/identity/pregame integrity checks.'
      });
    }
  };
}

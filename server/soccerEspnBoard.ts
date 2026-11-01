/** Read-only ESPN live board. AI Studio static clients use the bundled original. */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {Request,Response} from 'express';
export function soccerEspnPlayerBoardHandler(){
 return (_req:Request,res:Response)=>{
  res.setHeader('Cache-Control','no-store');
  try{
   const raw=JSON.parse(readFileSync(resolve(process.cwd(),
     'docs/soccer_player_espn/board.json'),'utf8')) as Record<string,unknown>;
   if(raw.schema!=='soccer-espn-rolling-player-board-v1'||raw.officialPicks!==0||
     !Array.isArray(raw.items))throw Error('Invalid board');
   res.json(raw);
  }catch{
   res.status(503).json({schema:'soccer-espn-rolling-player-board-v1',
     status:'REAL_PREMATCH_ARCHIVE_UNAVAILABLE',items:[],officialPicks:0});
  }
 };
}

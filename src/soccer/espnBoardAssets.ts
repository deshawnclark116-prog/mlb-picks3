/// <reference types="vite/client" />
import frozen from '../../docs/soccer_player_espn/board.json';
import {usableEspnPlayerBoard} from './espnPlayerBoard';
export const savedEspnPlayerBoard=(at:string)=>usableEspnPlayerBoard(frozen,at);

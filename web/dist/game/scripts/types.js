// scripts/types.js
// Chỉ chứa JSDoc typedef để hỗ trợ IDE/AI. KHÔNG thay đổi hành vi runtime.

/**
 * @typedef {{
 *  name: string,
 *  status?: 'active'|'cooldown'|'inactive',
 *  duration?: number,
 *  radius?: number,
 *  stunMs?: number
 * }} SkillState
 */

/**
 * @typedef {{
 *  id?: number|string,
 *  i?: number,
 *  x: number,
 *  y: number,
 *  r?: number,
 *  vx?: number,
 *  vy?: number,
 *  color?: string,
 *  eliminated?: boolean,
 *  draftUntil?: number,
 *  draftMultiplier?: number,
 *  chainStunUntil?: number,
 *  _shockwaveStart?: number,
 *  _shockwaveMaxR?: number,
 *  _chainArcs?: Array<{ fromId: number|string, toId: number|string, until: number, life0?: number }>,
 *  skillState?: SkillState
 * }} Horse
 */

/**
 * @typedef {{ x:number, y:number, r:number }} CircleItem
 */

/**
 * @typedef {{
 *  boosts?: CircleItem[],
 *  turbos?: CircleItem[],
 *  teleports?: CircleItem[],
 *  magnets?: CircleItem[],
 *  timeFreezes?: CircleItem[],
 *  ghosts?: CircleItem[],
 *  traps?: CircleItem[],
 *  rams?: CircleItem[],
 *  shields?: CircleItem[],
 *  carrots?: Array<{x:number,y:number,r?:number,scale?:number,outline?:'on'|'off',outlineColor?:string,outlineWidth?:number,_img?:HTMLImageElement}>,
 *  carrotRadius?: number,
 *  spinners?: Array<{x:number,y:number,w:number,h:number,angle:number,speed:number,color?:string,_trail?:Array<{angle:number,ts:number}>,_flashUntil?:number,_flashStrength?:number}>,
 *  belts?: Array<{x:number,y:number,w:number,h:number,dir?:'N'|'S'|'E'|'W',angle?:number,speed?:number}>,
 *  spawnPoints?: Array<{x:number,y:number,angle:number}>,
 *  fans?: Array<{x:number,y:number,r:number,angle:number,spread:number,strength:number}>,
 *  bumpers?: Array<{x:number,y:number,r:number,e:number,noise?:number,color?:string}>,
 *  walls?: any[],
 *  arcs?: any[],
 *  brushes?: any[]
 * }} MapDef
 */

// Không export gì; đây chỉ là chú thích để trình phân tích kiểu hiểu các cấu trúc dữ liệu.

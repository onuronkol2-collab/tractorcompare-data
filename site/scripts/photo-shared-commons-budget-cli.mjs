/** Shared state bridge for the Python binary acquisition lane. No network. */
import {reserveSharedCommons,pauseSharedCommons} from './photo-shared-commons-budget.mjs';
const [action,seconds,...extra]=process.argv.slice(2);
if(extra.length || !process.env.TRACTORVS_COMMONS_BUDGET_FILE || process.env.TRACTORVS_SHARED_COMMONS_LANE!=='1') throw Error('trusted shared lane and existing checkpoint required');
if(action==='reserve' && seconds===undefined){
 console.log(JSON.stringify(await reserveSharedCommons()));
}else if(action==='pause' && /^\d+$/.test(seconds||'')){
 const ms=Number(seconds)*1000;
 if(!Number.isSafeInteger(ms)||ms<1000)throw Error('invalid pause');
 await pauseSharedCommons(ms);
 console.log(JSON.stringify({paused:true}));
}else throw Error('invalid budget command');

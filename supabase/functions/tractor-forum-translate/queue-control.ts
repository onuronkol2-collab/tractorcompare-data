/**
 * Emergency opt-in lock for real forum translation queue processing.
 * A mere GitHub workflow ONAY or accidentally entered input NEVER enables
 * paid-capable provider usage. Only a separate Supabase admin-controlled
 * secret set exactly to "true" opens the queue.
 *
 * OFF-by-default is intentional; "false", "TRUE", absent and empty all deny.
 */
export function isForumQueueProcessingEnabled(value:string|null|undefined):boolean{
 return value==="true";
}

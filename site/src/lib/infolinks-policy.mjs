export const INFOLINKS_PID = 3450022;
export const INFOLINKS_WSID = 0;
export const INFOLINKS_SRC = 'https://resources.infolinks.com/js/infolinks_main.js';
export const AD_CHOICE_KEY = 'tractorvs_infolinks_choice_v1';
export function isInfolinksRoute(path) {
  return /^\/tractors\/[a-z0-9][a-z0-9-]*\/$/.test(path);
}
export function isInfolinksAllowed({enabled,origin,eligible,search,hash,choice}) {
  return enabled === true && origin === 'https://tractorvs.com' && eligible === true &&
    search === '' && hash === '' && choice === 'accepted';
}

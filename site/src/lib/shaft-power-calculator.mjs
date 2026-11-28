/** Mechanical rotation at a SINGLE shaft and operating point. Not a model
 * measurement, driveline efficiency estimate or equipment fitment calculation. */
function positive(v,max){if(typeof v!=="number"||!Number.isFinite(v)||v<=0||v>max)throw new RangeError("Invalid input");return v;}
export function shaftPowerAtPoint(torqueNm,rpm){
 const t=positive(torqueNm,1e6),n=positive(rpm,1e5);
 const kw=t*n*(2*Math.PI/60000);
 if(!Number.isFinite(kw)||kw<=0)throw new RangeError("Unrepresentable output");
 return {kw,hp:kw/0.7456998715822702,ps:kw/0.73549875};
}
export function shaftTorqueAtPoint(kw,rpm){
 const p=positive(kw,1e7),n=positive(rpm,1e5);
 const nm=p/(n*(2*Math.PI/60000));
 if(!Number.isFinite(nm)||nm<=0)throw new RangeError("Unrepresentable output");
 return nm;
}

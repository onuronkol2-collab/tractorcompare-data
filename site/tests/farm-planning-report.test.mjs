import test from "node:test";
import assert from "node:assert/strict";
import {buildPlanningReport} from "../src/lib/farm-planning-report.mjs";
test("plain report retains limitations, unknown and signed results",()=>{
 const out=buildPlanningReport("Sahiplik","Kendi tahmininiz.",[{title:"1 yıl",entries:[["Maliyet farkı","−100"],["Alan","Bilgi yok"]]}]);
 assert.equal(out,"TractorVS — Sahiplik\n\nKendi tahmininiz.\n\n1 yıl\nMaliyet farkı: −100\nAlan: Bilgi yok\n");
});
test("rejects malformed or unbounded report data",()=>{
 for(const blocks of [[],Array(2),[{title:"",entries:Array(1)}],[{title:"",entries:[["x","\u0000"]]}]])assert.throws(()=>buildPlanningReport("Plan","Limit",blocks));
 assert.throws(()=>buildPlanningReport("x".repeat(501),"Limit",[{title:"",entries:[["x","1"]]}]));
});

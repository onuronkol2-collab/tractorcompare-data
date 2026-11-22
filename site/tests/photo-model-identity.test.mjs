import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {matchesPhotoFileModel as matches} from "../scripts/photo-model-identity.mjs";

test("title matcher accepts exact photographed tractor model tokens",()=>{
  for(const [brand,model,file] of [
    ["Valtra","Q265","File:Valtra Q265 agra 2024 (DSC03934).jpg"],
    ["Başak Traktör","5120","File:Başak 5120 Red Power Agritechnica 2023.jpg"],
    ["McCormick","X5.100","File:McCormick X5.100 Agritechnica 2025.jpg"],
    ["John Deere","5075E","File:John_Deere_5075E_at_fair.jpg"],
    ["Landini","5-110","File:Landini 5-110 RoboShift at fair.jpg"],
    ["Deutz-Fahr","6165","File:Deutz-Fahr 6165 TTV.jpg"],
    ["Antonio Carraro","TTR 3800 HST II","File:Antonio Carraro TTR 3800 HST II.JPG"],
    ["TYM","T475","File:TYM T475 tractor.jpg"],
    ["SAME","FRUTTETO","File:SAME Frutteto tractor.jpg"]
  ])assert.equal(matches(brand,model,file),true,brand+" "+model+": "+file);
});
test("title matcher rejects historical nontractor and model-variant false positives",()=>{
  for(const [brand,model,file] of [
    ["Belarus","152","File:1996. Stamp of Belarus 0152.jpg"],
    ["Swaraj","717","File:Around and near Anand Bhavan, Swaraj Bhavan, Allahabad, IRCTC 2017 (17).jpg"],
    ["Agrale","525","File:Ruta 8714 010525 E. Zevallos S.A. Modasa Apolo Agrale MA 9.0 TCA.jpg"],
    ["McCormick","X6.4","File:McCormick X6.414 P6-Drive Agritechnica 2023.jpg"],
    ["McCormick","X5.100","File:McCormick X5.100 HC tractor.jpg"],
    ["Landini","5-110","File:Landini 5-110 HC Agritechnica 2023.jpg"],
    ["TYM","T475","File:TYM T475C Agritechnica 2023.jpg"],
    ["Valtra","Q265","File:Valtra Q2650 tractor.jpg"],
    ["John Deere","5075E","File:Case IH 5075E.jpg"],
    ["Belarus","82.1","File:Belarus 82.10.jpg"],
    ["McCormick","X4","File:McCormick X4.085 TM Agritechnica 2023.jpg"],
    ["McCormick","X4","File:McCormick X4 TM at agritechnica.jpg"],
    ["McCormick","X5","File:McCormick X5.110 HC tractor.jpg"],
    ["McCormick","X6","File:McCormick X6.414 P6-Drive tractor.jpg"],
    ["SAME","FRUTTETO","File:SAME Frutteto 80.4 Natural.jpg"],
    ["Steyr","PLUS","File:Steyr 4120 Plus Agritechnica 2025.jpg"],
    ["New Holland","T5.110","File:New Holland T5.1100 tractor.jpg"]
  ])assert.equal(matches(brand,model,file),false,brand+" "+model+": "+file);
});
test("archival and published model pipelines use the SAME conservative title matcher",()=>{
  const archive=readFileSync(new URL("../scripts/archive-brand-photo-discovery.mjs",import.meta.url),"utf8");
  const index=readFileSync(new URL("../scripts/photo-archive-candidate-index.mjs",import.meta.url),"utf8");
  const published=readFileSync(new URL("../scripts/batch-photo-discovery.mjs",import.meta.url),"utf8");
  assert.match(archive,/import\s+\{matchesPhotoFileModel\}\s+from\s+"\.\/photo-model-identity\.mjs"/);
  assert.match(archive,/matchesPhotoFileModel\(/);
  assert.match(index,/import\s+\{matchesPhotoFileModel\}\s+from\s+"\.\/photo-model-identity\.mjs"/);
  assert.match(index,/matchesPhotoFileModel\(/);
  assert.match(published,/archiveCandidatesForModel\(archiveIndex,entry\)/);
});

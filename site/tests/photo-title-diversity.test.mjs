import test from "node:test";
import assert from "node:assert/strict";
import {selectDiversePhotoTitles} from "../scripts/photo-title-diversity.mjs";
test("crowded model results cannot starve a less photographed model under the same cap",()=>{
 const titles=[...Array.from({length:100},(_,i)=>"File:TYM T475 tractor photo "+i+".jpg"),"File:TYM T575 tractor.jpg","File:TYM T255 tractor.jpg","File:TYM T475C tractor.jpg"];
 const result=selectDiversePhotoTitles("TYM",[{model:"T3047"},{model:"T4057"},{model:"T1025"}],titles,3);
 assert.deepEqual(result,[titles[0],titles[100],titles[101]]);
 assert.equal(selectDiversePhotoTitles("TYM",[{model:"T3047"}],titles,90).length,90);
});

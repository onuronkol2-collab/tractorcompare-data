import test from "node:test";
import assert from "node:assert/strict";
import {manufacturerPhotoAlias,matchesManufacturerPhotoAlias} from "../scripts/photo-model-aliases.mjs";

test("only the manufacturer-confirmed TYM identity aliases are searched",()=>{
  assert.equal(manufacturerPhotoAlias("TYM","T1025"),"T255");
  assert.equal(manufacturerPhotoAlias("TYM","T3047"),"T475");
  assert.equal(manufacturerPhotoAlias("TYM","T4057"),"T575");
  assert.equal(manufacturerPhotoAlias("TYM","T6130"),null);
  assert.equal(manufacturerPhotoAlias("Landini","5-120"),null);
});
test("never confuse differently equipped, suffixed or neighboring photo filenames",()=>{
  assert.equal(matchesManufacturerPhotoAlias("TYM","T3047","File:TYM T475 Agritechnica 2025.jpg"),true);
  assert.equal(matchesManufacturerPhotoAlias("TYM","T3047","File:TYM T475C Agritechnica 2023.jpg"),false);
  assert.equal(matchesManufacturerPhotoAlias("TYM","T3047","File:TYM T4750.jpg"),false);
  assert.equal(matchesManufacturerPhotoAlias("TYM","T3047","File:TYM T475-D.jpg"),true);
  assert.equal(matchesManufacturerPhotoAlias("TYM","T3047","File:TYM T575.jpg"),false);
  assert.equal(matchesManufacturerPhotoAlias("TYM","T3047","File:Unrelated T475.jpg"),false);
  assert.equal(matchesManufacturerPhotoAlias("TYM","T1025","File:TYM_T255_front.jpeg"),true);
  assert.equal(matchesManufacturerPhotoAlias("TYM","T1025","File:TYM_T25_front.jpeg"),false);
  assert.equal(matchesManufacturerPhotoAlias("TYM","T4057","File:TYM T575C tractor.jpg"),false);
});

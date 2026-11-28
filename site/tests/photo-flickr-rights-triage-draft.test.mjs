import test from 'node:test';
import assert from 'node:assert/strict';
import {triageFlickrLicenseId} from '../scripts/photo-flickr-rights-triage-draft.mjs';
test('PDM is not CC0',()=>{assert.equal(triageFlickrLicenseId(10).status,'public_domain_mark_review');assert.equal(triageFlickrLicenseId(9).status,'license_candidate');});
test('NC, ND, unknown and all-rights-reserved remain held',()=>{for(const id of [0,1,2,3,6,13,14,15,16,99,'Public domain',null])assert.equal(triageFlickrLicenseId(id).status,'held');});
test('no metadata result authorizes publication',()=>{for(let id=0;id<=16;id++)assert.equal(triageFlickrLicenseId(id).publicationAuthorized,false);});

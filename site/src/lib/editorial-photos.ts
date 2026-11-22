import {APPROVED_TRACTOR_PHOTOS} from "./tractor-photos.ts";
import {TECHNICAL_DEEP_DIVES} from "./tractor-technical-deep-dives.ts";

function approvedPhoto(brand:string,model:string){
 const photo=APPROVED_TRACTOR_PHOTOS.find(item=>item.brand===brand && item.model===model);
 if(!photo)throw new Error("Missing approved editorial photo for "+brand+" "+model);
 return photo;
}

export const glossaryHero=approvedPhoto("New Holland","T5.110");
export const glossaryShowcase=[
 approvedPhoto("Case IH","Puma 150"),
 approvedPhoto("McCormick","X5.120 P3-Drive")
];
export const guidePhotos=new Map(TECHNICAL_DEEP_DIVES.map(guide=>[
 guide.slug,approvedPhoto(guide.heroPhoto.brand,guide.heroPhoto.model)
] as const));

export const editorialImagePages=new Map<string,readonly (typeof glossaryHero)[]>();
for(const prefix of ["","/tr"]){
 editorialImagePages.set(prefix+"/guides/tractor-technical-terms/",[glossaryHero,...glossaryShowcase]);
 for(const [slug,photo] of guidePhotos)
  editorialImagePages.set(prefix+"/guides/"+slug+"/",[photo]);
}

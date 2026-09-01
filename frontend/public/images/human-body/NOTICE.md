# Human body images — source and licensing

All `.jpg` files in this folder are anatomical illustrations from Wikimedia
Commons, resized/re-compressed for the app (max width 700px, JPEG quality
78, flattened onto a white background) with `sharp`. Original files were
PNG/JPEG; only image dimensions and compression changed — no content was
altered, cropped, or relabelled. Each original file page is linked below
alongside its license as recorded in Commons' `extmetadata` at the time of
download (2026-09-01).

Public-domain works need no attribution to be used, but the original
authors are credited anyway as good practice. CC BY 3.0 works are
attributed here to satisfy the license.

| File | Original | Author | License | Source |
|---|---|---|---|---|
| `brain.jpg` | Blausen_0101_Brain_LateralView.png | BruceBlaus | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Blausen_0101_Brain_LateralView.png |
| `heart.jpg` | Blausen_0451_Heart_Anterior.png | Blausen Medical Communications, Inc. | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Blausen_0451_Heart_Anterior.png |
| `lungs.jpg` | Illu_bronchi_lungs.jpg | U.S. National Cancer Institute (SEER Program) | Public domain (US government work) | https://commons.wikimedia.org/wiki/File:Illu_bronchi_lungs.jpg |
| `stomach.jpg` | Gray1050-stomach.png | Henry Vandyke Carter, in Gray's Anatomy (1918) | Public domain (copyright expired) | https://commons.wikimedia.org/wiki/File:Gray1050-stomach.png |
| `liver.jpg` | Blausen_0616_Liver_Location.png | BruceBlaus | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Blausen_0616_Liver_Location.png |
| `kidneys.jpg` | Blausen_0592_KidneyAnatomy_01.png | BruceBlaus | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Blausen_0592_KidneyAnatomy_01.png |
| `intestines.jpg` | Blausen_0817_SmallIntestine_Anatomy.png | BruceBlaus | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Blausen_0817_SmallIntestine_Anatomy.png |
| `bladder.jpg` | Illu_bladder.jpg | U.S. National Cancer Institute (SEER Program) | Public domain (US government work) | https://commons.wikimedia.org/wiki/File:Illu_bladder.jpg |
| `skin.jpg` | Illu_skin02.jpg | U.S. National Cancer Institute (SEER Program) | Public domain (US government work) | https://commons.wikimedia.org/wiki/File:Illu_skin02.jpg |
| `skull.jpg` | Gray188.png | Henry Vandyke Carter, in Gray's Anatomy (1918) | Public domain (copyright expired) | https://commons.wikimedia.org/wiki/File:Gray188.png |
| `spine.jpg` | Gray 111 - Vertebral column-coloured.png | Henry Vandyke Carter (colourised by Uwe Gille) | Public domain (copyright expired) | https://commons.wikimedia.org/wiki/File:Gray_111_-_Vertebral_column-coloured.png |
| `ribs.jpg` | Gray113.png | Henry Vandyke Carter, in Gray's Anatomy (1918) | Public domain (copyright expired) | https://commons.wikimedia.org/wiki/File:Gray113.png |
| `clavicle.jpg` | Gray202.png | Henry Vandyke Carter, in Gray's Anatomy (1918) | Public domain (copyright expired) | https://commons.wikimedia.org/wiki/File:Gray202.png |
| `pelvis.jpg` | Blausen_0723_Pelvis.png | BruceBlaus | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Blausen_0723_Pelvis.png |
| `femur.jpg` | Long_Bone_(Femur).png | BruceBlaus | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Long_Bone_(Femur).png |
| `humerus.jpg` | Long_Bone_(Humerus).png | BruceBlaus | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Long_Bone_(Humerus).png |
| `knee.jpg` | Blausen_0596_KneeAnatomy_Front.png | BruceBlaus | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Blausen_0596_KneeAnatomy_Front.png |
| `achilles.jpg` | Gray401.png | Henry Vandyke Carter, in Gray's Anatomy (1918) | Public domain (copyright expired) | https://commons.wikimedia.org/wiki/File:Gray401.png |

No graphic/gory photographs of dissected tissue were used — every image is
a professionally-produced anatomical diagram/illustration, consistent with
this being a children's educational app. Images are shared across all 8
language JSON files (`frontend/src/content/humanBody.*.json`); only the
`label`/`shortExplain`/`detailedExplain` text differs per language, so each
file above is stored once, not once per language.

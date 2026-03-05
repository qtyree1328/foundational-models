# GeoFM Explorer — Case Study Specification

*Generated 2026-03-04. Full audit of all explorer events with implementation details.*

---

## Platform Constraints

- **AlphaEarth Embeddings:** 2017–2024, annual composites, 64 dimensions, 10m resolution, global land surface
- **Annual composites = full year integration.** Not suitable for isolating short-lived events (floods, fires) within a single year unless using beforeMonth/afterMonth for optical imagery comparison alongside the annual embedding
- **Not all case studies need before/after dates.** Single-year analysis (clustering, classification, similarity) is valid and often more appropriate
- **GEE Proxy:** Serves AlphaEarth tiles, optical (Sentinel-2), CDL, dNBR, clustering, change detection

---

## ✅ KEEP — Verified Case Studies

### 1. Creek Fire 2020
| Field | Value |
|-------|-------|
| **id** | `creek-fire` |
| **category** | fire |
| **coords** | [-119.3, 37.2] |
| **zoom** | 10 |
| **bbox** | [-119.6, 37.0, -119.0, 37.5] |
| **beforeYear** | 2020 |
| **afterYear** | 2020 |
| **beforeMonth** | 8 (August — pre-fire) |
| **afterMonth** | 11 (November — post-fire) |
| **source** | CAL FIRE / Sierra RCD |
| **sourceUrl** | https://sierrarcd.com/creekfirerecovery/ |
| **question** | Can FM identify burn scars without fire-specific training? |

**Why selected:** Creek Fire started Sep 4, 2020, burned 379,895 acres in Sierra National Forest. One of CA's largest. Clear before/after within same year.  
**Layers:** before (Aug optical), after (Nov optical), change (2019→2020 embeddings), dNBR, AlphaEarth embeddings, clusters  
**Bands:** Default works; vegetation preset may highlight burn/unburned contrast  
**Date accuracy:** ✅ Perfect. Fire started Sep 4, beforeMonth=8 captures pre-fire, afterMonth=11 captures post-fire.  
**Notes:** Annual embeddings for 2020 will include both pre- and post-fire pixels. The month-specific optical imagery is what enables true before/after comparison. dNBR from Sentinel-2 provides ground truth.

---

### 2. Camp Fire 2018 (Paradise)
| Field | Value |
|-------|-------|
| **id** | `camp-fire` |
| **category** | fire |
| **coords** | [-121.6, 39.76] |
| **zoom** | 11 |
| **bbox** | [-121.8, 39.6, -121.4, 39.9] |
| **beforeYear** | 2018 |
| **afterYear** | 2018 |
| **beforeMonth** | 10 (October — pre-fire) |
| **afterMonth** | 12 (December — post-fire) |
| **source** | CAL FIRE |
| **sourceUrl** | https://www.fire.ca.gov/incidents/2018/11/8/camp-fire/ |
| **question** | Does embedding change correlate with burn severity (dNBR)? |

**Why selected:** Deadliest CA wildfire (85 deaths), destroyed Paradise. Ignited Nov 8, 2018, burned 153,336 acres. Iconic event with strong visual contrast — entire town destroyed.  
**Layers:** before (Oct optical), after (Dec optical), change (2017→2018 or 2018→2019 embeddings), dNBR, AlphaEarth, clusters  
**Bands:** Default RGB  
**Date accuracy:** ✅ Tight and correct. Oct pre-fire, Dec post-fire.  
**Notes:** Compare annual embedding change (2017→2019 may show more than 2018 alone since fire was late in year). dNBR correlation question is strong — can quantitatively compare embedding distance vs dNBR values.

---

### 3. Iowa Corn Belt
| Field | Value |
|-------|-------|
| **id** | `iowa-corn` |
| **category** | agriculture |
| **coords** | [-93.5, 42.0] |
| **zoom** | 10 |
| **bbox** | [-94.0, 41.5, -93.0, 42.5] |
| **beforeYear** | 2022 |
| **afterYear** | 2022 |
| **yearSelectable** | true |
| **availableYears** | [2019, 2020, 2021, 2022, 2023] |
| **source** | USDA NASS Cropland Data Layer |
| **sourceUrl** | https://nassgeodata.gmu.edu/CropScape/ |
| **question** | How does a general FM compare to a specialized crop model (CDL)? |

**Why selected:** Heart of US corn/soybean production. CDL provides supervised ground truth at 30m for direct comparison. Core FM validation — can unsupervised embeddings match a purpose-trained classifier?  
**Layers:** AlphaEarth embeddings, CDL overlay, clusters (K-means on 64 dims), optical  
**Bands:** Default RGB; vegetation preset may reveal crop type distinctions  
**Date accuracy:** ✅ Single-year analysis. Year selector allows multi-year comparison. CDL available for all years.  
**Notes:** This is NOT a change detection study. It's a single-year classification comparison. The slider between CDL↔AlphaEarth is the key UX element. No beforeMonth/afterMonth needed — annual embeddings are perfect for agricultural phenology.

---

### 4. Amazon Rondônia
| Field | Value |
|-------|-------|
| **id** | `amazon-rondonia` |
| **category** | deforestation |
| **coords** | [-63.0, -10.5] |
| **zoom** | 9 |
| **bbox** | [-63.5, -11.0, -62.5, -10.0] |
| **beforeYear** | 2018 |
| **afterYear** | 2022 |
| **source** | INPE PRODES |
| **sourceUrl** | http://terrabrasilis.dpi.inpe.br/app/dashboard/deforestation/biomes/legal_amazon/rates |
| **question** | Can FM reveal forest degradation gradients using process vectors? |

**Why selected:** Classic fishbone deforestation along roads, monitored by Brazil's INPE since 1988. 4-year span (2018→2022) captures significant clearing. Annual embeddings ideal for gradual change.  
**Layers:** before (2018 embeddings), after (2022 embeddings), change, optical, degradation (process vector projection), clusters  
**Bands:** Vegetation preset for forest/non-forest; default for overall patterns  
**Date accuracy:** ✅ Multi-year change. Both years within AlphaEarth range.  
**Notes:** Process vector approach: compute mean embedding for "known deforested" pixels, project all pixels onto that vector. Red = high similarity to deforestation signature. This is a strong FM-native technique.

---

### 5. Philadelphia (Element 84 Study)
| Field | Value |
|-------|-------|
| **id** | `philadelphia-urban` |
| **category** | urban |
| **coords** | [-75.16, 39.95] |
| **zoom** | 11 |
| **bbox** | [-75.28, 39.87, -75.04, 40.03] |
| **beforeYear** | 2018 |
| **afterYear** | 2024 |
| **source** | Element 84 Research |
| **sourceUrl** | https://element84.com/machine-learning/exploring-alphaearth-embeddings/ |
| **question** | Can we validate Element 84's dimension discoveries (airports, tall buildings)? |

**Why selected:** Element 84's Dec 2025 blog used Philadelphia as primary analysis site. Discovered: dim 26 = airports, dims 6/20/24 = tall buildings, dim 51 = industrial areas. Also used for change detection (2018→2024).  
**Layers:** AlphaEarth embeddings (try all band presets), change (2018→2024), optical, clusters  
**Bands:** Airport preset (A26, A16, A09), Buildings preset (A06, A20, A24), Industrial preset (A51, A16, A09), Default  
**Date accuracy:** ✅ Updated to match Element 84's analysis years (2018 and 2024).  
**Notes:** This bbox is wide enough to include PHL airport — no need for a separate airport entry. The band presets ARE the case study here. Also note Element 84's observation: dims 0 and 62 distinguish West Philly street grid angles.

**⚠️ Change from current:** Update `beforeYear` from 2022 to 2018 and `afterYear` from 2024 stays. Add sourceUrl.

---

### 6. GERD Dam (Great Ethiopian Renaissance Dam)
| Field | Value |
|-------|-------|
| **id** | `gerd-dam` |
| **category** | urban |
| **coords** | [35.09, 11.22] |
| **zoom** | 12 |
| **bbox** | [35.0, 11.15, 35.2, 11.30] |
| **beforeYear** | 2018 |
| **afterYear** | 2024 |
| **source** | Element 84 AlphaEarth Analysis |
| **sourceUrl** | https://element84.com/machine-learning/exploring-alphaearth-embeddings/ |
| **question** | Can embeddings detect major infrastructure and water impoundment changes? |

**Why selected:** Used by Element 84 as change detection example alongside Starbase TX and Julius Nyerere Dam. Africa's largest hydroelectric project — massive landscape transformation (dam construction + reservoir filling).  
**Layers:** before (2018 embeddings), after (2024 embeddings), change, optical  
**Bands:** Default RGB; Water Focus preset for reservoir extent  
**Date accuracy:** ✅ Updated afterYear to 2024 to match Element 84's analysis.  
**Notes:** Pure change detection case study. Embedding difference should show construction footprint + water impoundment clearly.

**⚠️ Change from current:** Update `afterYear` from 2023 to 2024. Widen bbox slightly to capture reservoir.

---

## 🆕 ADD — Maine Forest Carbon (Renoster)

### 7. Maine Forest Carbon & Height Mapping
| Field | Value |
|-------|-------|
| **id** | `maine-forest-carbon` |
| **category** | deforestation (or new category: `forestry`) |
| **coords** | [-69.0, 45.3] |
| **zoom** | 7 |
| **bbox** | [-71.1, 43.0, -66.9, 47.5] |
| **beforeYear** | 2024 |
| **afterYear** | 2024 |
| **source** | Renoster / Google Earth Blog |
| **sourceUrl** | https://medium.com/google-earth/improved-forest-carbon-estimation-with-alphaearth-foundations-and-airborne-lidar-data-af2d93e94c55 |
| **question** | Can AlphaEarth embeddings predict forest canopy height when combined with LiDAR training data? |

**Why selected:** Published Feb 4, 2026 by Renoster on Google Earth Medium. Real production use case — they use AlphaEarth + USGS 3DEP LiDAR to map forest height and aboveground biomass across Maine for carbon offset verification. This is NOT a change detection study — it's a single-year regression/prediction task.  
**Layers:** AlphaEarth 2024 embeddings, optical, clusters (K-means reveals forest type groupings)  
**Bands:** Vegetation preset primary; default secondary  
**Date accuracy:** ✅ Single year (2024). No before/after needed.  

**Implementation — Can we derive canopy height on the map?**

The Renoster workflow:
1. Sample 5,000 forested points across Maine
2. Extract LiDAR-derived canopy height (from USGS 3DEP, 95th percentile returns) at each point
3. Extract coincident AlphaEarth embedding (64 dims) at each point
4. Train ElasticNet regression: embeddings → canopy height
5. Deploy model in GEE to predict height everywhere

**What we could show on the map:**
- **Option A (lightweight):** Show AlphaEarth embeddings + K-means clustering. Clusters naturally separate forest types (hardwood, softwood, mixed). Annotate that "Renoster showed these embedding patterns predict canopy height with R² ~ X"
- **Option B (GEE proxy extension):** Add a new layer type that runs the trained model server-side. The Renoster tutorial provides the full model code: https://github.com/JohnKilbride/GEE_MediumBlog_Logic — specifically `02_fit_elasticnet_model.ipynb` for training and `03_create_prediction_map.js` for GEE deployment. The GEE proxy could serve prediction tiles.
- **Option C (pre-computed):** Use Renoster's GEE deployment script to generate a single prediction image for Maine, export as COG, serve as static tiles

**Recommended:** Option A for now (embeddings + clustering + annotation). Option B if you want the full canopy height layer — would require adding the ElasticNet model to the GEE proxy.

**GEE Code Links (from Renoster):**
- Visualize LiDAR height map: https://code.earthengine.google.com/9487a247612e6f9c95f6176d69357c9d
- Sampling script: https://code.earthengine.google.com/31bff17e835ce8d73c07b884d0459d2d
- GitHub (full pipeline): https://github.com/JohnKilbride/GEE_MediumBlog_Logic

---

## ❌ REMOVE — No Real Case Study

### Philadelphia Airport
**Reason:** Redundant with Philadelphia main entry. Element 84 analyzed the airport as PART OF the Philadelphia study, not separately. The wider Philadelphia bbox already includes PHL airport. Users can zoom in and use the Airport band preset.

### Phoenix Urban Expansion  
**Reason:** No published analysis. "US Census" is not an RS source. Valid hypothesis but not a documented case study. No detail, no sourceUrl.

### Singapore Changi Airport
**Reason:** Speculative — "let's see if dim 26 works here." No published analysis. If tested and validated, could be re-added with results.

### Port of Rotterdam
**Reason:** Dims 41 and 48 for transport/coastal are unverified claims — Element 84 did NOT identify these dimensions. No published source.

---

## ⚠️ FIX OR REMOVE — Needs Work

### CA Central Valley
**Current problem:** Overlaps Iowa without adding distinct value. No specific event, no detail, no sourceUrl.

**Fix option:** Reframe around the **2021-2022 California drought** — one of the worst on record. Before=2019 (normal water year), after=2022 (extreme drought). Question: "Can embeddings detect drought stress and fallowed fields without drought-specific training?" Source: CA DWR drought monitoring. This gives it a unique angle separate from Iowa.

| Field | Value |
|-------|-------|
| **id** | `ca-central-valley` |
| **coords** | [-120.5, 37.0] |
| **zoom** | 9 |
| **bbox** | [-121.0, 36.5, -120.0, 37.5] |
| **beforeYear** | 2019 |
| **afterYear** | 2022 |
| **source** | CA Dept of Water Resources |
| **sourceUrl** | https://water.ca.gov/Water-Basics/Drought |
| **question** | Can embeddings detect drought stress and fallowed fields without drought-specific training? |

**If not worth fixing:** Remove. Iowa covers agriculture sufficiently.

---

### Cocoa Plantations, Ghana
**Current problem:** Source attribution is misleading. Airbus + Barry Callebaut use Airbus Starling (Pléiades), NOT AlphaEarth. Dim 12 = agriculture is unverified.

**Fix option:** Reframe as a test of AlphaEarth in tropical agriculture — does embedding clustering distinguish cocoa plantations from surrounding forest? Drop the dim 12 claim and Airbus/Barry Callebaut attribution. Source could be general cocoa belt geography.

| Field | Value |
|-------|-------|
| **id** | `cocoa-farms-ghana` |
| **coords** | [-1.85, 6.15] |
| **zoom** | 12 |
| **bbox** | [-1.95, 6.05, -1.75, 6.25] |
| **beforeYear** | 2023 |
| **afterYear** | 2023 |
| **source** | Exploratory analysis |
| **question** | Can embedding clustering distinguish cocoa plantations from surrounding tropical forest? |

**If not worth fixing:** Remove. It's speculative without published AlphaEarth results for this region.

---

### Hurricane Harvey 2017
**Current problem:** Annual embeddings integrate the full year, so 2017 embedding already includes the hurricane. Before/after comparison is questionable with annual composites. Element 84 explicitly notes: "this approach will likely not work as well for short-lived phenomena such as floods or wildfires."

**Fix option:** Reframe as **recovery tracking** over multiple years. Before=2017 (hurricane year), after=2019 or 2020 (recovery). Question: "Can annual embeddings track post-flood urban and ecological recovery?" This avoids the within-year problem.

| Field | Value |
|-------|-------|
| **id** | `harvey-houston` |
| **coords** | [-95.4, 29.76] |
| **zoom** | 10 |
| **bbox** | [-95.8, 29.4, -95.0, 30.1] |
| **beforeYear** | 2017 |
| **afterYear** | 2020 |
| **source** | NOAA National Hurricane Center |
| **sourceUrl** | https://www.weather.gov/crp/hurricane_harvey |
| **question** | Can annual embeddings track post-flood urban and ecological recovery over multiple years? |

**If not worth fixing:** Remove. Floods are a weak case for annual embeddings (Element 84 said so explicitly).

---

## Final Recommended Event List (10 events)

| # | Name | Category | Type | Years |
|---|------|----------|------|-------|
| 1 | Creek Fire 2020 | fire | change detection (monthly optical) | 2020 |
| 2 | Camp Fire 2018 | fire | change detection (monthly optical) | 2018 |
| 3 | Iowa Corn Belt | agriculture | single-year classification | 2019-2023 |
| 4 | Amazon Rondônia | deforestation | multi-year change | 2018→2022 |
| 5 | Philadelphia | urban | dimension analysis + change | 2018→2024 |
| 6 | GERD Dam | urban/infrastructure | multi-year change | 2018→2024 |
| 7 | Maine Forest Carbon | forestry | single-year prediction | 2024 |
| 8 | CA Central Valley* | agriculture/drought | multi-year change | 2019→2022 |
| 9 | Cocoa Ghana* | agriculture | single-year clustering | 2023 |
| 10 | Hurricane Harvey* | flooding/recovery | multi-year change | 2017→2020 |

*Items 8-10 optional — keep if you want breadth, remove if you want only verified case studies.

---

## Band Preset Reference

From Element 84 research (verified):
| Preset | Dims (R,G,B) | What it shows | Source |
|--------|-------------|---------------|--------|
| Default | A01, A16, A09 | General urban/land use | Google tutorial |
| Buildings | A06, A20, A24 | Tall buildings | Element 84 (Philadelphia) |
| Airport | A26, A16, A09 | Airport runways | Element 84 (Philadelphia, Boston, Lisbon) |
| Industrial | A51, A16, A09 | Industrial areas | Element 84 (Philadelphia) |

**Unverified presets (our additions):**
| Preset | Dims | Status |
|--------|------|--------|
| Water Focus | A08, A32, A48 | Not published — our hypothesis |
| Vegetation | A12, A28, A44 | Not published — our hypothesis |

These should be labeled as "experimental" in the UI to distinguish from verified presets.

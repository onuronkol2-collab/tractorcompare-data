import type { Locale } from "./locales.ts";

/**
 * Public, exact-source-heading display translations. The original technical
 * values, standard, equipment variant, model and citations are NEVER altered.
 * 80 distinct Turkish residual headings were reconciled against the 379-model
 * live public-content audit of 2026-11-21 (101 total appearances).
 * Glossary terms can contain verified model-specific qualifiers; never collapse
 * manufacturer-stated power to a measured/rated value, or swap 2WD with 4WD.
 */
export const RESIDUAL_PUBLIC_SPEC_TERMS: Record<string, Partial<Record<Locale,string>>> = {
  "Clutch": {
    "tr": "Debriyaj"
  },
  "Clutch (Exact Listed Mahabali RX 2WD/4WD Trims)": {
    "tr": "Debriyaj (listelenen Mahabali RX 2WD/4WD donanımları)"
  },
  "Cylinder Bore": {
    "tr": "Silindir çapı"
  },
  "Engine Cooling": {
    "tr": "Motor soğutma sistemi"
  },
  "Four-Wheel-Drive Engagement": {
    "tr": "Dört çekerin (4WD) devreye alınması"
  },
  "Front Agricultural Tires": {
    "tr": "Ön tarım lastikleri"
  },
  "Front Tire Size": {
    "tr": "Ön lastik ölçüsü"
  },
  "Gear Count": {
    "tr": "Vites sayısı"
  },
  "Hydrostatic Transmission Ranges": {
    "tr": "Hidrostatik şanzıman hız aralıkları"
  },
  "Max Speed": {
    "tr": "Azami hız"
  },
  "Maximum Speed (Brochure, Tyre-Dependent) - Mechanical": {
    "tr": "Azami hız (broşüre göre, lastiğe bağlı) – mekanik"
  },
  "Maximum Speed (Brochure, Tyre-Dependent) - Powershuttle": {
    "tr": "Azami hız (broşüre göre, lastiğe bağlı) – PowerShuttle"
  },
  "Number Of Speeds - 5 Gears Transmission - Mechanical Shuttle": {
    "tr": "Vites sayısı – 5 vitesli şanzıman, mekanik ileri-geri yön değiştirici"
  },
  "Number Of Speeds - 5 Gears Transmission - Powershuttle": {
    "tr": "Vites sayısı – 5 vitesli şanzıman, PowerShuttle"
  },
  "Operating Weight With ROPS": {
    "tr": "ROPS ile çalışma ağırlığı"
  },
  "Piston Stroke": {
    "tr": "Piston strok uzunluğu"
  },
  "Rear Agricultural Tires": {
    "tr": "Arka tarım lastikleri"
  },
  "Robotic Transmission Ranges": {
    "tr": "Robotize şanzıman hız aralıkları"
  },
  "Total Admissible Load": {
    "tr": "İzin verilen toplam yük"
  },
  "Tractor Weight": {
    "tr": "Traktör ağırlığı"
  },
  "Weight With Cab": {
    "tr": "Kabinli ağırlık"
  },
  "Agrotechnical Clearance Under Front Axle": {
    "tr": "Ön aks altındaki tarımsal yerden açıklık"
  },
  "Agrotechnical Clearance Under Rear Wheel Tubes": {
    "tr": "Arka tekerlek boruları altındaki tarımsal yerden açıklık"
  },
  "Available Transmission Options": {
    "tr": "Mevcut şanzıman seçenekleri"
  },
  "Clutch Configuration": {
    "tr": "Debriyaj düzeni"
  },
  "Clutch Standard": {
    "tr": "Standart debriyaj"
  },
  "Creeper Gearbox Option": {
    "tr": "Sürüngen vitesli şanzıman seçeneği"
  },
  "Driven Wheels": {
    "tr": "Tahrik edilen tekerlekler"
  },
  "Engine Maker": {
    "tr": "Motor üreticisi"
  },
  "Engine Rpm At Stated Power": {
    "tr": "Bildirilen motor gücündeki devir (dev/dak)"
  },
  "F36CHN HST Transmission Ranges": {
    "tr": "F36CHN HST şanzıman hız aralıkları"
  },
  "F36CN Mechanical Gear Configuration": {
    "tr": "F36CN mekanik vites düzeni"
  },
  "Forward Speed Range": {
    "tr": "İleri hız aralığı"
  },
  "Forward/Reverse Gear Options": {
    "tr": "İleri/geri vites seçenekleri"
  },
  "Front Diff Lock Type": {
    "tr": "Ön diferansiyel kilidi tipi"
  },
  "Front Tire (Main Configuration)": {
    "tr": "Ön lastik (ana yapılandırma)"
  },
  "Front Tyre Size": {
    "tr": "Ön lastik ölçüsü"
  },
  "Front Wheel Track": {
    "tr": "Ön tekerlek iz genişliği"
  },
  "Height To ROPS Arc Top": {
    "tr": "ROPS kemerinin üst noktasına kadar yükseklik"
  },
  "HST Transmission Ranges": {
    "tr": "HST şanzıman hız aralıkları"
  },
  "Hydraulic Flow": {
    "tr": "Hidrolik debi"
  },
  "Hydraulic Oil Reservoir": {
    "tr": "Hidrolik yağ deposu"
  },
  "Hydraulic System Maximum Pressure": {
    "tr": "Hidrolik sistemin azami basıncı"
  },
  "Hydraulic Tank Capacity": {
    "tr": "Hidrolik tank kapasitesi"
  },
  "Hydrostatic Range Modes": {
    "tr": "Hidrostatik hız aralığı modları"
  },
  "Manufacturer Engine Power (Metric Hp)": {
    "tr": "Üreticinin bildirdiği motor gücü (metrik bg)"
  },
  "Manufacturer Rated Power": {
    "tr": "Üreticinin belirttiği nominal güç"
  },
  "Manufacturer Selectable Automatic Ranges (SIM)": {
    "tr": "Üreticinin seçilebilir otomatik hız aralıkları (SIM)"
  },
  "Manufacturer Stated Power": {
    "tr": "Üreticinin bildirdiği güç"
  },
  "Manufacturer-Stated Road Homologation Speed": {
    "tr": "Üreticinin bildirdiği yol homologasyon hızı"
  },
  "Manufacturer-Stated Tractor Weight": {
    "tr": "Üreticinin bildirdiği traktör ağırlığı"
  },
  "Max Speed Variants": {
    "tr": "Azami hız varyantları"
  },
  "Maximum Road Speed (ECO, Tyre Dependent)": {
    "tr": "Azami yol hızı (ECO, lastiğe bağlı)"
  },
  "Operating Weight (Brochure Configuration)": {
    "tr": "Çalışma ağırlığı (broşürdeki yapılandırma)"
  },
  "Operating Weight Without Ballast": {
    "tr": "Balastsız çalışma ağırlığı"
  },
  "Overall Width Between Rear Wheels": {
    "tr": "Arka tekerlekler arasındaki toplam genişlik"
  },
  "Rear 3-Point Draft/Implement Depth Control": {
    "tr": "Arka üç nokta askı sisteminde çeki kuvveti/ekipman derinliği kontrolü"
  },
  "Rear Diff Lock Type": {
    "tr": "Arka diferansiyel kilidi tipi"
  },
  "Rear Remote Valve Sets": {
    "tr": "Arka hidrolik kumanda valfi grupları"
  },
  "Rear Tire (Main Configuration)": {
    "tr": "Arka lastik (ana yapılandırma)"
  },
  "Rear Tyre Size": {
    "tr": "Arka lastik ölçüsü"
  },
  "Reverse Speeds": {
    "tr": "Geri vites hızları"
  },
  "Road Clearance (Main Tyre Configuration)": {
    "tr": "Yerden açıklık (ana lastik yapılandırması)"
  },
  "Speed Range Forward": {
    "tr": "İleri hareket hız aralığı"
  },
  "Speed Range Reverse": {
    "tr": "Geri hareket hız aralığı"
  },
  "Standard Clutch": {
    "tr": "Standart debriyaj"
  },
  "Standard Front Tire Size": {
    "tr": "Standart ön lastik ölçüsü"
  },
  "Standard Rear Tire Size": {
    "tr": "Standart arka lastik ölçüsü"
  },
  "Synchro-Shuttle Gear Configuration": {
    "tr": "Synchro-Shuttle vites düzeni"
  },
  "Synchronised Gear Shifting": {
    "tr": "Senkromeçli vites değiştirme"
  },
  "Transmission Configuration": {
    "tr": "Şanzıman yapılandırması"
  },
  "Transmission Gears": {
    "tr": "Şanzıman vitesleri"
  },
  "Transmission Option Hilo": {
    "tr": "HiLo şanzıman seçeneği"
  },
  "Transmission Option Hml": {
    "tr": "HML şanzıman seçeneği"
  },
  "Transmission Shuttle Type": {
    "tr": "Şanzıman ileri-geri yön değiştirme tipi"
  },
  "Weight With Roll Bar": {
    "tr": "Devrilme koruma barıyla ağırlık"
  },
  "With Front Tyre": {
    "tr": "Ön lastikle"
  },
  "With Front Tyre Size": {
    "tr": "Ön lastik ölçüsüyle"
  },
  "With Rear Tyre": {
    "tr": "Arka lastikle"
  },
  "With Rear Tyre Size": {
    "tr": "Arka lastik ölçüsüyle"
  }
};

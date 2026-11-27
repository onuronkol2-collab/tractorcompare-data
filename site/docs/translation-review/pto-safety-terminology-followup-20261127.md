# PTO translation follow-up — 27 November 2026

Scope: existing eight additional-language PTO article drafts only. English/Turkish source and rendering files were not changed. No additional public routes or hreflang. The original source hashes, source paragraphs, source labels/URLs, section order and original review flags are preserved. This is an assistant editorial revision, not independent reviewer sign-off.

## Changes
- de: `Antrieb auskuppeln, Motor abstellen` → `Zapfwellenantrieb ausschalten, Motor abstellen`.
- de: `Anbaukategorie, Gerätemasse` → `Kategorie der Anbauvorrichtung, Gerätemasse`.
- de: `Verzahnungszahl der Zapfwelle` → `Anzahl der Keilwellenzähne der Zapfwelle`.
- de: `Reifentraktion und Zapfwellenleistung` → `Zugkraft der Reifen und Zapfwellenleistung`.
- fr: `désengagez l’entraînement, arrêtez le moteur` → `désengagez la prise de force, arrêtez le moteur`.
- fr: `prise de force (PDF/PTO)` → `prise de force (PTO)`.
- es: `desacople la transmisión de potencia, apague el motor` → `desconecte la toma de fuerza, apague el motor`.
- pt-br: `desengate a transmissão de potência, desligue o motor` → `desative a TDP, desligue o motor`.
- pt-br: `Compatibilidade da TDP é apenas` → `A compatibilidade da TDP é apenas`.
- zh: `断开动力传动、关闭发动机` → `切断 PTO 动力传递、关闭发动机`.
- zh: `联接器类型` → `联轴器类型`.
- hi: `शक्ति संचरण अलग करें, इंजन बंद करें` → `PTO की शक्ति आपूर्ति बंद करें, इंजन बंद करें`.
- hi: `गाँठ बनाने वाली बेलर मशीन और बार-बार रुकने वाले कामों के लिए` → `बेलर से चारा या पुआल की गांठें बनाने और बार-बार रुकने वाले कामों के लिए`.
- hi: `ईंधन और शोर कम हो सकते हैं` → `ईंधन की खपत और शोर कम हो सकते हैं`.
- ru: `отключите передачу мощности, остановите двигатель` → `отключите привод ВОМ, остановите двигатель`.
- ja: `動力伝達を切り、エンジンを停止し` → `PTOを切り、エンジンを停止し`.
- ja: `ベーラーによる梱包作業や頻繁に停止する作業` → `ベーラーで牧草などをベールに成形する作業や頻繁に停止する作業`.

The safety paragraph in every draft now explicitly refers to switching off the PTO drive rather than using ambiguous general drive wording. Other edits improve local terminology, fluency and clarity. Technical speeds, quantities and existing safety caveats are retained.

## Source-level finding (open; do not release)
The existing source points to [HSE — Using machines safely](https://www.hse.gov.uk/agriculture/topics/machinery/safe-use-1.htm). Its Safe Stop procedure expressly includes the neutral-control position, in addition to applying the parking brake, switching off the engine/power and removing the key. The existing English/Turkish source needs an explicit neutral-control clarification before approving the additional translations. [HSE — Safe maintenance](https://www.hse.gov.uk/agriculture/topics/maintenance-1.htm) also stresses that movement must stop before removing guards. Verify exact machine-specific procedures in the manufacturer manuals. This review is not a comprehensive operating or safety approval.

The original source blob is shared by PTO, hydraulic and power draft files; a source edit requires explicit coordinated revalidation of all affected source-bound drafts, not blind hash replacement. Existing independent editorial review and publication gates remain active; 24 article drafts remain unapproved, not 24 new published pages. No new translation provider call, test, CI trigger or deployment. Reconcile PR #127 and other active changes before integrating. Next action: prepare the source correction and synchronize source-bound review packets, then obtain the required independent review.

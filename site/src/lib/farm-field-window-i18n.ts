import type {Locale} from "./locales";
const copy:Record<Locale,readonly [string,string,string,string,string]>={
  "en": [
    "Available working days (optional)",
    "Required hours per day",
    "Available working hours",
    "Remaining hours (negative = shortfall)",
    "The working window is an estimate using your entered working days and hours, not a weather, calendar or safety forecast. Required hours can exceed 24; that means the sequential plan cannot fit within the entered days."
  ],
  "tr": [
    "Kullanılabilir çalışma günü (isteğe bağlı)",
    "Günde gereken çalışma saati",
    "Kullanılabilir toplam saat",
    "Kalan saat (negatif = açık)",
    "Çalışma penceresi, girdiğiniz gün ve saatlere dayalı tahmindir; hava, takvim veya güvenlik öngörüsü değildir. Gereken günlük saat 24'ü aşarsa sıralı plan girilen günlere sığmaz."
  ],
  "de": [
    "Verfügbare Arbeitstage (optional)",
    "Benötigte Stunden pro Tag",
    "Verfügbare Arbeitsstunden",
    "Verbleibende Stunden (negativ = Fehlbedarf)",
    "Die Schätzung basiert auf Ihren Arbeitstagen und Stunden, nicht auf Wetter, Kalender oder Sicherheit. Mehr als 24 benötigte Stunden pro Tag bedeuten, dass der sequenzielle Plan nicht in den Zeitraum passt."
  ],
  "fr": [
    "Jours de travail disponibles (facultatif)",
    "Heures requises par jour",
    "Heures de travail disponibles",
    "Heures restantes (négatif = manque)",
    "Estimation selon vos jours et heures saisis, sans prévision météo, calendrier ou sécurité. Plus de 24 heures requises par jour signifie que le plan séquentiel ne tient pas dans le délai."
  ],
  "es": [
    "Días de trabajo disponibles (opcional)",
    "Horas necesarias por día",
    "Horas de trabajo disponibles",
    "Horas restantes (negativo = déficit)",
    "Estimación basada en los días y horas introducidos, sin prever clima, calendario ni seguridad. Más de 24 horas necesarias al día significa que el plan sucesivo no cabe en el plazo."
  ],
  "pt-br": [
    "Dias de trabalho disponíveis (opcional)",
    "Horas necessárias por dia",
    "Horas de trabalho disponíveis",
    "Horas restantes (negativo = déficit)",
    "Estimativa baseada nos dias e horas informados, sem previsão de clima, calendário ou segurança. Mais de 24 horas necessárias por dia significa que o plano sequencial não cabe no prazo."
  ],
  "ru": [
    "Доступные рабочие дни (необязательно)",
    "Необходимые часы в день",
    "Доступные рабочие часы",
    "Оставшиеся часы (отрицательное значение — дефицит)",
    "Оценка основана на введённых днях и часах, без прогноза погоды, календаря или безопасности. Более 24 необходимых часов в день означает, что последовательный план не укладывается в срок."
  ],
  "zh": [
    "可用工作天数（可选）",
    "每日所需工时",
    "可用总工时",
    "剩余工时（负数表示不足）",
    "根据输入的工作天数与工时估算，不预测天气、日历或安全性。每日所需工时超过24小时，表示顺序作业无法在所填天数内完成。"
  ],
  "hi": [
    "उपलब्ध कार्य दिवस (वैकल्पिक)",
    "प्रतिदिन आवश्यक घंटे",
    "उपलब्ध कार्य घंटे",
    "शेष घंटे (ऋणात्मक = कमी)",
    "यह अनुमान दर्ज दिनों और घंटों पर आधारित है, मौसम, कैलेंडर या सुरक्षा का पूर्वानुमान नहीं। प्रतिदिन 24 से अधिक आवश्यक घंटे का अर्थ है कि क्रमिक योजना दर्ज दिनों में पूरी नहीं हो सकती।"
  ],
  "ja": [
    "作業可能日数（任意）",
    "1日当たり必要作業時間",
    "作業可能時間の合計",
    "残り時間（負の値は不足）",
    "入力した作業日数と時間に基づく推定であり、天候、暦、安全性の予測ではありません。1日に必要な時間が24時間を超える場合、順次作業計画は入力した日数に収まりません。"
  ]
};
export function fieldWindowText(lang:Locale){const [days,required,available,remaining,note]=copy[lang];return {days,required,available,remaining,note};}

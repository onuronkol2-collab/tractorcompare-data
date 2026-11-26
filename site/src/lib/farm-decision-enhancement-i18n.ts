import type {Locale} from "./locales";
const rows:Record<Locale,readonly [string,string,string,string,string,string]>={
 en:["Requirement details","Margin = entered available value minus required value, using equivalent measurement conditions.","Threshold met","Below requirement","Checklist progress (items checked, not safety approval)","Reset checklist"],
 tr:["Gereksinim ayrıntıları","Fark = girilen mevcut değer eksi gereken değer; yalnız eşdeğer ölçüm koşullarını kullan.","Eşik karşılanıyor","Gereksinimin altında","Kontrol listesi ilerlemesi (işaretlenen maddeler, güvenlik onayı değil)","Listeyi sıfırla"],
 zh:["需求详情","差值 = 输入的可用值减去需求值；仅使用相同测量条件。","达到阈值","低于要求","检查清单进度（已勾选项目，并非安全认证）","重置清单"],
 hi:["आवश्यकता का विवरण","अंतर = दर्ज उपलब्ध मान घटा आवश्यक मान; केवल समान मापन स्थितियों का उपयोग करें।","सीमा पूरी","आवश्यकता से कम","जाँच सूची की प्रगति (चिह्नित मदें, सुरक्षा अनुमोदन नहीं)","सूची रीसेट करें"],
 "pt-br":["Detalhes dos requisitos","Margem = valor disponível informado menos o necessário; use condições de medição equivalentes.","Limite atendido","Abaixo do requisito","Progresso da lista (itens marcados, não é aprovação de segurança)","Redefinir lista"],
 fr:["Détail des exigences","Marge = valeur disponible saisie moins valeur requise ; utiliser des conditions de mesure équivalentes.","Seuil atteint","Sous le seuil requis","Progression de la liste (éléments cochés, pas une validation de sécurité)","Réinitialiser la liste"],
 de:["Anforderungsdetails","Differenz = eingegebener verfügbarer Wert minus erforderlicher Wert; nur gleichwertige Messbedingungen verwenden.","Grenzwert erreicht","Anforderung unterschritten","Checklistenfortschritt (markierte Punkte, keine Sicherheitsfreigabe)","Liste zurücksetzen"],
 ru:["Подробности требований","Разница = введённое доступное значение минус требуемое; используйте сопоставимые условия измерения.","Порог достигнут","Ниже требования","Ход проверки (отмеченные пункты, не подтверждение безопасности)","Сбросить список"],
 ja:["要件の詳細","差 = 入力した利用可能値 − 必要値。同等の測定条件を使用してください。","基準を満たす","要件未満","チェックリストの進捗（チェック済み項目、安全認証ではありません）","リストをリセット"],
 es:["Detalle de requisitos","Margen = valor disponible introducido menos el requerido; usa condiciones de medición equivalentes.","Umbral alcanzado","Por debajo del requisito","Progreso de la lista (elementos marcados, no es aprobación de seguridad)","Restablecer lista"]
};
export function farmDecisionEnhancementText(lang:Locale){
 const [breakdown,marginNote,met,short,progress,reset]=rows[lang];
 return {breakdown,marginNote,met,short,progress,reset};
}

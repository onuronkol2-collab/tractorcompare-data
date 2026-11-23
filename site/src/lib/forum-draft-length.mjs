// The character counter deliberately follows HTML textarea.maxLength's UTF-16
// length rule, not Unicode code points. This prevents false "room left" claims
// for emoji/surrogate pairs while PostgreSQL retains its own source constraints.
export const FORUM_DRAFT_MAX = Object.freeze({topic:12000,reply:6000});
export const FORUM_DRAFT_LENGTH_COPY = Object.freeze({
 en:{unit:"characters",near:"You are nearing the text limit. Review the ending before posting.",full:"Text limit reached. Check that the final sentence is complete.",paste:"The pasted text exceeds the limit. Your existing draft was kept; shorten or split the text."},
 tr:{unit:"karakter",near:"Metin sınırına yaklaştınız. Göndermeden önce son cümleyi kontrol edin.",full:"Metin sınırına ulaştınız. Son cümlenin eksiksiz olduğundan emin olun.",paste:"Yapıştırılan metin sınırı aşıyor. Mevcut taslak korundu; metni kısaltın veya bölümlere ayırın."},
 zh:{unit:"字符",near:"文本即将达到长度限制，发布前请检查结尾是否完整。",full:"已达到文本长度上限，请确认最后一句话完整。",paste:"粘贴内容超过长度上限，原草稿已保留；请缩短或分段发布。"},
 hi:{unit:"अक्षर",near:"पाठ सीमा के पास है। पोस्ट करने से पहले अंतिम वाक्य जाँचें।",full:"पाठ की सीमा पूरी हो गई है। सुनिश्चित करें कि अंतिम वाक्य पूरा है।",paste:"चिपकाया गया पाठ सीमा से बड़ा है। मौजूदा मसौदा सुरक्षित है; पाठ छोटा करें या भागों में बाँटें।"},
 "pt-br":{unit:"caracteres",near:"Você está perto do limite de texto. Confira o final antes de publicar.",full:"Limite de texto atingido. Verifique se a última frase está completa.",paste:"O texto colado ultrapassa o limite. Seu rascunho foi preservado; reduza ou divida o conteúdo."},
 fr:{unit:"caractères",near:"Vous approchez de la limite. Vérifiez la fin du texte avant de publier.",full:"Limite atteinte. Vérifiez que la dernière phrase est complète.",paste:"Le texte collé dépasse la limite. Votre brouillon est conservé ; raccourcissez ou divisez le texte."},
 de:{unit:"Zeichen",near:"Sie nähern sich dem Textlimit. Prüfen Sie vor dem Veröffentlichen das Ende.",full:"Textlimit erreicht. Prüfen Sie, ob der letzte Satz vollständig ist.",paste:"Der eingefügte Text überschreitet das Limit. Ihr Entwurf bleibt erhalten; kürzen oder teilen Sie ihn."},
 ru:{unit:"символов",near:"Вы приближаетесь к лимиту текста. Перед публикацией проверьте окончание.",full:"Лимит текста достигнут. Убедитесь, что последнее предложение завершено.",paste:"Вставляемый текст превышает лимит. Черновик сохранён; сократите или разделите текст."},
 ja:{unit:"文字",near:"文字数の上限に近づいています。投稿前に末尾の文章を確認してください。",full:"文字数の上限に達しました。最後の文が途中で切れていないか確認してください。",paste:"貼り付ける文章が上限を超えます。現在の下書きは保持されました。文章を短くするか分割してください。"},
 es:{unit:"caracteres",near:"Te acercas al límite de texto. Revisa el final antes de publicar.",full:"Has alcanzado el límite. Comprueba que la última frase esté completa.",paste:"El texto pegado supera el límite. Tu borrador se ha conservado; acorta o divide el contenido."}
});

export function draftLengthState(value,max){
 const used=String(value??"").length;
 const limit=Number(max);
 if(!Number.isSafeInteger(limit)||limit<=0)throw new RangeError("Invalid forum draft length limit");
 return {used,limit,remaining:Math.max(0,limit-used),warning:used>=Math.ceil(limit*0.9),full:used>=limit};
}
export function wouldOverflowForumPaste(value,start,end,paste,max){
 if(typeof paste!=="string"||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<start)
  return false;
 const current=String(value??"");
 if(end>current.length)return true;
 return current.length-(end-start)+paste.length>max;
}

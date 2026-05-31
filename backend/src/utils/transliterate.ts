/**
 * Hindi to Roman/English transliteration utility
 * Converts Devanagari script to Roman script for Hinglish display
 */

// Comprehensive Devanagari to Roman transliteration mapping
const devanagariMap: Record<string, string> = {
  // Independent vowels
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',

  // Vowel signs (matras)
  'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ाँ': 'aan', 'ां': 'an', 'िं': 'in', 'ीं': 'een', 'ुँ': 'oon', 'ूं': 'oon',

  // Consonants
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',

  // Nuqta / Precomposed Consonants (high-fidelity Arabic/Farsi loanwords & retroflexes)
  'क़': 'q', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'z', 'ड़': 'd', 'ढ़': 'dh', 'फ़': 'f',

  // Special
  'ं': 'n', 'ः': 'h', 'ँ': 'n', '्': '',
  'ॅ': '', 'ॉ': '', '़': '', 'ऽ': '', '।': '.',
};

// Common Hindi word patterns that need special handling
export const commonWordsMap = new Map([
  // 1. Question Words (The "W" Questions)
  ['क्या', 'kya'],
  ['क्यों', 'kyun'],
  ['क्यूँ', 'kyun'],
  ['क्यूं', 'kyun'],
  ['क्यो', 'kyon'],
  ['कब', 'kab'],
  ['कहाँ', 'kahan'],
  ['कहान', 'kahan'],
  ['कहॉं', 'kahan'],
  ['कहा', 'kaha'],
  ['कैसे', 'kaise'],
  ['कौन', 'kaun'],
  ['किसका', 'kiska'],
  ['किसकी', 'kiski'],
  ['किसके', 'kiske'],
  ['किस', 'kis'],
  ['किसी', 'kisi'],
  ['कितना', 'kitna'],
  ['कितनी', 'kitni'],
  ['कितने', 'kitne'],

  // 2. Pronouns and Ownership
  ['मैं', 'main'],
  ['मे', 'main'],
  ['तू', 'tu'],
  ['हम', 'hum'],
  ['आप', 'aap'],
  ['तुम', 'tum'],
  ['यह', 'yeh'],
  ['वह', 'woh'], // Natural social media Hinglish instead of 'vah'
  ['वो', 'woh'], // Natural Hinglish
  ['वे', 've'],
  ['यहाँ', 'yahan'],
  ['वहाँ', 'vahan'],
  ['मेरा', 'mera'],
  ['मेरी', 'meri'],
  ['मेरे', 'mere'],
  ['तेरा', 'tera'],
  ['तेरी', 'teri'],
  ['तेरे', 'tere'],
  ['हमारा', 'hamara'],
  ['हमारी', 'hamari'],
  ['हमारे', 'hamare'],
  ['आपका', 'aapka'], // High fidelity 'aapka'
  ['आपकी', 'aapki'],
  ['आपके', 'aapke'],
  ['तुम्हारा', 'tumhara'],
  ['तुम्हारी', 'tumhari'],
  ['तुम्हारे', 'tumhare'],
  ['उसका', 'uska'],
  ['उसकी', 'uski'],
  ['उसके', 'uske'],
  ['उनका', 'unka'],
  ['उनकी', 'unki'],
  ['उनके', 'unke'],
  ['उन', 'un'],
  ['इस', 'is'],
  ['इन', 'in'],
  ['उस', 'us'],

  // 3. Conversational Words, Fillers & Phrases
  ['मुझे', 'mujhe'],
  ['पता', 'pata'],
  ['मालूम', 'maloom'],
  ['मालुम', 'maloom'],
  ['बात', 'baat'],
  ['बढ़िया', 'badiya'],
  ['बढ़िया', 'badiya'],
  ['जल्दी', 'jaldi'],
  ['मतलब', 'matlab'],
  ['समझ', 'samajh'],
  ['गया', 'gaya'],
  ['गई', 'gayi'], // High fidelity spelling
  ['गयी', 'gayi'],
  ['गए', 'gaye'], // High fidelity spelling
  ['हाँ', 'haan'],
  ['हां', 'haan'],
  ['नहीं', 'nahi'], // Spelt 'nahi' for social media captions
  ['नही', 'nahi'], 
  ['ना', 'na'],
  ['ठीक', 'theek'],
  ['ठिक', 'thik'],
  ['अच्छा', 'achha'],
  ['अचा', 'acha'],
  ['यार', 'yaar'],
  ['अरे', 'arre'],
  ['अर्रे', 'arre'],
  ['भाई', 'bhai'],
  ['ब्रो', 'bro'],
  ['चलो', 'chalo'],
  ['सुनो', 'suno'],
  ['रुको', 'ruko'],
  ['हट', 'hat'],
  ['चल', 'chal'],
  ['कोई', 'koi'],
  ['थक', 'thak'],
  ['चाय', 'chai'],
  ['बारिश', 'baarish'],
  ['मिलेंगे', 'milenge'],
  ['गाड़ी', 'gadi'],
  ['गाडी', 'gadi'],
  ['स्वागत', 'swagat'],
  ['नाम', 'naam'],
  ['काम', 'kaam'],

  // 4. Verbs & Aspect Markers (to be, action)
  ['है', 'hai'],
  ['हैं', 'hain'],
  ['था', 'tha'],
  ['थे', 'the'],
  ['थी', 'thi'],
  ['हूँ', 'hoon'],
  ['हो', 'ho'],
  ['होगा', 'hoga'],
  ['होगी', 'hogi'],
  ['होगे', 'hoge'],
  ['रहा', 'raha'],
  ['रही', 'rahi'],
  ['रहे', 'rahe'],
  ['हुआ', 'hua'],
  ['हुई', 'hui'],
  ['हुए', 'hue'],
  ['लिया', 'liya'],
  ['ली', 'li'],
  ['ले', 'le'],
  ['लो', 'lo'],
  ['लिए', 'liye'],
  ['करो', 'karo'],
  ['कर', 'kar'],
  ['किया', 'kiya'],
  ['करता', 'karta'],
  ['करती', 'karti'],
  ['करते', 'karte'],
  ['करना', 'karna'],
  ['करें', 'karein'],
  ['करके', 'karke'],
  ['करूँ', 'karun'],
  ['करूं', 'karun'],
  ['करू', 'karun'],
  ['करेंगे', 'karenge'],
  ['करूंगा', 'karunga'],
  ['करूँगी', 'karungi'],
  ['चलेंगे', 'chalenge'],
  ['चलें', 'chalein'],
  ['चले', 'chale'],
  ['चलेगा', 'chalega'],
  ['आ', 'aa'],
  ['आया', 'aya'],
  ['आई', 'ai'],
  ['आए', 'aye'],
  ['आना', 'aana'],
  ['आओ', 'aao'],
  ['जाया', 'jaya'],
  ['जाओ', 'jao'],
  ['जाना', 'jana'],
  ['सकता', 'sakta'],
  ['सकती', 'sakti'],
  ['सकते', 'sakte'],
  ['चाहिए', 'chahiye'],
  ['चाहता', 'chahata'],
  ['चाहती', 'chahati'],

  // 5. Prepositions & Connectors
  ['के', 'ke'],
  ['की', 'ki'],
  ['का', 'ka'],
  ['को', 'ko'],
  ['से', 'se'],
  ['में', 'mein'],
  ['पर', 'par'],
  ['भी', 'bhi'],
  ['ही', 'hee'],
  ['तो', 'toh'], // Spelt 'toh' for Hinglish
  ['तभी', 'tabhi'],
  ['तब', 'tab'],
  ['और', 'aur'],
  ['औऱ', 'aur'],
  ['या', 'ya'],
  ['लेकिन', 'lekin'],
  ['क्योंकि', 'kyunki'],
  ['क्यूंकि', 'kyunki'],
  ['क्युकी', 'kyunki'],
  ['क्यूँकी', 'kyunki'],
  ['अगर', 'agar'],
  ['जो', 'jo'],
  ['जैसा', 'jaisa'],
  ['जैसे', 'jaise'],
  ['जब', 'jab'],
  ['तथा', 'tatha'],
  ['कि', 'ki'],

  // 6. Common Nouns & Adjectives
  ['बहुत', 'bahut'],
  ['थोड़ा', 'thoda'],
  ['थोड़ी', 'thodi'],
  ['सब', 'sab'],
  ['कुछ', 'kuch'],
  ['पहले', 'pehle'],
  ['बाद', 'baad'],
  ['आगे', 'aage'],
  ['पीछे', 'piche'],
  ['ऊपर', 'upar'],
  ['नीचे', 'niche'],
  ['अंदर', 'andar'],
  ['बाहर', 'bahar'],
  ['साथ', 'sath'],
  ['अभी', 'abhi'],
  ['अब', 'ab'],
  ['फिर', 'phir'],
  ['बड़ा', 'bada'],
  ['बड़ी', 'badi'],
  ['छोटा', 'chhota'],
  ['छोटी', 'chhoti'],
  ['नया', 'naya'],
  ['नई', 'nai'],
  ['पुराना', 'purana'],
  ['पुरानी', 'purani'],
  ['आज', 'aaj'],
  ['कल', 'kal'],
  ['परसों', 'parson'],
  ['सुबह', 'subah'],
  ['शाम', 'shaam'],
  ['रात', 'raat'],
  ['दिन', 'din'],
  ['लोग', 'log'],
  ['काम', 'kaam'],
  ['घर', 'ghar'],
  ['महंगा', 'mahanga'],
  ['महँगा', 'mahanga'],

  // 7. Premium Content Creator Loanwords (Devanagari to high-fidelity English)
  ['फोन', 'phone'],
  ['फ़ोन', 'phone'],
  ['वीडियो', 'video'],
  ['एडिट', 'edit'],
  ['एडिट्स', 'edits'],
  ['फील', 'feel'],
  ['बेसिक', 'basic'],
  ['बोरिंग', 'boring'],
  ['चैनल', 'channel'],
  ['सब्सक्राइब', 'subscribe'],
  ['लाइक', 'like'],
  ['कमेंट', 'comment'],
  ['शेयर', 'share'],
  ['फॉलो', 'follow'],
  ['ऑडियो', 'audio'],
  ['म्यूजिक', 'music'],
  ['कैप्शन', 'caption'],
  ['कैप्शंस', 'captions'],
  ['क्रिएटर', 'creator'],
  ['डिजिटल', 'digital'],
  ['मार्केटिंग', 'marketing'],
  ['बिज़नेस', 'business'],
  ['बिजनेस', 'business'],
  ['सक्सेस', 'success'],
  ['ग्रोथ', 'growth'],
  ['टिप्स', 'tips'],
  ['ट्रिक्स', 'tricks'],
  ['स्मार्टफोन', 'smartphone'],
  ['लैपटॉप', 'laptop'],
  ['कंप्यूटर', 'computer'],
  ['इंटरनेट', 'internet'],
  ['ऑनलाइन', 'online'],
  ['सोशल', 'social'],
  ['मीडिया', 'media'],
  ['कंटेंट', 'content'],
  ['ऐप', 'app'],
  ['एप', 'app'],
  ['वेबसाइट', 'website'],
  ['लिंक', 'link'],
  ['प्रोफ़ाइल', 'profile'],
  ['फ़ोटो', 'photo'],
  ['फोटो', 'photo'],
  ['इमेज', 'image'],
  ['स्क्रीन', 'screen'],
  ['कैमरा', 'camera'],
  ['सॉफ्टवेयर', 'software'],
  ['गेम', 'game'],
  ['गेमिंग', 'gaming'],
  ['प्ले', 'play'],
  ['स्टार्ट', 'start'],
  ['स्टॉप', 'stop'],
  ['पॉज', 'pause'],
  ['पॉज़', 'pause'],
  ['नेक्स्ट', 'next'],
  ['back', 'back'],
  ['होम', 'home'],
  ['सेटिंग्स', 'settings'],
  ['लॉगिन', 'login'],
  ['पासवर्ड', 'password'],
  ['ईमेल', 'email'],
  ['मैसेज', 'message'],
  ['चैट', 'chat'],
  ['कॉल', 'call'],
  ['टीम', 'team'],
  ['ऑफिस', 'office'],
  ['वर्क', 'work'],
  ['जॉब', 'job'],
  ['मनी', 'money'],
  ['कैश', 'cash'],
  ['पेमेंट', 'payment'],
  ['कार्ड', 'card'],
  ['बैंक', 'bank'],
  ['शॉपिंग', 'shopping'],
  ['बाय', 'buy'],
  ['सेल', 'sell'],
  ['प्राइस', 'price'],
  ['फ्री', 'free'],
  ['ऑफर', 'offer'],
  ['डिस्काउंट', 'discount'],
  ['सेल', 'sale'],
  ['ट्रेवल', 'travel'],
  ['फूड', 'food'],
  ['रेस्टोरेंट', 'restaurant'],
  ['होटल', 'hotel'],
  ['कार', 'car'],
  ['बाइक', 'bike'],
  ['लाइफ', 'life'],
  ['स्टाइल', 'style'],
  ['फैशन', 'fashion'],
  ['ब्यूटी', 'beauty'],
  ['हेल्थ', 'health'],
  ['फिटनेस', 'fitness'],
  ['जिम', 'gym'],
  ['स्पोर्ट्स', 'sports'],
  ['मूवी', 'movie'],
  ['शो', 'show'],
  ['सोंग', 'song'],
  ['डांस', 'dance'],
  ['आर्ट', 'art'],
  ['डिजाइन', 'design'],
  ['स्टाइलिश', 'stylish'],
  ['ट्रेंडिंग', 'trending'],
  ['वायरल', 'viral'],
  ['कूल', 'cool'],
  ['सुपर', 'super'],
  ['ग्रेट', 'great'],
  ['बेस्ट', 'best'],
  ['नाइस', 'nice'],
  ['लव', 'love'],
  ['हैप्पी', 'happy'],
  ['सैड', 'sad'],
  ['फनी', 'funny'],
  ['क्यूट', 'cute'],
  ['ब्यूटीफुल', 'beautiful'],
  ['अमेजिंग', 'amazing'],
  ['ऑसम', 'awesome'],
  ['परफेक्ट', 'perfect'],
  ['रेडी', 'ready'],
  ['डन', 'done'],
  ['थैंक्स', 'thanks'],
  ['वेलकम', 'welcome'],
  ['सॉरी', 'sorry'],
  ['प्लीज़', 'please'],
  ['प्लीज', 'please'],
  ['ओके', 'okay'],
  ['कॉफी', 'coffee'],
  ['कौफी', 'coffee'],
]);

// Multi-word phrase mappings for high-fidelity Everyday Conversational Phrases
export const commonPhrasesMap = new Map([
  // Aap kaise hain? / Tum kaise ho?
  ['आप कैसे हैं', 'aap kaise hain'],
  ['आप कैसे हो', 'aap kaise ho'],
  ['तुम कैसे हो', 'tum kaise ho'],
  
  // Kya chal raha hai?
  ['क्या चल रहा है', 'kya chal raha hai'],
  
  // Mujhe nahi pata / Mujhe nahi maloom
  ['मुझे नहीं पता', 'mujhe nahi pata'],
  ['मुझे नही पता', 'mujhe nahi pata'],
  ['मुझे नहीं मालूम', 'mujhe nahi maloom'],
  ['मुझे नही मालूम', 'mujhe nahi maloom'],
  ['मुझे नहीं मालुम', 'mujhe nahi maloom'],
  ['मुझे नही मालुम', 'mujhe nahi maloom'],
  
  // Koi baat nahi
  ['कोई बात नहीं', 'koi baat nahi'],
  ['कोई बात नही', 'koi baat nahi'],
  
  // Bahut badiya
  ['बहुत बढ़िया', 'bahut badiya'],
  ['बहुत बढ़िया', 'bahut badiya'],
  
  // Jaldi karo
  ['जल्दी करो', 'jaldi karo'],
  
  // Kya matlab?
  ['क्या मतलब', 'kya matlab'],
  
  // Samajh gaya / Samajh gayi
  ['समझ गया', 'samajh gaya'],
  ['समझ गई', 'samajh gayi'],
  ['समझ गयी', 'samajh gayi'],
  
  // Phir milenge
  ['फिर मिलेंगे', 'phir milenge'],
]);

/**
 * Pre-process full text for common everyday conversational phrases
 */
export function preProcessPhrases(text: string): string {
  if (!text) return text;
  
  let processed = text;
  
  // Sort phrases by length descending to replace longer phrases first (prevent partial matches)
  const sortedPhrases = Array.from(commonPhrasesMap.keys()).sort((a, b) => b.length - a.length);
  
  for (const phrase of sortedPhrases) {
    if (processed.includes(phrase)) {
      const replacement = commonPhrasesMap.get(phrase)!;
      processed = processed.replace(new RegExp(phrase, 'g'), replacement);
    }
  }
  
  return processed;
}

/**
 * Check if a string contains Devanagari characters
 */
export function containsDevanagari(text: string): boolean {
  // Check for common Devanagari range
  return /[ऀ-ॿ]/.test(text);
}

/**
 * Convert a single Hindi word from Devanagari to Roman script
 */
export function transliterateWord(word: string): string {
  if (!word || word.trim() === '') return word;

  const trimmed = word.trim();

  // Check if it's a common word first (fast path)
  if (commonWordsMap.has(trimmed)) {
    return commonWordsMap.get(trimmed)!;
  }

  // Check if it contains Devanagari, if not return as-is
  if (!containsDevanagari(word)) {
    return word;
  }

  let result = '';
  let i = 0;

  while (i < word.length) {
    const char = word[i];

    // Check for two-character combinations first
    if (i + 2 <= word.length) {
      const twoChar = word.substring(i, i + 2);
      if (devanagariMap[twoChar] !== undefined) {
        result += devanagariMap[twoChar];
        i += 2;
        continue;
      }
    }

    // Check for three-character combinations
    if (i + 3 <= word.length) {
      const threeChar = word.substring(i, i + 3);
      if (devanagariMap[threeChar] !== undefined) {
        result += devanagariMap[threeChar];
        i += 3;
        continue;
      }
    }

    // Single character mapping
    if (devanagariMap[char] !== undefined) {
      result += devanagariMap[char];
    } else {
      result += char;
    }
    i++;
  }

  // Clean up the result
  result = result
    .replace(/a$/, '')
    .replace(/kk/g, 'k').replace(/gg/g, 'g')
    .replace(/tt/g, 't').replace(/dd/g, 'd')
    .replace(/bb/g, 'b').replace(/mm/g, 'm')
    .replace(/nn/g, 'n').replace(/rr/g, 'r')
    .replace(/ll/g, 'l').replace(/vv/g, 'v')
    .replace(/aa+/g, 'a').replace(/ee+/g, 'e').replace(/oo+/g, 'o')
    .replace(/chh/g, 'ch').replace(/shh/g, 'sh')
    .replace(/kh/g, 'kh').replace(/gh/g, 'gh')
    .replace(/bh/g, 'bh').replace(/th/g, 'th')
    .replace(/dh/g, 'dh').replace(/ph/g, 'ph')
    .trim();

  return result || word;
}

/**
 * Convert full Hindi text to Roman script
 */
export function transliterateHindiToRoman(text: string): string {
  if (!text) return text;

  // Apply phrase-level replacements first
  const phraseProcessed = preProcessPhrases(text);

  const parts = phraseProcessed.split(/(\s+|[,।!?.;:'"()-]+)/);

  return parts.map((part: string) => {
    if (!part || /^[,\s।!?.;:'"()-]+$/.test(part)) {
      return part;
    }
    if (containsDevanagari(part)) {
      return transliterateWord(part);
    }
    return part;
  }).join('');
}

/**
 * Process caption segments - converts Hindi text to Roman for Hinglish
 */
export function processHinglishCaptions(captions: any[]): any[] {
  return captions.map(segment => {
    // Apply phrase preprocessing on segment text level
    const phraseProcessedText = preProcessPhrases(segment.text);
    
    const convertedText = containsDevanagari(phraseProcessedText)
      ? transliterateHindiToRoman(phraseProcessedText)
      : phraseProcessedText;

    const convertedWords = segment.words?.map((word: any) => {
      const originalWord = word.word || '';
      const convertedWord = containsDevanagari(originalWord)
        ? transliterateWord(originalWord)
        : originalWord;

      return {
        ...word,
        word: convertedWord,
      };
    }) || [];

    return {
      ...segment,
      text: convertedText,
      words: convertedWords,
    };
  });
}
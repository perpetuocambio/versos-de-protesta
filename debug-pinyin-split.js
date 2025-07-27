// Debug para el problema de división de pinyin por carácter

const testCases = [
    'zìzhì guǎnlǐ',  // 自治管理 - 4 caracteres
    'zhàn dòu',      // 战斗 - 2 caracteres  
    'tuán jié'       // 团结 - 2 caracteres
];

testCases.forEach(pinyinText => {
    console.log(`\n=== Testing: "${pinyinText}" ===`);
    const pinyinSyllables = pinyinText ? pinyinText.split(' ') : [];
    console.log('Split result:', pinyinSyllables);
    console.log('Length:', pinyinSyllables.length);
    
    pinyinSyllables.forEach((syllable, idx) => {
        console.log(`  [${idx}]: "${syllable}"`);
    });
});

// Simular el problema específico de "自治管理"
console.log('\n=== Debugging 自治管理 problem ===');
const chineseText = '自治管理';
const pinyinText = 'zìzhì guǎnlǐ';

console.log('Chinese text:', chineseText);
console.log('Chinese length:', chineseText.length);
console.log('Pinyin text:', pinyinText);

const pinyinSyllables = pinyinText ? pinyinText.split(' ') : [];
console.log('Pinyin syllables:', pinyinSyllables);
console.log('Syllables length:', pinyinSyllables.length);

// Simulación del loop del código
for (let idx = 0; idx < chineseText.length; idx++) {
    const char = chineseText[idx];
    const syllablePinyin = pinyinSyllables[idx] || 'fallback_' + char;
    console.log(`Character ${idx}: "${char}" → pinyin: "${syllablePinyin}"`);
}
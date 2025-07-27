const input1 = 'bèi zhànshèng de'; // Con espacios (original)
const input2 = 'bèizhànshèngde';  // Sin espacios

console.log('Test 1 (con espacios):', input1);
console.log('¿Incluye espacios?:', input1.includes(' '));

console.log('Test 2 (sin espacios):', input2);
console.log('¿Incluye espacios?:', input2.includes(' '));

// Función directa del script
const pinyinSyllableSet = new Set([
    'a', 'o', 'e', 'er', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong',
    'ba', 'bo', 'bai', 'bei', 'bao', 'ban', 'ben', 'bang', 'beng', 'bi', 'bie', 'biao', 'bian', 'bin', 'bing', 'bu',
    'ha', 'he', 'hai', 'hei', 'hao', 'hou', 'han', 'hen', 'hang', 'heng', 'hong', 'hu', 'hua', 'huo', 'huai', 'hui', 'huan', 'hun', 'huang',
    'bei', 'zhan', 'sheng', 'de', 'wei'
]);

function segmentPinyin(pinyin) {
    console.log('Input a función:', JSON.stringify(pinyin));
    if (!pinyin || pinyin.includes(' ')) {
        console.log('Retornando original porque tiene espacios:', JSON.stringify(pinyin));
        return pinyin;
    }

    const result = [];
    let i = 0;
    while (i < pinyin.length) {
        let longestMatch = '';
        for (let j = i; j < pinyin.length; j++) {
            const sub = pinyin.substring(i, j + 1);
            const normalizedSub = sub.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[üÜ]/g, 'v');
            if (pinyinSyllableSet.has(normalizedSub)) {
                longestMatch = sub;
            }
        }

        if (longestMatch) {
            result.push(longestMatch);
            i += longestMatch.length;
        } else {
            console.warn('Could not segment at:', pinyin.substring(i));
            return pinyin;
        }
    }
    return result.join(' ');
}

console.log('Resultado test 1:', JSON.stringify(segmentPinyin(input1)));
console.log('Resultado test 2:', JSON.stringify(segmentPinyin(input2)));
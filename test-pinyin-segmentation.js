// Test de segmentación de pinyin específico para 战斗
const input = 'zhandou'; // Sin espacios ni tonos

const pinyinSyllableSet = new Set([
    'a', 'o', 'e', 'er', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong',
    'ba', 'bo', 'bai', 'bei', 'bao', 'ban', 'ben', 'bang', 'beng', 'bi', 'bie', 'biao', 'bian', 'bin', 'bing', 'bu',
    'pa', 'po', 'pai', 'pei', 'pao', 'pou', 'pan', 'pen', 'pang', 'peng', 'pi', 'pie', 'piao', 'pian', 'pin', 'ping', 'pu',
    'ma', 'mo', 'me', 'mai', 'mei', 'mao', 'mou', 'man', 'men', 'mang', 'meng', 'mi', 'mie', 'miao', 'miu', 'mian', 'min', 'ming', 'mu',
    'fa', 'fo', 'fei', 'fou', 'fan', 'fen', 'fang', 'feng',
    'da', 'de', 'dai', 'dei', 'dao', 'dou', 'dan', 'den', 'dang', 'deng', 'dong', 'di', 'die', 'diao', 'diu', 'dian', 'ding', 'du', 'duo', 'dui', 'duan', 'dun',
    'ta', 'te', 'tai', 'tao', 'tou', 'tan', 'tang', 'teng', 'tong', 'ti', 'tie', 'tiao', 'tian', 'ting', 'tu', 'tuo', 'tui', 'tuan', 'tun',
    'na', 'ne', 'nai', 'nei', 'nao', 'nou', 'nan', 'nen', 'nang', 'neng', 'nong', 'ni', 'nie', 'niao', 'niu', 'nian', 'nin', 'niang', 'ning', 'nu', 'nuo', 'nuan', 'nü', 'nüe',
    'la', 'lo', 'le', 'lai', 'lei', 'lao', 'lou', 'lan', 'lang', 'leng', 'long', 'li', 'lia', 'lie', 'liao', 'liu', 'lian', 'lin', 'liang', 'ling', 'lu', 'luo', 'luan', 'lun', 'lü', 'lüe',
    'ga', 'ge', 'gai', 'gei', 'gao', 'gou', 'gan', 'gen', 'gang', 'geng', 'gong', 'gu', 'gua', 'guo', 'guai', 'gui', 'guan', 'gun', 'guang',
    'ka', 'ke', 'kai', 'kei', 'kao', 'kou', 'kan', 'ken', 'kang', 'keng', 'kong', 'ku', 'kua', 'kuo', 'kuai', 'kui', 'kuan', 'kun', 'kuang',
    'ha', 'he', 'hai', 'hei', 'hao', 'hou', 'han', 'hen', 'hang', 'heng', 'hong', 'hu', 'hua', 'huo', 'huai', 'hui', 'huan', 'hun', 'huang',
    'ji', 'jia', 'jie', 'jiao', 'jiu', 'jian', 'jin', 'jiang', 'jing', 'jiong', 'ju', 'jue', 'juan', 'jun',
    'qi', 'qia', 'qie', 'qiao', 'qiu', 'qian', 'qin', 'qiang', 'qing', 'qiong', 'qu', 'que', 'quan', 'qun',
    'xi', 'xia', 'xie', 'xiao', 'xiu', 'xian', 'xin', 'xiang', 'xing', 'xiong', 'xu', 'xue', 'xuan', 'xun',
    'zhi', 'zha', 'zhe', 'zhai', 'zhei', 'zhao', 'zhou', 'zhan', 'zhen', 'zhang', 'zheng', 'zhong', 'zhu', 'zhua', 'zhuo', 'zhuai', 'zhui', 'zhuan', 'zhun', 'zhuang',
    'chi', 'cha', 'che', 'chai', 'chao', 'chou', 'chan', 'chen', 'chang', 'cheng', 'chong', 'chu', 'chua', 'chuo', 'chuai', 'chui', 'chuan', 'chun', 'chuang',
    'shi', 'sha', 'she', 'shai', 'shei', 'shao', 'shou', 'shan', 'shen', 'shang', 'sheng', 'shu', 'shua', 'shuo', 'shuai', 'shui', 'shuan', 'shun', 'shuang',
    'ri', 're', 'rao', 'rou', 'ran', 'ren', 'rang', 'reng', 'rong', 'ru', 'rua', 'ruo', 'rui', 'ruan', 'run',
    'zi', 'za', 'ze', 'zei', 'zao', 'zou', 'zan', 'zen', 'zang', 'zeng', 'zong', 'zu', 'zuo', 'zui', 'zuan', 'zun',
    'ci', 'ca', 'ce', 'cai', 'cao', 'cou', 'can', 'cen', 'cang', 'ceng', 'cong', 'cu', 'cuo', 'cui', 'cuan', 'cun',
    'si', 'sa', 'se', 'sai', 'sao', 'sou', 'san', 'sen', 'sang', 'seng', 'song', 'su', 'suo', 'sui', 'suan', 'sun',
    'yi', 'ya', 'ye', 'yao', 'you', 'yan', 'yin', 'yang', 'ying', 'yong', 'wu', 'wa', 'wo', 'wai', 'wei', 'wan', 'wen', 'wang', 'weng', 'yu', 'yue', 'yuan', 'yun'
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
            console.log(`Probando: "${sub}" -> normalizado: "${normalizedSub}"`);
            if (pinyinSyllableSet.has(normalizedSub)) {
                longestMatch = sub;
                console.log(`  ✅ Match encontrado: "${longestMatch}"`);
            }
        }

        if (longestMatch) {
            result.push(longestMatch);
            i += longestMatch.length;
            console.log(`  ➡️ Añadido "${longestMatch}", avanzando a posición ${i}`);
        } else {
            console.warn('Could not segment at:', pinyin.substring(i));
            return pinyin;
        }
    }
    console.log('Resultado final:', result.join(' '));
    return result.join(' ');
}

// Test con diferentes casos
console.log('=== Test 1: zhandou (sin tonos) ===');
segmentPinyin('zhandou');

console.log('\n=== Test 2: zhàndòu (con tonos) ===');
segmentPinyin('zhàndòu');

console.log('\n=== Test 3: Verificar si zhan y dou están en el set ===');
console.log('¿"zhan" está en el set?:', pinyinSyllableSet.has('zhan'));
console.log('¿"dou" está en el set?:', pinyinSyllableSet.has('dou'));
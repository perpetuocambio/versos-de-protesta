// Test de detección de tonos para colores
function getToneClass(pinyin) {
    if (/[āēīōū]/.test(pinyin)) return 'tone-1';
    if (/[áéíóú]/.test(pinyin)) return 'tone-2';
    if (/[ǎěǐǒǔ]/.test(pinyin)) return 'tone-3';
    if (/[àèìòù]/.test(pinyin)) return 'tone-4';
    return 'tone-5';
}

// Test con ejemplos del vocabulario
const testCases = [
    'zhàn',  // tono 4 - debería ser azul
    'dòu',   // tono 4 - debería ser azul  
    'gōng',  // tono 1 - debería ser rojo
    'rén',   // tono 2 - debería ser naranja
    'mǎ',    // tono 3 - debería ser verde
    'de',    // tono 5 - debería ser gris
    'tuán',  // tono 2 - debería ser naranja
    'jié'    // tono 2 - debería ser naranja
];

const toneColors = {
    'tone-1': '🔴 Rojo (#f44336)',
    'tone-2': '🟠 Naranja (#ff9800)', 
    'tone-3': '🟢 Verde (#4caf50)',
    'tone-4': '🔵 Azul (#2196f3)',
    'tone-5': '⚪ Gris (#9e9e9e)'
};

console.log('=== Test de detección de tonos ===\n');

testCases.forEach(pinyin => {
    const toneClass = getToneClass(pinyin);
    const color = toneColors[toneClass];
    console.log(`"${pinyin}" → ${toneClass} → ${color}`);
});

console.log('\n=== Verificación de expresiones regulares ===');
console.log('Tono 1 (māng): /[āēīōū]/.test("māng"):', /[āēīōū]/.test("māng"));  
console.log('Tono 2 (rén): /[áéíóú]/.test("rén"):', /[áéíóú]/.test("rén"));
console.log('Tono 3 (mǎ): /[ǎěǐǒǔ]/.test("mǎ"):', /[ǎěǐǒǔ]/.test("mǎ"));
console.log('Tono 4 (zhàn): /[àèìòù]/.test("zhàn"):', /[àèìòù]/.test("zhàn"));
console.log('Sin tono (de): ninguna regex coincide:', getToneClass("de"));
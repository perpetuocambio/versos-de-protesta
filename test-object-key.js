// Test object keys with pinyin

const testKey = "bèi zhànshèng de";
console.log('Original key:', JSON.stringify(testKey));

const obj = {};
obj[testKey] = { data: "test" };

console.log('Object keys:', Object.keys(obj));
console.log('Key from object:', JSON.stringify(Object.keys(obj)[0]));
console.log('Are they equal?:', testKey === Object.keys(obj)[0]);

// Test JSON round trip
const jsonString = JSON.stringify(obj);
console.log('JSON string:', jsonString);

const parsed = JSON.parse(jsonString);
console.log('Parsed keys:', Object.keys(parsed));
console.log('Parsed key:', JSON.stringify(Object.keys(parsed)[0]));
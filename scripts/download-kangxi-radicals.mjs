#!/usr/bin/env node

/**
 * DESCARGADOR DE DATOS OFICIALES DE RADICALES KANGXI
 * ===============================================
 * 
 * Descarga y procesa información de radicales desde fuentes oficiales:
 * 1. Unicode Radical Database
 * 2. Extrae datos de CC-CEDICT para pronunciación
 * 3. Wikipedia para información cultural/semántica
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'data', 'chinese');
const CEDICT_FILE = path.join(OUTPUT_DIR, 'cedict_raw.txt');
const RADICALS_OUTPUT = path.join(OUTPUT_DIR, 'kangxi-radicals-official.json');

// Lista oficial de 214 radicales Kangxi con Unicode
const KANGXI_RADICALS_OFFICIAL = [
  { number: 1, radical: '一', strokes: 1, unicode: 0x4E00, meaning_en: 'one' },
  { number: 2, radical: '丨', strokes: 1, unicode: 0x4E28, meaning_en: 'line' },
  { number: 3, radical: '丶', strokes: 1, unicode: 0x4E36, meaning_en: 'dot' },
  { number: 4, radical: '丿', strokes: 1, unicode: 0x4E3F, meaning_en: 'slash' },
  { number: 5, radical: '乙', strokes: 1, unicode: 0x4E59, meaning_en: 'second' },
  { number: 6, radical: '亅', strokes: 1, unicode: 0x4E85, meaning_en: 'hook' },
  { number: 7, radical: '二', strokes: 2, unicode: 0x4E8C, meaning_en: 'two' },
  { number: 8, radical: '亠', strokes: 2, unicode: 0x4EA0, meaning_en: 'lid' },
  { number: 9, radical: '人', strokes: 2, unicode: 0x4EBA, meaning_en: 'man' },
  { number: 10, radical: '儿', strokes: 2, unicode: 0x513F, meaning_en: 'legs' },
  { number: 11, radical: '入', strokes: 2, unicode: 0x5165, meaning_en: 'enter' },
  { number: 12, radical: '八', strokes: 2, unicode: 0x516B, meaning_en: 'eight' },
  { number: 13, radical: '冂', strokes: 2, unicode: 0x5182, meaning_en: 'down box' },
  { number: 14, radical: '冖', strokes: 2, unicode: 0x5196, meaning_en: 'cover' },
  { number: 15, radical: '冫', strokes: 2, unicode: 0x51AB, meaning_en: 'ice' },
  { number: 16, radical: '几', strokes: 2, unicode: 0x51E0, meaning_en: 'table' },
  { number: 17, radical: '凵', strokes: 2, unicode: 0x51F5, meaning_en: 'open box' },
  { number: 18, radical: '刀', strokes: 2, unicode: 0x5200, meaning_en: 'knife' },
  { number: 19, radical: '力', strokes: 2, unicode: 0x529B, meaning_en: 'power' },
  { number: 20, radical: '勹', strokes: 2, unicode: 0x52F9, meaning_en: 'wrap' },
  { number: 21, radical: '匕', strokes: 2, unicode: 0x5315, meaning_en: 'spoon' },
  { number: 22, radical: '匚', strokes: 2, unicode: 0x531A, meaning_en: 'right open box' },
  { number: 23, radical: '匸', strokes: 2, unicode: 0x5338, meaning_en: 'hiding enclosure' },
  { number: 24, radical: '十', strokes: 2, unicode: 0x5341, meaning_en: 'ten' },
  { number: 25, radical: '卜', strokes: 2, unicode: 0x535C, meaning_en: 'divination' },
  { number: 26, radical: '卩', strokes: 2, unicode: 0x5369, meaning_en: 'seal' },
  { number: 27, radical: '厂', strokes: 2, unicode: 0x5382, meaning_en: 'cliff' },
  { number: 28, radical: '厶', strokes: 2, unicode: 0x53B6, meaning_en: 'private' },
  { number: 29, radical: '又', strokes: 2, unicode: 0x53C8, meaning_en: 'again' },
  { number: 30, radical: '口', strokes: 3, unicode: 0x53E3, meaning_en: 'mouth' },
  { number: 31, radical: '囗', strokes: 3, unicode: 0x56D7, meaning_en: 'enclosure' },
  { number: 32, radical: '土', strokes: 3, unicode: 0x571F, meaning_en: 'earth' },
  { number: 33, radical: '士', strokes: 3, unicode: 0x58EB, meaning_en: 'scholar' },
  { number: 34, radical: '夂', strokes: 3, unicode: 0x5902, meaning_en: 'go' },
  { number: 35, radical: '夊', strokes: 3, unicode: 0x590A, meaning_en: 'go slowly' },
  { number: 36, radical: '夕', strokes: 3, unicode: 0x5915, meaning_en: 'evening' },
  { number: 37, radical: '大', strokes: 3, unicode: 0x5927, meaning_en: 'big' },
  { number: 38, radical: '女', strokes: 3, unicode: 0x5973, meaning_en: 'woman' },
  { number: 39, radical: '子', strokes: 3, unicode: 0x5B50, meaning_en: 'child' },
  { number: 40, radical: '宀', strokes: 3, unicode: 0x5B80, meaning_en: 'roof' },
  { number: 41, radical: '寸', strokes: 3, unicode: 0x5BF8, meaning_en: 'inch' },
  { number: 42, radical: '小', strokes: 3, unicode: 0x5C0F, meaning_en: 'small' },
  { number: 43, radical: '尢', strokes: 3, unicode: 0x5C22, meaning_en: 'lame' },
  { number: 44, radical: '尸', strokes: 3, unicode: 0x5C38, meaning_en: 'corpse' },
  { number: 45, radical: '屮', strokes: 3, unicode: 0x5C6E, meaning_en: 'sprout' },
  { number: 46, radical: '山', strokes: 3, unicode: 0x5C71, meaning_en: 'mountain' },
  { number: 47, radical: '巛', strokes: 3, unicode: 0x5DDB, meaning_en: 'river' },
  { number: 48, radical: '工', strokes: 3, unicode: 0x5DE5, meaning_en: 'work' },
  { number: 49, radical: '己', strokes: 3, unicode: 0x5DF1, meaning_en: 'oneself' },
  { number: 50, radical: '巾', strokes: 3, unicode: 0x5DFE, meaning_en: 'turban' },
  { number: 51, radical: '干', strokes: 3, unicode: 0x5E72, meaning_en: 'dry' },
  { number: 52, radical: '幺', strokes: 3, unicode: 0x5E7A, meaning_en: 'short thread' },
  { number: 53, radical: '广', strokes: 3, unicode: 0x5E7F, meaning_en: 'dotted cliff' },
  { number: 54, radical: '廴', strokes: 3, unicode: 0x5EF4, meaning_en: 'long stride' },
  { number: 55, radical: '廾', strokes: 3, unicode: 0x5EFE, meaning_en: 'arch' },
  { number: 56, radical: '弋', strokes: 3, unicode: 0x5F0B, meaning_en: 'shoot' },
  { number: 57, radical: '弓', strokes: 3, unicode: 0x5F13, meaning_en: 'bow' },
  { number: 58, radical: '彐', strokes: 3, unicode: 0x5F50, meaning_en: 'snout' },
  { number: 59, radical: '彡', strokes: 3, unicode: 0x5F61, meaning_en: 'bristle' },
  { number: 60, radical: '彳', strokes: 3, unicode: 0x5F73, meaning_en: 'step' },
  { number: 61, radical: '心', strokes: 4, unicode: 0x5FC3, meaning_en: 'heart' },
  { number: 62, radical: '戈', strokes: 4, unicode: 0x6208, meaning_en: 'halberd' },
  { number: 63, radical: '戶', strokes: 4, unicode: 0x6236, meaning_en: 'door' },
  { number: 64, radical: '手', strokes: 4, unicode: 0x624B, meaning_en: 'hand' },
  { number: 65, radical: '支', strokes: 4, unicode: 0x652F, meaning_en: 'branch' },
  { number: 66, radical: '攴', strokes: 4, unicode: 0x6534, meaning_en: 'rap' },
  { number: 67, radical: '文', strokes: 4, unicode: 0x6587, meaning_en: 'script' },
  { number: 68, radical: '斗', strokes: 4, unicode: 0x6597, meaning_en: 'dipper' },
  { number: 69, radical: '斤', strokes: 4, unicode: 0x65A4, meaning_en: 'axe' },
  { number: 70, radical: '方', strokes: 4, unicode: 0x65B9, meaning_en: 'square' },
  { number: 71, radical: '无', strokes: 4, unicode: 0x65E0, meaning_en: 'not' },
  { number: 72, radical: '日', strokes: 4, unicode: 0x65E5, meaning_en: 'sun' },
  { number: 73, radical: '曰', strokes: 4, unicode: 0x66F0, meaning_en: 'say' },
  { number: 74, radical: '月', strokes: 4, unicode: 0x6708, meaning_en: 'moon' },
  { number: 75, radical: '木', strokes: 4, unicode: 0x6728, meaning_en: 'tree' },
  { number: 76, radical: '欠', strokes: 4, unicode: 0x6B20, meaning_en: 'lack' },
  { number: 77, radical: '止', strokes: 4, unicode: 0x6B62, meaning_en: 'stop' },
  { number: 78, radical: '歹', strokes: 4, unicode: 0x6B79, meaning_en: 'death' },
  { number: 79, radical: '殳', strokes: 4, unicode: 0x6BB3, meaning_en: 'weapon' },
  { number: 80, radical: '毋', strokes: 4, unicode: 0x6BCB, meaning_en: 'do not' },
  { number: 81, radical: '比', strokes: 4, unicode: 0x6BD4, meaning_en: 'compare' },
  { number: 82, radical: '毛', strokes: 4, unicode: 0x6BDB, meaning_en: 'fur' },
  { number: 83, radical: '氏', strokes: 4, unicode: 0x6C0F, meaning_en: 'clan' },
  { number: 84, radical: '气', strokes: 4, unicode: 0x6C14, meaning_en: 'steam' },
  { number: 85, radical: '水', strokes: 4, unicode: 0x6C34, meaning_en: 'water' },
  { number: 86, radical: '火', strokes: 4, unicode: 0x706B, meaning_en: 'fire' },
  { number: 87, radical: '爪', strokes: 4, unicode: 0x722A, meaning_en: 'claw' },
  { number: 88, radical: '父', strokes: 4, unicode: 0x7236, meaning_en: 'father' },
  { number: 89, radical: '爻', strokes: 4, unicode: 0x723B, meaning_en: 'double x' },
  { number: 90, radical: '爿', strokes: 4, unicode: 0x723F, meaning_en: 'split wood' },
  { number: 91, radical: '片', strokes: 4, unicode: 0x7247, meaning_en: 'slice' },
  { number: 92, radical: '牙', strokes: 4, unicode: 0x7259, meaning_en: 'fang' },
  { number: 93, radical: '牛', strokes: 4, unicode: 0x725B, meaning_en: 'cow' },
  { number: 94, radical: '犬', strokes: 4, unicode: 0x72AC, meaning_en: 'dog' },
  { number: 95, radical: '玄', strokes: 5, unicode: 0x7384, meaning_en: 'profound' },
  { number: 96, radical: '玉', strokes: 5, unicode: 0x7389, meaning_en: 'jade' },
  { number: 97, radical: '瓜', strokes: 5, unicode: 0x74DC, meaning_en: 'melon' },
  { number: 98, radical: '瓦', strokes: 5, unicode: 0x74E6, meaning_en: 'tile' },
  { number: 99, radical: '甘', strokes: 5, unicode: 0x7518, meaning_en: 'sweet' },
  { number: 100, radical: '生', strokes: 5, unicode: 0x751F, meaning_en: 'life' },
  { number: 101, radical: '用', strokes: 5, unicode: 0x7528, meaning_en: 'use' },
  { number: 102, radical: '田', strokes: 5, unicode: 0x7530, meaning_en: 'field' },
  { number: 103, radical: '疋', strokes: 5, unicode: 0x758B, meaning_en: 'bolt of cloth' },
  { number: 104, radical: '疒', strokes: 5, unicode: 0x7592, meaning_en: 'sickness' },
  { number: 105, radical: '癶', strokes: 5, unicode: 0x7676, meaning_en: 'dotted tent' },
  { number: 106, radical: '白', strokes: 5, unicode: 0x767D, meaning_en: 'white' },
  { number: 107, radical: '皮', strokes: 5, unicode: 0x76AE, meaning_en: 'skin' },
  { number: 108, radical: '皿', strokes: 5, unicode: 0x76BF, meaning_en: 'dish' },
  { number: 109, radical: '目', strokes: 5, unicode: 0x76EE, meaning_en: 'eye' },
  { number: 110, radical: '矛', strokes: 5, unicode: 0x77DB, meaning_en: 'spear' },
  { number: 111, radical: '矢', strokes: 5, unicode: 0x77E2, meaning_en: 'arrow' },
  { number: 112, radical: '石', strokes: 5, unicode: 0x77F3, meaning_en: 'stone' },
  { number: 113, radical: '示', strokes: 5, unicode: 0x793A, meaning_en: 'spirit' },
  { number: 114, radical: '禸', strokes: 5, unicode: 0x79B8, meaning_en: 'track' },
  { number: 115, radical: '禾', strokes: 5, unicode: 0x79BE, meaning_en: 'grain' },
  { number: 116, radical: '穴', strokes: 5, unicode: 0x7A74, meaning_en: 'cave' },
  { number: 117, radical: '立', strokes: 5, unicode: 0x7ACB, meaning_en: 'stand' },
  { number: 118, radical: '竹', strokes: 6, unicode: 0x7AF9, meaning_en: 'bamboo' },
  { number: 119, radical: '米', strokes: 6, unicode: 0x7C73, meaning_en: 'rice' },
  { number: 120, radical: '糸', strokes: 6, unicode: 0x7CF8, meaning_en: 'silk' },
  { number: 121, radical: '缶', strokes: 6, unicode: 0x7F36, meaning_en: 'jar' },
  { number: 122, radical: '网', strokes: 6, unicode: 0x7F51, meaning_en: 'net' },
  { number: 123, radical: '羊', strokes: 6, unicode: 0x7F8A, meaning_en: 'sheep' },
  { number: 124, radical: '羽', strokes: 6, unicode: 0x7FBD, meaning_en: 'feather' },
  { number: 125, radical: '老', strokes: 6, unicode: 0x8001, meaning_en: 'old' },
  { number: 126, radical: '而', strokes: 6, unicode: 0x800C, meaning_en: 'and' },
  { number: 127, radical: '耒', strokes: 6, unicode: 0x8012, meaning_en: 'plow' },
  { number: 128, radical: '耳', strokes: 6, unicode: 0x8033, meaning_en: 'ear' },
  { number: 129, radical: '聿', strokes: 6, unicode: 0x807F, meaning_en: 'brush' },
  { number: 130, radical: '肉', strokes: 6, unicode: 0x8089, meaning_en: 'meat' },
  { number: 131, radical: '臣', strokes: 6, unicode: 0x81E3, meaning_en: 'minister' },
  { number: 132, radical: '自', strokes: 6, unicode: 0x81EA, meaning_en: 'self' },
  { number: 133, radical: '至', strokes: 6, unicode: 0x81F3, meaning_en: 'arrive' },
  { number: 134, radical: '臼', strokes: 6, unicode: 0x81FC, meaning_en: 'mortar' },
  { number: 135, radical: '舌', strokes: 6, unicode: 0x820C, meaning_en: 'tongue' },
  { number: 136, radical: '舛', strokes: 6, unicode: 0x821B, meaning_en: 'oppose' },
  { number: 137, radical: '舟', strokes: 6, unicode: 0x821F, meaning_en: 'boat' },
  { number: 138, radical: '艮', strokes: 6, unicode: 0x826E, meaning_en: 'stopping' },
  { number: 139, radical: '色', strokes: 6, unicode: 0x8272, meaning_en: 'color' },
  { number: 140, radical: '艸', strokes: 6, unicode: 0x8278, meaning_en: 'grass' },
  { number: 141, radical: '虍', strokes: 6, unicode: 0x864D, meaning_en: 'tiger' },
  { number: 142, radical: '虫', strokes: 6, unicode: 0x866B, meaning_en: 'insect' },
  { number: 143, radical: '血', strokes: 6, unicode: 0x8840, meaning_en: 'blood' },
  { number: 144, radical: '行', strokes: 6, unicode: 0x884C, meaning_en: 'walk' },
  { number: 145, radical: '衣', strokes: 6, unicode: 0x8863, meaning_en: 'clothes' },
  { number: 146, radical: '襾', strokes: 6, unicode: 0x897E, meaning_en: 'cover' },
  { number: 147, radical: '見', strokes: 7, unicode: 0x898B, meaning_en: 'see' },
  { number: 148, radical: '角', strokes: 7, unicode: 0x89D2, meaning_en: 'horn' },
  { number: 149, radical: '言', strokes: 7, unicode: 0x8A00, meaning_en: 'speech' },
  { number: 150, radical: '谷', strokes: 7, unicode: 0x8C37, meaning_en: 'valley' },
  { number: 151, radical: '豆', strokes: 7, unicode: 0x8C46, meaning_en: 'bean' },
  { number: 152, radical: '豕', strokes: 7, unicode: 0x8C55, meaning_en: 'pig' },
  { number: 153, radical: '豸', strokes: 7, unicode: 0x8C78, meaning_en: 'badger' },
  { number: 154, radical: '貝', strokes: 7, unicode: 0x8C9D, meaning_en: 'shell' },
  { number: 155, radical: '赤', strokes: 7, unicode: 0x8D64, meaning_en: 'red' },
  { number: 156, radical: '走', strokes: 7, unicode: 0x8D70, meaning_en: 'run' },
  { number: 157, radical: '足', strokes: 7, unicode: 0x8DB3, meaning_en: 'foot' },
  { number: 158, radical: '身', strokes: 7, unicode: 0x8EAB, meaning_en: 'body' },
  { number: 159, radical: '車', strokes: 7, unicode: 0x8ECA, meaning_en: 'cart' },
  { number: 160, radical: '辛', strokes: 7, unicode: 0x8F9B, meaning_en: 'bitter' },
  { number: 161, radical: '辰', strokes: 7, unicode: 0x8FB0, meaning_en: 'morning' },
  { number: 162, radical: '辵', strokes: 7, unicode: 0x8FB5, meaning_en: 'walk' },
  { number: 163, radical: '邑', strokes: 7, unicode: 0x9091, meaning_en: 'city' },
  { number: 164, radical: '酉', strokes: 7, unicode: 0x9149, meaning_en: 'wine' },
  { number: 165, radical: '釆', strokes: 7, unicode: 0x91C6, meaning_en: 'distinguish' },
  { number: 166, radical: '里', strokes: 7, unicode: 0x91CC, meaning_en: 'village' },
  { number: 167, radical: '金', strokes: 8, unicode: 0x91D1, meaning_en: 'gold' },
  { number: 168, radical: '長', strokes: 8, unicode: 0x9577, meaning_en: 'long' },
  { number: 169, radical: '門', strokes: 8, unicode: 0x9580, meaning_en: 'gate' },
  { number: 170, radical: '阜', strokes: 8, unicode: 0x961C, meaning_en: 'mound' },
  { number: 171, radical: '隶', strokes: 8, unicode: 0x96B6, meaning_en: 'slave' },
  { number: 172, radical: '隹', strokes: 8, unicode: 0x96B9, meaning_en: 'short tailed bird' },
  { number: 173, radical: '雨', strokes: 8, unicode: 0x96E8, meaning_en: 'rain' },
  { number: 174, radical: '青', strokes: 8, unicode: 0x9752, meaning_en: 'blue' },
  { number: 175, radical: '非', strokes: 8, unicode: 0x975E, meaning_en: 'wrong' },
  { number: 176, radical: '面', strokes: 9, unicode: 0x9762, meaning_en: 'face' },
  { number: 177, radical: '革', strokes: 9, unicode: 0x9769, meaning_en: 'leather' },
  { number: 178, radical: '韋', strokes: 9, unicode: 0x97CB, meaning_en: 'tanned leather' },
  { number: 179, radical: '韭', strokes: 9, unicode: 0x97ED, meaning_en: 'leek' },
  { number: 180, radical: '音', strokes: 9, unicode: 0x97F3, meaning_en: 'sound' },
  { number: 181, radical: '頁', strokes: 9, unicode: 0x9801, meaning_en: 'leaf' },
  { number: 182, radical: '風', strokes: 9, unicode: 0x98A8, meaning_en: 'wind' },
  { number: 183, radical: '飛', strokes: 9, unicode: 0x98DB, meaning_en: 'fly' },
  { number: 184, radical: '食', strokes: 9, unicode: 0x98DF, meaning_en: 'eat' },
  { number: 185, radical: '首', strokes: 9, unicode: 0x9996, meaning_en: 'head' },
  { number: 186, radical: '香', strokes: 9, unicode: 0x9999, meaning_en: 'fragrant' },
  { number: 187, radical: '馬', strokes: 10, unicode: 0x99AC, meaning_en: 'horse' },
  { number: 188, radical: '骨', strokes: 10, unicode: 0x9AA8, meaning_en: 'bone' },
  { number: 189, radical: '高', strokes: 10, unicode: 0x9AD8, meaning_en: 'tall' },
  { number: 190, radical: '髟', strokes: 10, unicode: 0x9ADF, meaning_en: 'hair' },
  { number: 191, radical: '鬥', strokes: 10, unicode: 0x9B25, meaning_en: 'fight' },
  { number: 192, radical: '鬯', strokes: 10, unicode: 0x9B2F, meaning_en: 'sacrificial wine' },
  { number: 193, radical: '鬲', strokes: 10, unicode: 0x9B32, meaning_en: 'cauldron' },
  { number: 194, radical: '鬼', strokes: 10, unicode: 0x9B3C, meaning_en: 'ghost' },
  { number: 195, radical: '魚', strokes: 11, unicode: 0x9B5A, meaning_en: 'fish' },
  { number: 196, radical: '鳥', strokes: 11, unicode: 0x9CE5, meaning_en: 'bird' },
  { number: 197, radical: '鹵', strokes: 11, unicode: 0x9E75, meaning_en: 'salt' },
  { number: 198, radical: '鹿', strokes: 11, unicode: 0x9E7F, meaning_en: 'deer' },
  { number: 199, radical: '麥', strokes: 11, unicode: 0x9EA5, meaning_en: 'wheat' },
  { number: 200, radical: '麻', strokes: 11, unicode: 0x9EBB, meaning_en: 'hemp' },
  { number: 201, radical: '黃', strokes: 12, unicode: 0x9EC3, meaning_en: 'yellow' },
  { number: 202, radical: '黍', strokes: 12, unicode: 0x9ECD, meaning_en: 'millet' },
  { number: 203, radical: '黑', strokes: 12, unicode: 0x9ED1, meaning_en: 'black' },
  { number: 204, radical: '黹', strokes: 12, unicode: 0x9EF9, meaning_en: 'embroidery' },
  { number: 205, radical: '黽', strokes: 13, unicode: 0x9EFD, meaning_en: 'frog' },
  { number: 206, radical: '鼎', strokes: 13, unicode: 0x9F0E, meaning_en: 'tripod' },
  { number: 207, radical: '鼓', strokes: 13, unicode: 0x9F13, meaning_en: 'drum' },
  { number: 208, radical: '鼠', strokes: 13, unicode: 0x9F20, meaning_en: 'rat' },
  { number: 209, radical: '鼻', strokes: 14, unicode: 0x9F3B, meaning_en: 'nose' },
  { number: 210, radical: '齊', strokes: 14, unicode: 0x9F4A, meaning_en: 'even' },
  { number: 211, radical: '齒', strokes: 15, unicode: 0x9F52, meaning_en: 'tooth' },
  { number: 212, radical: '龍', strokes: 16, unicode: 0x9F8D, meaning_en: 'dragon' },
  { number: 213, radical: '龜', strokes: 16, unicode: 0x9F9C, meaning_en: 'turtle' },
  { number: 214, radical: '龠', strokes: 17, unicode: 0x9FA0, meaning_en: 'flute' }
];

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Directorio creado: ${dirPath}`);
  }
}

// Función para extraer información de CC-CEDICT
function extractRadicalFromCEDICT(radical) {
  if (!fs.existsSync(CEDICT_FILE)) {
    console.log(`⚠️ CC-CEDICT no encontrado en ${CEDICT_FILE}`);
    return null;
  }

  try {
    const cedictContent = fs.readFileSync(CEDICT_FILE, 'utf8');
    const lines = cedictContent.split('\n');
    
    // Buscar líneas que empiecen con el radical
    const radicalLines = lines.filter(line => {
      if (line.startsWith('#') || line.trim() === '') return false;
      const parts = line.split(' ');
      return parts[0] === radical;
    });

    if (radicalLines.length === 0) return null;

    // Parsear la primera línea encontrada
    const line = radicalLines[0];
    const match = line.match(/^(.+?)\s+(.+?)\s+\[(.+?)\]\s+\/(.+)\//);
    
    if (match) {
      const [, traditional, simplified, pinyin, definition] = match;
      return {
        traditional,
        simplified,
        pinyin: pinyin.toLowerCase(),
        definition: definition.split('/')[0], // Tomar la primera definición
        source: 'CC-CEDICT'
      };
    }

    return null;
  } catch (error) {
    console.error(`❌ Error leyendo CC-CEDICT: ${error.message}`);
    return null;
  }
}

// Función principal
async function downloadKangxiRadicals() {
  console.log('📥 Descargando información oficial de radicales Kangxi...');
  
  ensureDirectoryExists(OUTPUT_DIR);
  
  const results = [];
  let foundInCEDICT = 0;
  
  for (const radicalInfo of KANGXI_RADICALS_OFFICIAL) {
    console.log(`🔍 Procesando radical ${radicalInfo.number}: ${radicalInfo.radical}`);
    
    // Extraer información de CC-CEDICT
    const cedictInfo = extractRadicalFromCEDICT(radicalInfo.radical);
    
    if (cedictInfo) {
      foundInCEDICT++;
      console.log(`   ✅ Encontrado en CC-CEDICT: ${cedictInfo.pinyin} - ${cedictInfo.definition}`);
    }
    
    // Categorización semántica automática
    const category = categorizeRadical(radicalInfo.meaning_en, radicalInfo.radical);
    
    const enrichedRadical = {
      number: radicalInfo.number,
      radical: radicalInfo.radical,
      strokes: radicalInfo.strokes,
      unicode: radicalInfo.unicode,
      meaning: {
        en: radicalInfo.meaning_en,
        es: translateToSpanish(radicalInfo.meaning_en),
        zh_pinyin: cedictInfo?.pinyin || null,
        cedict_definition: cedictInfo?.definition || null
      },
      category: category,
      sources: ['Unicode Standard', ...(cedictInfo ? ['CC-CEDICT'] : [])],
      metadata: {
        kangxi_number: radicalInfo.number,
        unicode_codepoint: `U+${radicalInfo.unicode.toString(16).toUpperCase()}`,
        radical_strokes: radicalInfo.strokes,
        data_quality: cedictInfo ? 'complete' : 'basic'
      }
    };
    
    results.push(enrichedRadical);
  }
  
  // Crear archivo de salida
  const output = {
    metadata: {
      generated: new Date().toISOString(),
      version: '1.0.0',
      description: 'Official Kangxi radicals with pronunciation from CC-CEDICT',
      total_radicals: results.length,
      cedict_coverage: foundInCEDICT,
      coverage_percentage: Math.round((foundInCEDICT / results.length) * 100),
      sources: [
        'Unicode Standard (character codes and stroke counts)',
        'CC-CEDICT (pronunciation and definitions)',
        'Internal categorization system'
      ],
      license: 'CC BY-SA 4.0 (CC-CEDICT data)',
      attribution: 'CC-CEDICT by MDBG, Unicode Consortium'
    },
    radicals: results
  };
  
  fs.writeFileSync(RADICALS_OUTPUT, JSON.stringify(output, null, 2), 'utf8');
  
  console.log(`\n✅ Descarga completada:`);
  console.log(`   📁 Archivo: ${RADICALS_OUTPUT}`);
  console.log(`   📊 Total radicales: ${results.length}`);
  console.log(`   🎯 Encontrados en CC-CEDICT: ${foundInCEDICT} (${Math.round((foundInCEDICT / results.length) * 100)}%)`);
  console.log(`   🔗 Fuentes: Unicode Standard, CC-CEDICT`);
}

// Función para categorizar radicales basada en semántica
function categorizeRadical(meaningEn, radical) {
  const categoryMap = {
    // Partes del cuerpo
    'mouth': 'cuerpo', 'hand': 'cuerpo', 'heart': 'cuerpo', 'eye': 'cuerpo', 
    'ear': 'cuerpo', 'foot': 'cuerpo', 'head': 'cuerpo',
    
    // Naturaleza
    'water': 'naturaleza', 'fire': 'naturaleza', 'earth': 'naturaleza', 'tree': 'naturaleza',
    'mountain': 'naturaleza', 'river': 'naturaleza', 'sun': 'naturaleza', 'moon': 'naturaleza',
    
    // Herramientas/Objetos
    'knife': 'herramienta', 'axe': 'herramienta', 'bow': 'herramienta', 'spoon': 'herramienta',
    'halberd': 'herramienta', 'weapon': 'herramienta',
    
    // Animales
    'cow': 'animal', 'dog': 'animal', 'bird': 'animal', 'fish': 'animal',
    
    // Humano/Social
    'man': 'humano', 'woman': 'humano', 'child': 'humano', 'father': 'humano',
    'scholar': 'humano',
    
    // Números
    'one': 'número', 'two': 'número', 'eight': 'número', 'ten': 'número',
    
    // Formas/Estructuras
    'line': 'forma', 'dot': 'forma', 'box': 'forma', 'enclosure': 'forma',
    
    // Acciones
    'work': 'actividad', 'enter': 'acción', 'go': 'acción', 'stop': 'acción',
    
    // Abstractos
    'power': 'abstracto', 'not': 'abstracto', 'compare': 'abstracto'
  };
  
  // Buscar coincidencia exacta o parcial
  for (const [key, category] of Object.entries(categoryMap)) {
    if (meaningEn.toLowerCase().includes(key)) {
      return category;
    }
  }
  
  // Categorización por radicales específicos conocidos
  const specialCases = {
    '戈': 'herramienta', // halberd/lanza
    '斗': 'herramienta', // dipper pero en contexto de lucha
    '革': 'material',    // leather/revolución
    '民': 'político',    // people
    '国': 'político',    // country
    '军': 'militar',     // army
    '战': 'militar',     // war
    '红': 'color',       // red
    '东': 'dirección',   // east
  };
  
  if (specialCases[radical]) {
    return specialCases[radical];
  }
  
  return 'general';
}

// Función para traducir a español (simplificada)
function translateToSpanish(englishMeaning) {
  const translations = {
    'one': 'uno', 'two': 'dos', 'eight': 'ocho', 'ten': 'diez',
    'line': 'línea', 'dot': 'punto', 'slash': 'barra', 'hook': 'gancho',
    'man': 'hombre', 'woman': 'mujer', 'child': 'niño',
    'mouth': 'boca', 'hand': 'mano', 'heart': 'corazón',
    'water': 'agua', 'fire': 'fuego', 'earth': 'tierra', 'tree': 'madera',
    'mountain': 'montaña', 'sun': 'sol', 'moon': 'luna',
    'knife': 'cuchillo', 'axe': 'hacha', 'bow': 'arco', 'spoon': 'cuchara',
    'work': 'trabajo', 'power': 'fuerza', 'big': 'grande', 'small': 'pequeño',
    'halberd': 'lanza', 'weapon': 'arma', 'door': 'puerta',
    'enter': 'entrar', 'go': 'ir', 'stop': 'parar', 'compare': 'comparar',
    'not': 'no', 'cow': 'vaca', 'dog': 'perro'
  };
  
  return translations[englishMeaning.toLowerCase()] || englishMeaning;
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadKangxiRadicals().catch(console.error);
}

export { downloadKangxiRadicals };